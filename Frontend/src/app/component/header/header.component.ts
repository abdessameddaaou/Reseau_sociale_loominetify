import { Component, EventEmitter, Input, Output, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.dev';
import { ReactiveFormsModule, FormControl } from '@angular/forms'; 
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {

  @Input() activeTab: HeaderTab = 'home';
  @Output() tabChange = new EventEmitter<HeaderTab>();
  @ViewChild('notificationsDropdown') notificationsDropdown?: ElementRef;
  @ViewChild('notificationsButton') notificationsButton?: ElementRef;
  @ViewChild('searchContainer') searchContainer?: ElementRef;

  /**
    * Variables
    */
  showNotifications = false;
  notificationsFilter: NotificationsFilter = 'all';
  notifications: HeaderNotification[] = [];
  searchControl = new FormControl('');
  searchResults: any[] = [];  
  showSearchDropdown = false;
  defaultAvatar ='https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png'
  
  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.setupSearch();
  }


  /**
   * Méthode de recherche
   */
   setupSearch() {
    this.searchControl.valueChanges.pipe( debounceTime(300), distinctUntilChanged(), switchMap((term: string | null) => {
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
    this.http.get<HeaderNotification[]>(`${environment.apiUrl}/notifications`, { withCredentials: true }).subscribe({
        next: (notifs) => {
          this.notifications = notifs;
        },
        error: (err) => {
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
  }
}
