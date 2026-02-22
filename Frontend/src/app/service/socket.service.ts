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

    // ─── User Room ───
    joinUserRoom(userId: number) {
        this.socket.emit('joinUserRoom', userId);
    }

    // ─── Notifications ───
    onNewNotification(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('newNotification', (data) => observer.next(data));
        });
    }

    onNewFollow(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('newFollow', (data) => observer.next(data));
        });
    }

    onUnfollow(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('unfollow', (data) => observer.next(data));
        });
    }

    // ─── Messages ───
    onNewMessage(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('newMessage', (data) => observer.next(data));
        });
    }

    onNewConversation(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('newConversation', (data) => observer.next(data));
        });
    }

    // ─── Online Users ───
    getOnlineUsers() {
        this.socket.emit('getOnlineUsers');
    }

    onOnlineUsersList(): Observable<number[]> {
        return new Observable(observer => {
            this.socket.on('onlineUsersList', (userIds: number[]) => observer.next(userIds));
        });
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
        return new Observable(observer => {
            this.socket.on('incomingCall', (data) => observer.next(data));
        });
    }

    onCallAccepted(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('callAccepted', (data) => observer.next(data));
        });
    }

    onIceCandidate(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('iceCandidate', (data) => observer.next(data));
        });
    }

    onCallEnded(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('callEnded', (data) => observer.next(data));
        });
    }

    onCallDeclined(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('callDeclined', (data) => observer.next(data));
        });
    }
}

