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

}
