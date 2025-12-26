import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment.dev';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  socket?: Socket;

  /**
   * Connecter Socket au serveur http du backend
   */
  connect() {
    if (this.socket?.connected) return;
    const api = environment.apiUrl.replace(/\/$/, '');
    const socketUrl = api.slice(0, -4); // récupération de l'url sans le endpoint

    this.socket = io(socketUrl, { 
      withCredentials: true, 
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connecté au serveur avec ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Erreur de connexion:', err.message);
    });
  }

  /**
   * Écouter un événement (Nettoie l'ancien écouteur avant d'en créer un nouveau)
   */
  on<T>(event: string, cb: (payload: T) => void) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.off(event);
    this.socket?.on(event, cb);
  }

  /**
   * Se désabonner d'un événement spécifique
   */
  off(event: string) {
    this.socket?.off(event);
  }

  /**
   * Déconnexion complète (À appeler dans ngOnDestroy des composants)
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
      console.log('[Socket] Déconnecté manuellement');
    }
  }
}