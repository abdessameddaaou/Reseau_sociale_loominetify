import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { SocketService } from './socket.service';

export type CallState = 'idle' | 'calling' | 'ringing' | 'active' | 'ended';

export interface CallInfo {
    conversationId: number;
    callType: 'audio' | 'video';
    callerInfo: { id: number; name: string; photo: string | null };
    callerId: number;
    participants: number[];
    conversationName?: string;
    conversationAvatar?: string;
}

export interface RemoteStream {
    userId: number;
    stream: MediaStream;
    name?: string;
    photo?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CallService implements OnDestroy {

    // ── State ──
    callState$ = new BehaviorSubject<CallState>('idle');
    callInfo$ = new BehaviorSubject<CallInfo | null>(null);
    localStream$ = new BehaviorSubject<MediaStream | null>(null);
    remoteStreams$ = new BehaviorSubject<RemoteStream[]>([]);
    callDuration$ = new BehaviorSubject<number>(0);
    isMuted$ = new BehaviorSubject<boolean>(false);
    isVideoOff$ = new BehaviorSubject<boolean>(false);

    private incomingCall$ = new Subject<CallInfo>();
    get onIncomingCall$() { return this.incomingCall$.asObservable(); }

    // ── Internal ──
    private peerConnections = new Map<number, RTCPeerConnection>();
    private iceCandidateQueue = new Map<number, RTCIceCandidateInit[]>();
    private localStream: MediaStream | null = null;
    private durationInterval: any;
    private subs: Subscription[] = [];

    private readonly ICE_SERVERS: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    constructor(private socketService: SocketService) {
        this.setupSocketListeners();
    }

    // ═══════════════════════════════════════
    //  Socket Listeners
    // ═══════════════════════════════════════

    private setupSocketListeners() {
        // Incoming call
        this.subs.push(
            this.socketService.onIncomingCall().subscribe(data => {
                console.log('[CallService] Received incomingCall event:', data);
                if (this.callState$.value !== 'idle') {
                    console.warn(`[CallService] Ignoring incoming call because current state is NOT idle: ${this.callState$.value}`);
                    return; // Busy
                }
                const info: CallInfo = {
                    conversationId: data.conversationId,
                    callType: data.callType,
                    callerInfo: data.callerInfo,
                    callerId: data.callerId,
                    participants: [],
                };
                this.callInfo$.next(info);
                this.callState$.next('ringing');
                this.incomingCall$.next(info);
                // Store the offer for when user accepts
                (this as any)._pendingOffer = data.offer;
                console.log('[CallService] Call ringing overlay triggered.');
            })
        );

        // Call accepted (we are the caller)
        this.subs.push(
            this.socketService.onCallAccepted().subscribe(async (data) => {
                const pc = this.peerConnections.get(data.answererId);
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    // Flush queued ICE candidates
                    this.flushIceCandidates(data.answererId);
                }
                this.callState$.next('active');
                this.startDurationTimer();
            })
        );

        // ICE candidate
        this.subs.push(
            this.socketService.onIceCandidate().subscribe(async (data) => {
                const pc = this.peerConnections.get(data.fromUserId);
                if (pc && pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    // Queue for later
                    if (!this.iceCandidateQueue.has(data.fromUserId)) {
                        this.iceCandidateQueue.set(data.fromUserId, []);
                    }
                    this.iceCandidateQueue.get(data.fromUserId)!.push(data.candidate);
                }
            })
        );

        // Call ended
        this.subs.push(
            this.socketService.onCallEnded().subscribe(() => {
                this.cleanup();
            })
        );

        // Call declined
        this.subs.push(
            this.socketService.onCallDeclined().subscribe(() => {
                this.cleanup();
            })
        );
    }

    // ═══════════════════════════════════════
    //  Start Call (Caller side)
    // ═══════════════════════════════════════

    async startCall(
        conversationId: number,
        participants: number[],
        callType: 'audio' | 'video',
        callerInfo: { id: number; name: string; photo: string | null },
        conversationName?: string,
        conversationAvatar?: string
    ) {
        try {
            // Get local media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video'
            });
            this.localStream$.next(this.localStream);

            const info: CallInfo = {
                conversationId,
                callType,
                callerInfo,
                callerId: callerInfo.id,
                participants,
                conversationName,
                conversationAvatar
            };
            this.callInfo$.next(info);
            this.callState$.next('calling');

            // Create peer connections for each participant
            for (const pid of participants) {
                if (pid === callerInfo.id) continue;

                const pc = this.createPeerConnection(pid, conversationId);
                this.peerConnections.set(pid, pc);

                // Add local tracks
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream!);
                });

                // Create and send offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                this.socketService.callUser({
                    conversationId,
                    offer: pc.localDescription,
                    callType,
                    callerInfo,
                    participants
                });
            }
        } catch (err: any) {
            console.error('Error starting call:', err);
            this.cleanup();
            throw err;
        }
    }

    // ═══════════════════════════════════════
    //  Answer Call (Callee side)
    // ═══════════════════════════════════════

    async acceptCall(answererInfo: { id: number; name: string; photo: string | null }) {
        const info = this.callInfo$.value;
        if (!info) return;

        const pendingOffer = (this as any)._pendingOffer;
        if (!pendingOffer) return;

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: info.callType === 'video'
            });
            this.localStream$.next(this.localStream);

            const pc = this.createPeerConnection(info.callerId, info.conversationId);
            this.peerConnections.set(info.callerId, pc);

            // Add local tracks
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream!);
            });

            // Set remote description (the offer)
            await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer back
            this.socketService.answerCall({
                conversationId: info.conversationId,
                answer: pc.localDescription,
                callerId: info.callerId,
                answererInfo
            });

            // Flush queued ICE candidates
            this.flushIceCandidates(info.callerId);

            this.callState$.next('active');
            this.startDurationTimer();
            delete (this as any)._pendingOffer;
        } catch (err: any) {
            console.error('Error accepting call:', err);
            this.cleanup();
        }
    }

    // ═══════════════════════════════════════
    //  Decline / End Call
    // ═══════════════════════════════════════

    declineCall() {
        const info = this.callInfo$.value;
        if (info) {
            this.socketService.declineCall({
                conversationId: info.conversationId,
                callerId: info.callerId
            });
        }
        this.cleanup();
    }

    endCall() {
        const info = this.callInfo$.value;
        if (info) {
            this.socketService.endCall({ conversationId: info.conversationId });
        }
        this.cleanup();
    }

    // ═══════════════════════════════════════
    //  Controls
    // ═══════════════════════════════════════

    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isMuted$.next(!audioTrack.enabled);
            }
        }
    }

    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoOff$.next(!videoTrack.enabled);
            }
        }
    }

    // ═══════════════════════════════════════
    //  Internal
    // ═══════════════════════════════════════

    private createPeerConnection(targetUserId: number, conversationId: number): RTCPeerConnection {
        const pc = new RTCPeerConnection(this.ICE_SERVERS);

        // ICE candidate
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socketService.sendIceCandidate({
                    conversationId,
                    candidate: event.candidate.toJSON(),
                    targetUserId
                });
            }
        };

        // Remote stream
        pc.ontrack = (event) => {
            const streams = this.remoteStreams$.value;
            const existing = streams.find(s => s.userId === targetUserId);
            if (existing) {
                existing.stream = event.streams[0];
                this.remoteStreams$.next([...streams]);
            } else {
                this.remoteStreams$.next([
                    ...streams,
                    { userId: targetUserId, stream: event.streams[0] }
                ]);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                console.warn(`[Call] Peer ${targetUserId} connection ${pc.connectionState}`);
            }
        };

        return pc;
    }

    private flushIceCandidates(userId: number) {
        const queue = this.iceCandidateQueue.get(userId);
        const pc = this.peerConnections.get(userId);
        if (queue && pc) {
            queue.forEach(candidate => {
                pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
            });
            this.iceCandidateQueue.delete(userId);
        }
    }

    private startDurationTimer() {
        this.callDuration$.next(0);
        this.durationInterval = setInterval(() => {
            this.callDuration$.next(this.callDuration$.value + 1);
        }, 1000);
    }

    private cleanup() {
        // Stop all peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
        this.iceCandidateQueue.clear();

        // Stop local media
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }

        // Reset state
        this.localStream$.next(null);
        this.remoteStreams$.next([]);
        this.callState$.next('idle');
        this.callInfo$.next(null);
        this.isMuted$.next(false);
        this.isVideoOff$.next(false);

        clearInterval(this.durationInterval);
        this.callDuration$.next(0);

        delete (this as any)._pendingOffer;
    }

    ngOnDestroy() {
        this.cleanup();
        this.subs.forEach(s => s.unsubscribe());
    }
}
