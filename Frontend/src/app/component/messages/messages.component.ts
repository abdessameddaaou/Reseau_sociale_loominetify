import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import { ThemeService } from '../../service/theme.service';

type ConversationType = 'direct' | 'group';

interface Conversation {
  id: number;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online: boolean;
  type: ConversationType;
}

interface Message {
  id: number;
  conversationId: number;
  from: 'me' | 'them';
  content: string;
  time: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './messages.component.html'
})
export class MessagesComponent implements OnInit {

  constructor(
    private router: Router,
    private http: HttpClient,
    private themeService: ThemeService
  ) {}

  searchTerm = '';
  messageText = '';

  // onglet actif du header
  activeTab: 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion' =
    'messages';

  filterMode: 'all' | 'direct' | 'group' = 'all';

  // 🔹 Plus de mocks, données chargées depuis le backend
  conversations: Conversation[] = [];
  messages: Message[] = [];

  selectedConversation: Conversation | null = null;

  // profil par défaut pour la colonne de droite (peut être relié au backend plus tard)
  defaultProfile = {
    name: 'Contact Loominetfy',
    username: 'user',
    avatar: 'https://i.pravatar.cc/150?img=3',
    followers: 895,
    following: 340,
    online: true
  };

  // ─────────────────────────────────────────
  //  Lifecycle
  // ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadConversations();
  }

  // ─────────────────────────────────────────
  //  Backend : conversations
  // ─────────────────────────────────────────

  /**
   * Charger la liste des conversations
   * GET /conversations
   */
  private loadConversations() {
    this.http
      .get<Conversation[]>(`${environment.apiUrl}/conversations`, {
        withCredentials: true
      })
      .subscribe({
        next: (convs) => {
          this.conversations = convs || [];

          // Auto-sélectionner la première conversation si dispo
          if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0]);
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des conversations', err);
          this.conversations = [];
          this.selectedConversation = null;
          this.messages = [];
        }
      });
  }

  /**
   * Charger les messages d'une conversation
   * GET /conversations/:id/messages
   */
  private loadMessagesForConversation(conversationId: number) {
    this.http
      .get<Message[]>(`${environment.apiUrl}/conversations/${conversationId}/messages`, {
        withCredentials: true
      })
      .subscribe({
        next: (msgs) => {
          this.messages = msgs || [];
        },
        error: (err) => {
          console.error('Erreur lors du chargement des messages', err);
          this.messages = [];
        }
      });
  }

  // ─────────────────────────────────────────
  //  Getters UI
  // ─────────────────────────────────────────

  // filtre par type (switch) + recherche
  get filteredConversations(): Conversation[] {
    let list = this.conversations;

    if (this.filterMode === 'direct') {
      list = list.filter((c) => c.type === 'direct');
    } else if (this.filterMode === 'group') {
      list = list.filter((c) => c.type === 'group');
    }

    if (!this.searchTerm.trim()) return list;

    const term = this.searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.username.toLowerCase().includes(term)
    );
  }

  get currentMessages(): Message[] {
    // on considère que this.messages contient déjà uniquement les messages
    // de la conversation sélectionnée
    if (!this.selectedConversation) return [];
    return this.messages;
  }

  // ─────────────────────────────────────────
  //  Actions UI
  // ─────────────────────────────────────────

  setFilter(mode: 'all' | 'direct' | 'group') {
    this.filterMode = mode;
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation = conv;

    // reset badge "non lus" côté UI
    if (conv.unread) {
      conv.unread = 0;
    }

    // charger les messages correspondants
    this.loadMessagesForConversation(conv.id);
  }

  /**
   * Envoi d'un message → backend
   * POST /conversations/:id/messages
   */
  sendMessage() {
    if (!this.selectedConversation) return;

    const content = this.messageText.trim();
    if (!content) return;

    const convId = this.selectedConversation.id;

    this.http
      .post<Message>(
        `${environment.apiUrl}/conversations/${convId}/messages`,
        { content },
        { withCredentials: true }
      )
      .subscribe({
        next: (createdMessage) => {
          // on ajoute le message renvoyé par l'API à la liste
          this.messages.push(createdMessage);

          // mettre à jour l'aperçu de la conversation
          const convIndex = this.conversations.findIndex((c) => c.id === convId);
          if (convIndex !== -1) {
            this.conversations[convIndex] = {
              ...this.conversations[convIndex],
              lastMessage: createdMessage.content,
              time: createdMessage.time
            };
          }

          this.messageText = '';
        },
        error: (err) => {
          console.error('Erreur lors de l’envoi du message', err);
        }
      });
  }

  /**
   * appelé quand on clique sur un onglet du header
   */
  setActiveTab(tab: typeof this.activeTab) {
    this.activeTab = tab;

    if (tab === 'home') {
      this.router.navigate(['/fil-actualite']);
    } else if (tab === 'deconnexion') {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
        .subscribe({
          next: () => {
            this.themeService.applyAuthTheme();
            this.router.navigate(['/auth']);
          },
          error: () => {
            this.themeService.applyAuthTheme();
            this.router.navigate(['/auth']);
          }
        });
    } else if (tab === 'messages') {
      this.router.navigate(['/messages']);
    } else if (tab === 'settings') {
      this.router.navigate(['/settings']);
    }
  }
}
