import { Component, EventEmitter, Input, Output, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.dev';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SocketService } from '../../service/socket.service';

// --- i18n Imports ---
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type HeaderTab = 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion';
type NotificationType = 'invite' | 'like' | 'comment' | 'share';
type NotificationsFilter = 'all' | 'invites' | 'activity';

interface HeaderNotification {
  id: number;
  type: NotificationType;
  userName: string;
  userAvatar: string;
  message: string;
  time: string;
  read: boolean;
  accepted?: boolean; // true = acceptée, false = refusée, undefined = en attente
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {

  @Input() activeTab: HeaderTab = 'home';
  @Output() tabChange = new EventEmitter<HeaderTab>();
  @ViewChild('notificationsDropdown') notificationsDropdown?: ElementRef;
  @ViewChild('notificationsButton') notificationsButton?: ElementRef;
  @ViewChild('searchContainer') searchContainer?: ElementRef;
  @ViewChild('mobileMenuButton') mobileMenuButton?: ElementRef;
  @ViewChild('mobileMenuDropdown') mobileMenuDropdown?: ElementRef;

  /**
    * Variables
    */
  showNotifications = false;
  showMobileMenu = false;
  currentUser: any = null;
  notificationsFilter: NotificationsFilter = 'all';
  notifications: HeaderNotification[] = [];
  searchControl = new FormControl('');
  searchResults: any[] = [];
  showSearchDropdown = false;
  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png'
  private currentUserId: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private socketService: SocketService,
    public translate: TranslateService
  ) { }

  get currentLang(): string {
    return this.translate.currentLang || this.translate.getDefaultLang() || 'fr';
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
    this.showMobileMenu = false;
  }

  ngOnInit(): void {
    // Récupérer l'ID de l'utilisateur connecté
    this.http.get<any>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.currentUser = res?.user || null;
        this.currentUserId = res?.user?.id != null ? String(res.user.id) : null;
        if (this.currentUserId) {
          this.socketService.joinUserRoom(Number(this.currentUserId));
        }
      },
      error: () => {
        this.currentUserId = null;
      }
    });

    this.loadNotifications();
    this.setupSearch();

    // Écouter les nouvelles notifications en temps réel
    this.socketService.onNewNotification().subscribe((data) => {
      // Ne montrer que les notifications destinées à MOI
      if (this.currentUserId && String(data.recipientId) !== this.currentUserId) {
        return; // Cette notification n'est pas pour moi
      }

      // Mapper la notification socket au format HeaderNotification
      const n = data.notification;
      const mapped: HeaderNotification = {
        id: n.id,
        type: n.type,
        userName: n.sender ? `${n.sender.prenom} ${n.sender.nom}` : '',
        userAvatar: n.sender?.photo || this.defaultAvatar,
        message: n.message,
        time: this.timeAgo(n.createdAt),
        read: n.read || false
      };
      this.notifications.unshift(mapped);
      console.log('Nouvelle notification reçue :', data);
    });
  }


  /**
   * Méthode de recherche
   */
  setupSearch() {
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), switchMap((term: string | null) => {
      if (!term || term.length < 2) {
        this.showSearchDropdown = false;
        return of([]);
      }
      this.showSearchDropdown = true;
      return this.http.get<any>(`${environment.apiUrl}/users/search?term=${term}`, { withCredentials: true }).pipe(
        catchError(error => {
          return of({ user: [] });
        })
      );
    })
    ).subscribe((response: any) => {
      this.searchResults = response.user || [];
    });
  }

  onSearchResultClick(user: any) {
    this.showSearchDropdown = false;
    this.searchControl.setValue('');
    this.router.navigate(['/profil', user.id]);
  }



  /**
   * Charger les notifications depuis le backend
   */
  loadNotifications() {
    this.http.get<any[]>(`${environment.apiUrl}/notifications`, { withCredentials: true }).subscribe({
      next: (notifs) => {
        this.notifications = notifs.map((n: any) => ({
          id: n.id,
          type: n.type,
          userName: n.sender ? `${n.sender.prenom} ${n.sender.nom}` : '',
          userAvatar: n.sender?.photo || this.defaultAvatar,
          message: n.message,
          time: this.timeAgo(n.createdAt),
          read: n.read || false
        }));
      },
      error: (err) => {
        this.notifications = [];
      }
    });
  }

  /**
   * Calculer le temps écoulé depuis une date
   */
  private timeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Il y a ${diffD}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
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
    this.showMobileMenu = false;
  }

  toggleMobileMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showMobileMenu = !this.showMobileMenu;
    this.showNotifications = false;
  }

  goToProfile() {
    this.showMobileMenu = false;
    if (this.currentUserId) {
      this.router.navigate(['/profil', this.currentUserId]);
    }
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
      .post<any>(`${environment.apiUrl}/notifications/${notif.id}/accept`, {}, { withCredentials: true }).subscribe({
        next: () => {
          notif.read = true;
          notif.accepted = true;
          notif.message = 'Invitation acceptée';
          notif.type = 'like' as NotificationType; // Changer le type pour masquer les boutons Accepter/Ignorer
        },
        error: (err) => {
          console.error('Erreur lors de l\'acceptation de l\'invitation', err);
        }
      });
  }

  /**
   * Refuser une invitation
   * POST /notifications/:id/decline
   */
  declineInvite(notif: HeaderNotification) {
    this.http
      .post<any>(`${environment.apiUrl}/notifications/${notif.id}/decline`, {}, { withCredentials: true }).subscribe({
        next: () => {
          notif.read = true;
          notif.accepted = false;
          notif.message = 'Invitation refusée';
          notif.type = 'like' as NotificationType; // Changer le type pour masquer les boutons Accepter/Ignorer
        },
        error: (err) => {
          console.error('Erreur lors du refus de l\'invitation', err);
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
    const target = event.target as HTMLElement;

    // Gestion fermeture Notifications
    if (this.showNotifications) {
      const notifDropdown = this.notificationsDropdown?.nativeElement;
      const notifButton = this.notificationsButton?.nativeElement;
      if (!notifDropdown?.contains(target) && !notifButton?.contains(target)) {
        this.showNotifications = false;
      }
    }

    // AJOUT : Gestion fermeture Recherche
    if (this.showSearchDropdown) {
      const searchWrap = this.searchContainer?.nativeElement;
      if (!searchWrap?.contains(target)) {
        this.showSearchDropdown = false;
      }
    }

    // Gestion fermeture Mobile Menu
    if (this.showMobileMenu) {
      const menuDropdown = this.mobileMenuDropdown?.nativeElement;
      const menuButton = this.mobileMenuButton?.nativeElement;
      if (!menuDropdown?.contains(target) && !menuButton?.contains(target)) {
        this.showMobileMenu = false;
      }
    }
  }
}
