import { Component, EventEmitter, Input, Output, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';

type HeaderTab = 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion';
type NotificationType = 'invite' | 'like' | 'comment' | 'share';
type NotificationsFilter = 'all' | 'invites' | 'activity';

/**
 * Interface notification
 */
interface HeaderNotification {
  id: number;
  type: NotificationType;
  userName: string;
  userAvatar: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  @Input() activeTab: HeaderTab = 'home';
  @Output() tabChange = new EventEmitter<HeaderTab>();

  /**
   * état du dropdown
   */
  showNotifications = false;
  notificationsFilter: NotificationsFilter = 'all';

  /**
   * refs vers le bouton et le dropdown
   */
  @ViewChild('notificationsDropdown') notificationsDropdown?: ElementRef;
  @ViewChild('notificationsButton') notificationsButton?: ElementRef;

  /**
   * Notifications venant du backend
   */
  notifications: HeaderNotification[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  /**
   * Charger les notifications depuis le backend
   * GET /notifications
   */
  private loadNotifications() {
    this.http.get<HeaderNotification[]>(`${environment.apiUrl}/notifications`, { withCredentials: true }).subscribe({
        next: (notifs) => {
          this.notifications = notifs;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des notifications', err);
          this.notifications = [];
        }
      });
  }

  /**
   * Nombre de non-lues
   */
  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Notifications filtrées (Tous / Invitations / Activité)
   */
  get filteredNotifications(): HeaderNotification[] {
    let list = this.notifications;

    if (this.notificationsFilter === 'invites') {
      list = list.filter((n) => n.type === 'invite');
    } else if (this.notificationsFilter === 'activity') {
      list = list.filter((n) => n.type !== 'invite');
    }

    return list;
  }

  toggleNotificationsDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showNotifications = !this.showNotifications;
  }

  setNotificationsFilter(filter: NotificationsFilter) {
    this.notificationsFilter = filter;
  }

  /**
   * Tout marquer comme lu
   * POST /notifications/mark-all-read
   */
  markAllAsRead() {
    this.http.post<void>(`${environment.apiUrl}/notifications/mark-all-read`, {}, { withCredentials: true }).subscribe({
        next: () => {
          this.notifications = this.notifications.map((n) => ({
            ...n,
            read: true
          }));
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour des notifications', err);
        }
      });
  }

  /**
   * Clique sur une notification
   * POST /notifications/:id/read
   */
  handleNotificationClick(notif: HeaderNotification) {
    this.http
      .post<void>(`${environment.apiUrl}/notifications/${notif.id}/read`, {}, { withCredentials: true }).subscribe({
        next: () => {
          notif.read = true;
        },
        error: (err) => {
          console.error('Erreur lors du marquage en lu', err);
        }
      });
  }

  /**
   * Accepter une invitation
   * POST /notifications/:id/accept
   */
  acceptInvite(notif: HeaderNotification) {
    this.http
      .post<void>(`${environment.apiUrl}/notifications/${notif.id}/accept`, {}, { withCredentials: true }).subscribe({
        next: () => {
          notif.read = true;
          // this.loadNotifications();
        },
        error: (err) => {
          console.error('Erreur lors de l’acceptation de l’invitation', err);
        }
      });
  }

  /**
   * Refuser une invitation
   * POST /notifications/:id/decline
   */
  declineInvite(notif: HeaderNotification) {
    this.http
      .post<void>(`${environment.apiUrl}/notifications/${notif.id}/decline`, {}, { withCredentials: true }).subscribe({
        next: () => {
          notif.read = true;
          // this.loadNotifications();
        },
        error: (err) => {
          console.error('Erreur lors du refus de l’invitation', err);
        }
      });
  }

  /**
   * Clic sur un onglet du header
   */
  onTabClick(tab: HeaderTab) {
    if (tab !== 'notifications') {
      this.showNotifications = false;
      this.tabChange.emit(tab);
    }
  }

  /**
   * Fermer le dropdown si on clique à l’extérieur
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showNotifications) return;

    const target = event.target as HTMLElement;
    const dropdownEl = this.notificationsDropdown?.nativeElement;
    const buttonEl = this.notificationsButton?.nativeElement;

    if (dropdownEl?.contains(target) || buttonEl?.contains(target)) {
      return;
    }

    this.showNotifications = false;
  }
}
