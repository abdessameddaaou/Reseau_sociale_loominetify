import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment.dev';

@Injectable({ providedIn: 'root' })

export class RealtimeService {

  private socket?: Socket;

  /**
   * Connecter Socekt au serveur http du backend
   * @returns 
   */
  connect() {
    if (this.socket?.connected) return;
    const api = environment.apiUrl.replace(/\/$/, '');
    const socketUrl = api.slice(0, -4);
    this.socket = io(socketUrl, { withCredentials: true, transports: ['websocket']});
  }

  on<T>(event: string, cb: (payload: T) => void) {
    this.socket?.off(event);
    this.socket?.on(event, cb);
  }

  off(event: string) {
    this.socket?.off(event);
  }
}
