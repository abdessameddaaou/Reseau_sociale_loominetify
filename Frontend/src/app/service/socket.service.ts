import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment.dev';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.apiUrl.replace('/api', ''), {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('✅ Connecté au serveur Socket.io');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Déconnecté du serveur Socket.io');
        });
    }

    /** Get raw socket for direct access */
    getSocket(): Socket { return this.socket; }

    // ─── Helper : crée un Observable avec teardown automatique ───
    // Évite l'accumulation de listeners lors des unsubscribe Angular
    private fromEvent<T>(event: string): Observable<T> {
        return new Observable<T>(observer => {
            const handler = (data: T) => observer.next(data);
            this.socket.on(event, handler);
            return () => this.socket.off(event, handler);
        });
    }

    // ─── User Room ───
    joinUserRoom(userId: number) {
        this.socket.emit('joinUserRoom', userId);
    }

    // ─── Notifications ───
    onNewNotification(): Observable<any> {
        return this.fromEvent('newNotification');
    }

    onNewFollow(): Observable<any> {
        return this.fromEvent('newFollow');
    }

    onUnfollow(): Observable<any> {
        return this.fromEvent('unfollow');
    }

    // ─── Messages ───
    onNewMessage(): Observable<any> {
        return this.fromEvent('newMessage');
    }

    onNewConversation(): Observable<any> {
        return this.fromEvent('newConversation');
    }

    // ─── Online Users ───
    getOnlineUsers() {
        this.socket.emit('getOnlineUsers');
    }

    onOnlineUsersList(): Observable<number[]> {
        return this.fromEvent<number[]>('onlineUsersList');
    }

    // ─── Call Signaling ───
    callUser(data: { conversationId: number; offer: any; callType: string; callerInfo: any; participants: number[] }) {
        this.socket.emit('callUser', data);
    }

    answerCall(data: { conversationId: number; answer: any; callerId: number; answererInfo: any }) {
        this.socket.emit('answerCall', data);
    }

    sendIceCandidate(data: { conversationId: number; candidate: any; targetUserId: number }) {
        this.socket.emit('iceCandidate', data);
    }

    endCall(data: { conversationId: number }) {
        this.socket.emit('endCall', data);
    }

    declineCall(data: { conversationId: number; callerId: number }) {
        this.socket.emit('declineCall', data);
    }

    onIncomingCall(): Observable<any> {
        return this.fromEvent('incomingCall');
    }

    onCallAccepted(): Observable<any> {
        return this.fromEvent('callAccepted');
    }

    onIceCandidate(): Observable<any> {
        return this.fromEvent('iceCandidate');
    }

    onCallEnded(): Observable<any> {
        return this.fromEvent('callEnded');
    }

    onCallDeclined(): Observable<any> {
        return this.fromEvent('callDeclined');
    }

    // ─── Traduction vocale ───

    /** Envoie un transcript vocal au backend pour traduction. */
    emitVoiceTranscript(data: { conversationId: number; text: string; sourceLang: string; targetLang: string }) {
        this.socket.emit('voiceTranscript', data);
    }

    /** Reçoit les traductions envoyées par les autres participants. */
    onTranslatedText(): Observable<any> {
        return this.fromEvent('translatedText');
    }

    /** Reçoit les erreurs de traduction du backend. */
    onTranslationError(): Observable<any> {
        return this.fromEvent('translationError');
    }
}
