import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import { ThemeService } from '../../service/theme.service';
import { SocketService } from '../../service/socket.service';
import { Subscription } from 'rxjs';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ClickOutsideDirective } from '../../directives/click-outside';
import { CallService } from '../../service/call.service';
import { CallOverlayComponent } from '../call-overlay/call-overlay.component';
import Swal from 'sweetalert2';

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
  participants?: any[];
  creatorId?: number;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  from: 'me' | 'them';
  senderId: number;
  senderName: string;
  senderPhoto: string | null;
  content: string;
  type: 'text' | 'image' | 'audio' | 'file' | 'call';
  fileUrl: string | null;
  time: string;
  createdAt: string;
}

interface FriendOption {
  id: number;
  name: string;
  avatar: string;
  selected: boolean;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, AudioPlayerComponent, PickerComponent, ClickOutsideDirective, CallOverlayComponent],
  templateUrl: './messages.component.html'
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private themeService: ThemeService,
    private socketService: SocketService,
    private callService: CallService
  ) { }

  env: any = environment;

  // State
  searchTerm = '';
  messageText = '';
  activeTab: 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion' = 'messages';
  filterMode: 'all' | 'direct' | 'group' = 'all';
  conversations: Conversation[] = [];
  messages: ChatMessage[] = [];
  selectedConversation: Conversation | null = null;
  currentUserId: number | null = null;
  currentUserName: string = '';
  currentUserPhoto: string | null = null;
  onlineUsers: Set<number> = new Set();
  blockStatus: string | null = null; // null | 'i_blocked' | 'they_blocked'
  conversationType: string = 'private';
  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';

  // Group creation
  showNewGroupModal = false;
  groupTitle = '';
  friendOptions: FriendOption[] = [];
  friendSearchTerm = '';

  // Media – Native MediaRecorder (replaced vmsg)
  isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  recordingTime = 0;
  recordingInterval: any = null;

  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;
  showAttachMenu = false;

  // Socket
  private subs: Subscription[] = [];
  private shouldScrollToBottom = false;

  // Emojis
  showEmojiPicker = false;

  // Lightbox
  lightboxImageUrl: string | null = null;

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  hideEmojiPicker() {
    this.showEmojiPicker = false;
  }

  // ─────────────────────────────────────────
  //  Lifecycle
  // ─────────────────────────────────────────
  ngOnInit(): void {
    // Get current user ID
    this.http.get<any>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.currentUserId = res.user.id;
          this.currentUserName = `${res.user.prenom || ''} ${res.user.nom || ''}`.trim();
          this.currentUserPhoto = res.user.photo || null;
          this.socketService.joinUserRoom(this.currentUserId!);
          this.loadConversations();

          // Check if we need to open a specific conversation (from profile page)
          this.route.queryParams.subscribe(params => {
            if (params['userId']) {
              this.startPrivateChat(Number(params['userId']));
            }
          });
        },
        error: () => this.loadConversations()
      });

    this.setupSocketListeners();
    this.socketService.getOnlineUsers();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    // Clean up recording if active
    if (this.isRecording) {
      this.cancelRecording();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      // Multi-stage scroll to handle async DOM rendering (images, audio players)
      this.scrollToBottom();
      setTimeout(() => this.scrollToBottom(), 100);
      setTimeout(() => this.scrollToBottom(), 300);
      setTimeout(() => this.scrollToBottom(), 600);
    }
  }

  private setupSocketListeners() {
    this.subs.push(
      this.socketService.onOnlineUsersList().subscribe((userIds: number[]) => {
        this.onlineUsers = new Set(userIds);

        // Update current conversations
        this.conversations.forEach(conv => {
          if (conv.type === 'direct' && conv.participants) {
            const otherParticipant = conv.participants.find((p: any) => p.id !== this.currentUserId);
            if (otherParticipant) {
              conv.online = this.onlineUsers.has(otherParticipant.id);
            }
          }
        });

        // Update selected conversation if needed
        if (this.selectedConversation && this.selectedConversation.type === 'direct' && this.selectedConversation.participants) {
          const otherParticipant = this.selectedConversation.participants.find((p: any) => p.id !== this.currentUserId);
          if (otherParticipant) {
            this.selectedConversation.online = this.onlineUsers.has(otherParticipant.id);
          }
        }
      })
    );

    this.subs.push(
      this.socketService.onNewMessage().subscribe((data: any) => {
        if (this.currentUserId && data.recipientId === this.currentUserId) {
          // Message for current conversation
          if (this.selectedConversation && Number(data.conversationId) === this.selectedConversation.id) {
            // Don't add if it's my own message (already added optimistically)
            if (data.message.senderId !== this.currentUserId) {
              this.messages.push(data.message);
              this.shouldScrollToBottom = true;
              // Mark as read
              this.http.get<any>(
                `${environment.apiUrl}/conversations/${data.conversationId}/messages`,
                { withCredentials: true }
              ).subscribe();
            }
          }

          // Update conversation list
          const convIdx = this.conversations.findIndex(c => c.id === Number(data.conversationId));
          if (convIdx !== -1) {
            this.conversations[convIdx].lastMessage = this.getMessagePreview(data.message);
            this.conversations[convIdx].time = data.message.time;
            if (data.message.senderId !== this.currentUserId &&
              (!this.selectedConversation || this.selectedConversation.id !== Number(data.conversationId))) {
              this.conversations[convIdx].unread = (this.conversations[convIdx].unread || 0) + 1;
            }
            // Move to top
            const conv = this.conversations.splice(convIdx, 1)[0];
            this.conversations.unshift(conv);
          } else {
            // New conversation, reload list
            this.loadConversations();
          }
        }
      })
    );

    this.subs.push(
      this.socketService.onNewConversation().subscribe((data: any) => {
        if (this.currentUserId && data.recipientId === this.currentUserId) {
          this.loadConversations();
        }
      })
    );
  }

  // ─────────────────────────────────────────
  //  Backend calls
  // ─────────────────────────────────────────

  private loadConversations() {
    this.http.get<Conversation[]>(`${environment.apiUrl}/conversations`, { withCredentials: true })
      .subscribe({
        next: (convs) => {
          this.conversations = convs || [];
          // Re-select if we had one
          if (this.selectedConversation) {
            const existing = this.conversations.find(c => c.id === this.selectedConversation!.id);
            if (existing) this.selectedConversation = existing;
          }
        },
        error: () => { this.conversations = []; }
      });
  }

  private loadMessagesForConversation(conversationId: number) {
    this.http.get<any>(`${environment.apiUrl}/conversations/${conversationId}/messages`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.messages = data.messages || [];
          this.blockStatus = data.blockStatus;
          this.conversationType = data.conversationType;
          this.shouldScrollToBottom = true;
        },
        error: () => {
          this.messages = [];
          this.blockStatus = null;
        }
      });
  }

  startPrivateChat(otherUserId: number) {
    this.http.post<any>(`${environment.apiUrl}/conversations/private`, { otherUserId }, { withCredentials: true })
      .subscribe({
        next: (data) => {
          // Reload conversations then select the new one
          this.http.get<Conversation[]>(`${environment.apiUrl}/conversations`, { withCredentials: true })
            .subscribe({
              next: (convs) => {
                this.conversations = convs || [];
                const conv = this.conversations.find(c => c.id === data.conversationId);
                if (conv) this.selectConversation(conv);
              }
            });
        }
      });
  }

  // ─────────────────────────────────────────
  //  UI Getters
  // ─────────────────────────────────────────

  get filteredConversations(): Conversation[] {
    let list = this.conversations;
    if (this.filterMode === 'direct') list = list.filter(c => c.type === 'direct');
    else if (this.filterMode === 'group') list = list.filter(c => c.type === 'group');
    if (!this.searchTerm.trim()) return list;
    const term = this.searchTerm.toLowerCase();
    return list.filter(c => c.name.toLowerCase().includes(term) || c.username.toLowerCase().includes(term));
  }

  get filteredFriendOptions(): FriendOption[] {
    if (!this.friendSearchTerm.trim()) return this.friendOptions;
    const t = this.friendSearchTerm.toLowerCase();
    return this.friendOptions.filter(f => f.name.toLowerCase().includes(t));
  }

  get selectedFriendCount(): number {
    return this.friendOptions.filter(f => f.selected).length;
  }

  get canSendMessage(): boolean {
    return !this.blockStatus && (!!this.messageText.trim() || !!this.selectedFile);
  }

  // ─────────────────────────────────────────
  //  Actions
  // ─────────────────────────────────────────

  setFilter(mode: 'all' | 'direct' | 'group') {
    this.filterMode = mode;
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation = conv;
    if (conv.unread) conv.unread = 0;
    this.blockStatus = null;
    this.selectedFile = null;
    this.selectedFilePreview = null;
    this.loadMessagesForConversation(conv.id);
  }

  deselectConversation() {
    this.selectedConversation = null;
    this.messages = [];
    this.blockStatus = null;
  }

  sendMessage() {
    if (!this.selectedConversation) return;
    if (!this.messageText.trim() && !this.selectedFile) return;

    const convId = this.selectedConversation.id;

    if (this.selectedFile) {
      // Send with file
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      if (this.messageText.trim()) formData.append('content', this.messageText.trim());

      this.http.post<ChatMessage>(`${environment.apiUrl}/conversations/${convId}/messages`, formData, { withCredentials: true })
        .subscribe({
          next: (createdMessage) => {
            this.messages.push(createdMessage);
            this.updateConversationPreview(convId, createdMessage);
            this.messageText = '';
            this.clearFileSelection();
            this.shouldScrollToBottom = true;
          },
          error: (err) => {
            if (err.error?.blockStatus) {
              this.blockStatus = err.error.blockStatus;
            }
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: err.error?.error || "Impossible d'envoyer le message.",
              confirmButtonColor: 'var(--accent-main, #6366f1)',
              background: 'var(--bg-card, #fff)',
              color: 'var(--text-main, #111)',
            });
          }
        });
    } else {
      // Text-only
      this.http.post<ChatMessage>(
        `${environment.apiUrl}/conversations/${convId}/messages`,
        { content: this.messageText.trim(), type: 'text' },
        { withCredentials: true }
      ).subscribe({
        next: (createdMessage) => {
          this.messages.push(createdMessage);
          this.updateConversationPreview(convId, createdMessage);
          this.messageText = '';
          this.shouldScrollToBottom = true;
        },
        error: (err) => {
          if (err.error?.blockStatus) {
            this.blockStatus = err.error.blockStatus;
          }
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err.error?.error || "Impossible d'envoyer le message.",
            confirmButtonColor: 'var(--accent-main, #6366f1)',
            background: 'var(--bg-card, #fff)',
            color: 'var(--text-main, #111)',
          });
        }
      });
    }
  }

  onEnter(event: any) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
      this.showEmojiPicker = false;
    }
  }

  addEmoji(event: any) {
    const text = `${this.messageText}${event.emoji.native}`;
    this.messageText = text;
  }

  // ─────────────────────────────────────────
  //  Lightbox
  // ─────────────────────────────────────────

  openLightbox(fileUrl: string) {
    this.lightboxImageUrl = `${this.env.assetsUrl}/messages/${fileUrl}`;
  }

  closeLightbox() {
    this.lightboxImageUrl = null;
  }

  // ─────────────────────────────────────────
  //  Media / Files
  // ─────────────────────────────────────────

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.showAttachMenu = false;

      // Generate preview for images (including HEIC/HEIF)
      const isImage = this.selectedFile.type.startsWith('image/') ||
        /\.(heic|heif)$/i.test(this.selectedFile.name);

      if (isImage) {
        if (this.selectedFile.type.startsWith('image/') && !this.selectedFile.type.includes('heic') && !this.selectedFile.type.includes('heif')) {
          const reader = new FileReader();
          reader.onload = () => {
            this.selectedFilePreview = reader.result as string;
          };
          reader.readAsDataURL(this.selectedFile);
        } else {
          // HEIC/HEIF — browser can't preview, show placeholder
          this.selectedFilePreview = null;
        }
      } else {
        this.selectedFilePreview = null;
      }
    }
  }

  clearFileSelection() {
    this.selectedFile = null;
    this.selectedFilePreview = null;
  }

  toggleAttachMenu() {
    this.showAttachMenu = !this.showAttachMenu;
    this.showEmojiPicker = false;
  }

  triggerFileInput(type: 'image' | 'file' | 'audio') {
    this.showAttachMenu = false;

    if (type === 'audio') {
      this.toggleRecording();
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';

    if (type === 'image') {
      input.accept = 'image/*,.heic,.heif';
    }

    input.onchange = (e) => this.onFileSelected(e);
    input.click();
  }

  // ─────────────────────────────────────────
  //  Voice Recording – Native MediaRecorder
  // ─────────────────────────────────────────

  async toggleRecording() {
    if (this.isRecording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try mp3/webm with opus, fallback to whatever the browser supports
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      this.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        this.processRecordedAudio(blob);
      };

      this.mediaRecorder.start(100); // Collect data every 100ms for smoother processing
      this.isRecording = true;
      this.recordingTime = 0;
      this.recordingInterval = setInterval(() => {
        this.recordingTime++;
      }, 1000);

    } catch (e: any) {
      console.error('Erreur accès micro:', e);
      Swal.fire({
        icon: 'error',
        title: 'Microphone',
        text: "Impossible d'accéder au microphone. Vérifiez les permissions de votre navigateur.",
        confirmButtonColor: 'var(--accent-main, #6366f1)',
        background: 'var(--bg-card, #fff)',
        color: 'var(--text-main, #111)',
      });
    }
  }

  private async stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    clearInterval(this.recordingInterval);
  }

  processRecordedAudio(blob: Blob) {
    if (!blob || blob.size === 0) return;

    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([blob], `vocal_${Date.now()}.${ext}`, {
      type: blob.type,
      lastModified: Date.now()
    });

    // Auto-send the voice message
    this.selectedFile = file;
    this.sendMessage();
  }

  cancelRecording() {
    if (this.isRecording && this.mediaRecorder) {
      // Remove the onstop handler to prevent auto-send
      this.mediaRecorder.onstop = () => {
        // Just clean up without sending
        if (this.mediaRecorder) {
          const stream = this.mediaRecorder.stream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingInterval);
      this.audioChunks = [];
      this.selectedFile = null;
      this.mediaRecorder = null;
    }
  }

  formatRecordingTime(): string {
    const mins = Math.floor(this.recordingTime / 60);
    const secs = this.recordingTime % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  getFileIcon(fileName: string): string {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦';
    if (['mp3', 'wav', 'ogg', 'webm', 'mp4'].includes(ext)) return '🎵';
    return '📎';
  }

  getFileName(url: string): string {
    if (!url) return 'Fichier';
    const parts = url.split('-');
    return parts.length > 1 ? parts.slice(1).join('-') : url;
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    const bytes = this.selectedFile.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─────────────────────────────────────────
  //  Group creation
  // ─────────────────────────────────────────

  openNewGroupModal() {
    this.showNewGroupModal = true;
    this.groupTitle = '';
    this.friendSearchTerm = '';
    this.friendOptions = [];

    // Load friends
    this.http.get<any>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          const sentFriends = (res.user.sentRelations || [])
            .filter((r: any) => r.status === 'acceptée')
            .map((r: any) => r.addresseeId);
          const receivedFriends = (res.user.receivedRelations || [])
            .filter((r: any) => r.status === 'acceptée')
            .map((r: any) => r.requesterId);
          const friendIds = [...new Set([...sentFriends, ...receivedFriends])];

          const allUsers = [...(res.user.followers || []), ...(res.user.following || [])];
          const seen = new Set<number>();
          this.friendOptions = [];

          for (const u of allUsers) {
            if (friendIds.includes(u.id) && !seen.has(u.id)) {
              seen.add(u.id);
              this.friendOptions.push({
                id: u.id,
                name: `${u.prenom} ${u.nom}`,
                avatar: u.photo || this.defaultAvatar,
                selected: false
              });
            }
          }
        }
      });
  }

  closeNewGroupModal() {
    this.showNewGroupModal = false;
  }

  toggleFriendSelection(friend: FriendOption) {
    friend.selected = !friend.selected;
  }

  createGroup() {
    const selectedIds = this.friendOptions.filter(f => f.selected).map(f => f.id);
    if (selectedIds.length === 0) return;

    this.http.post<any>(`${environment.apiUrl}/conversations/group`, {
      title: this.groupTitle || 'Nouveau groupe',
      memberIds: selectedIds
    }, { withCredentials: true }).subscribe({
      next: (data) => {
        this.closeNewGroupModal();
        this.loadConversations();
        // Select the new group
        setTimeout(() => {
          const conv = this.conversations.find(c => c.id === data.conversationId);
          if (conv) this.selectConversation(conv);
        }, 500);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.error?.error || 'Erreur lors de la création du groupe',
          confirmButtonColor: 'var(--accent-main, #6366f1)',
          background: 'var(--bg-card, #fff)',
          color: 'var(--text-main, #111)',
        });
      }
    });
  }

  // ─────────────────────────────────────────
  //  Group Settings
  // ─────────────────────────────────────────

  showGroupSettingsModal = false;
  groupMembers: any[] = [];
  groupSettingsTab: 'members' | 'add' = 'members';
  addMemberSearchTerm = '';
  addMemberOptions: FriendOption[] = [];

  openGroupSettings() {
    if (!this.selectedConversation || this.selectedConversation.type !== 'group') return;
    this.showGroupSettingsModal = true;
    this.groupSettingsTab = 'members';
    this.loadGroupMembers();
  }

  closeGroupSettingsModal() {
    this.showGroupSettingsModal = false;
  }

  loadGroupMembers() {
    if (!this.selectedConversation) return;
    this.http.get<any[]>(`${environment.apiUrl}/conversations/${this.selectedConversation.id}/members`, { withCredentials: true })
      .subscribe({
        next: (members) => {
          this.groupMembers = members;
        },
        error: (err) => console.error("Could not load group members", err)
      });
  }

  prepareAddMembers() {
    this.groupSettingsTab = 'add';
    this.addMemberSearchTerm = '';
    this.addMemberOptions = [];

    // Load friend options excluding current members
    const currentMemberIds = new Set(this.groupMembers.map(m => m.id));

    this.http.get<any>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          const sentFriends = (res.user.sentRelations || []).filter((r: any) => r.status === 'acceptée').map((r: any) => r.addresseeId);
          const receivedFriends = (res.user.receivedRelations || []).filter((r: any) => r.status === 'acceptée').map((r: any) => r.requesterId);
          const friendIds = new Set([...sentFriends, ...receivedFriends]);

          const allUsers = [...(res.user.followers || []), ...(res.user.following || [])];
          const seen = new Set<number>();

          for (const u of allUsers) {
            if (friendIds.has(u.id) && !seen.has(u.id) && !currentMemberIds.has(u.id)) {
              seen.add(u.id);
              this.addMemberOptions.push({
                id: u.id,
                name: `${u.prenom} ${u.nom}`,
                avatar: u.photo || this.defaultAvatar,
                selected: false
              });
            }
          }
        }
      });
  }

  get filteredAddMemberOptions() {
    if (!this.addMemberSearchTerm) return this.addMemberOptions;
    const term = this.addMemberSearchTerm.toLowerCase();
    return this.addMemberOptions.filter(f => f.name.toLowerCase().includes(term));
  }

  get selectedAddMemberCount() {
    return this.addMemberOptions.filter(f => f.selected).length;
  }

  addSelectedMembersToGroup() {
    if (!this.selectedConversation) return;
    const selectedIds = this.addMemberOptions.filter(f => f.selected).map(f => f.id);
    if (selectedIds.length === 0) return;

    // We have to add them one by one since the backend endpoint expects one memberId
    let addedCount = 0;
    selectedIds.forEach(memberId => {
      this.http.post(`${environment.apiUrl}/conversations/${this.selectedConversation!.id}/members`, { memberId }, { withCredentials: true })
        .subscribe({
          next: () => {
            addedCount++;
            if (addedCount === selectedIds.length) {
              this.loadGroupMembers();
              this.groupSettingsTab = 'members';
            }
          },
          error: (err) => alert(err.error?.error || "Erreur lors de l'ajout")
        });
    });
  }

  removeMember(memberId: number) {
    if (!this.selectedConversation || !confirm("Voulez-vous vraiment retirer ce membre du groupe ?")) return;
    this.http.delete(`${environment.apiUrl}/conversations/${this.selectedConversation.id}/members/${memberId}`, { withCredentials: true })
      .subscribe({
        next: () => this.loadGroupMembers(),
        error: (err) => alert(err.error?.error || "Erreur lors de la suppression")
      });
  }

  leaveGroup() {
    if (!this.selectedConversation || !confirm("Voulez-vous vraiment quitter ce groupe ?")) return;
    this.http.post(`${environment.apiUrl}/conversations/${this.selectedConversation.id}/leave`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.closeGroupSettingsModal();
          this.selectedConversation = null;
          this.loadConversations();
        },
        error: (err) => alert(err.error?.error || "Erreur lors de la sortie du groupe")
      });
  }

  triggerGroupAvatarInput() {
    document.getElementById('groupAvatarInput')?.click();
  }

  updateGroupAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedConversation) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('file', file);

      this.http.put<any>(`${environment.apiUrl}/conversations/${this.selectedConversation.id}/avatar`, formData, { withCredentials: true })
        .subscribe({
          next: (res) => {
            if (this.selectedConversation) {
              alert("Avatar mis à jour !");
            }
          },
          error: (err) => alert(err.error?.error || "Erreur de mise à jour de l'avatar")
        });
    }
  }

  // ─────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────

  private getMessagePreview(msg: ChatMessage): string {
    if (msg.type === 'text') return msg.content || '';
    if (msg.type === 'image') return '📷 Photo';
    if (msg.type === 'audio') return '🎤 Message vocal';
    return '📎 Fichier';
  }

  private updateConversationPreview(convId: number, msg: ChatMessage) {
    const idx = this.conversations.findIndex(c => c.id === convId);
    if (idx !== -1) {
      this.conversations[idx].lastMessage = this.getMessagePreview(msg);
      this.conversations[idx].time = msg.time;
      // Move to top
      const conv = this.conversations.splice(idx, 1)[0];
      this.conversations.unshift(conv);
    }
  }

  private scrollToBottom() {
    try {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) { }
  }

  // ─────────────────────────────────────────
  //  Nav / Header
  // ─────────────────────────────────────────

  setActiveTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    if (tab === 'home') this.router.navigate(['/fil-actualite']);
    else if (tab === 'settings') this.router.navigate(['/settings']);
    else if (tab === 'deconnexion') {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
        next: () => { this.themeService.applyAuthTheme(); this.router.navigate(['/auth']); },
        error: () => { this.themeService.applyAuthTheme(); this.router.navigate(['/auth']); }
      });
    }
  }

  navigateToProfile(userId: number) {
    this.router.navigate(['/profil', userId]);
  }

  // ─────────────────────────────────────────
  //  Calls
  // ─────────────────────────────────────────

  startAudioCall() {
    this.initiateCall('audio');
  }

  startVideoCall() {
    this.initiateCall('video');
  }

  private async initiateCall(callType: 'audio' | 'video') {
    if (!this.selectedConversation || !this.currentUserId) return;

    const conv = this.selectedConversation;
    const participantIds = conv.participants?.map((p: any) => p.id || p.userId) || [];

    if (participantIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Appel impossible',
        text: 'Aucun participant trouvé dans cette conversation.',
        confirmButtonColor: 'var(--accent-main, #6366f1)',
      });
      return;
    }

    try {
      await this.callService.startCall(
        conv.id,
        participantIds,
        callType,
        {
          id: this.currentUserId,
          name: this.currentUserName || 'Moi',
          photo: this.currentUserPhoto || null
        },
        conv.name,
        conv.avatar
      );
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message || "Impossible de lancer l'appel. Vérifiez vos permissions média.",
        confirmButtonColor: 'var(--accent-main, #6366f1)',
      });
    }
  }
}
