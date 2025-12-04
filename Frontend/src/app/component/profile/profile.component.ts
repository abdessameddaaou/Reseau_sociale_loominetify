import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';

type HeaderTab = 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion';

interface CurrentUser {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  ville?: string;
  pays?: string;
  isAdmin: boolean;
  photo?: string;
  createdAt?: string;
  bio?: string;
  relationStatus?: string;
  profession?: string; 
  siteweb?: string;
}

interface ProfilePostPreview {
  id: number;
  text: string;
  timeAgo: string;
  likes: number;
  comments: number;
}

interface ProfileActivity {
  id: number;
  icon: 'comment' | 'star' | 'group';
  text: string;
  timeAgo: string;
}

interface FriendPreview {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  online: boolean;
  mutual: number;
}

interface GroupPreview {
  id: number;
  name: string;
  avatar: string;
  members: number;
  role: 'Admin' | 'Membre';
  lastActivity: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {

  activeTab: HeaderTab = 'home';

  currentUser: CurrentUser | null = null;
  isUserLoading = true;

  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';

  // Stats "header"
  followers = 256;
  following = 189;
  postsCount = 34;

  // Dernières activités
  recentActivity: ProfileActivity[] = [
    {
      id: 1,
      icon: 'comment',
      text: 'A commenté une publication.',
      timeAgo: 'Il y a 2 heures',
    },
    {
      id: 2,
      icon: 'star',
      text: 'A ajouté une publication aux favoris.',
      timeAgo: 'Hier',
    },
    {
      id: 3,
      icon: 'group',
      text: 'A rejoint un nouveau groupe.',
      timeAgo: 'Il y a 3 jours',
    },
  ];

  // Petites stats
  stats = {
    activityScore: 4.8,
    daysStreak: 72,
    groupsJoined: 12,
  };

  // Badges / tags
  badges: string[] = ['WebDev', 'Design', 'Startup', 'Productivité'];

  // Dernières publication
  lastPosts: ProfilePostPreview[] = []

  // Amis proches
  closeFriends: FriendPreview[] = []

  // Groupes
  groups: GroupPreview[] = [];

  // Photos récentes
  recentPhotos: string[] = [];

  constructor(private router: Router, private http: HttpClient ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /* ================== GETTERS ================== */

  /**
   * 
   * Formater la date de création du compte
   */
  get joinedDate(): string {
    if (!this.currentUser?.createdAt) return 'Non renseigné';
    return new Date(this.currentUser.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Calculer l'age 
   */
  get age(): string {
    if (!this.currentUser?.dateNaissance) return 'Non renseigné';
    const birth = new Date(this.currentUser.dateNaissance);
    if (isNaN(birth.getTime())) return this.currentUser.dateNaissance;
    const diff = Date.now() - birth.getTime();
    const ageDate = new Date(diff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${years} ans`;
  }

  /* ============== NAVIGATION HEADER ============== */

  setActiveTab(tab: HeaderTab) {
    this.activeTab = tab;

    if (tab === 'home') {
      this.router.navigate(['/fil-actualite']);
    } else if (tab === 'messages') {
      this.router.navigate(['/messages']);
    } else if (tab === 'settings') {
      this.router.navigate(['/settings']);
    } else if (tab === 'deconnexion') {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
        .subscribe({
          next: () => this.router.navigate(['/auth']),
          error: () => this.router.navigate(['/auth']),
        });
    }
  }

  /* ============== API UTILISATEUR ============== */

  private loadCurrentUser() {
    this.http.get<{ user: CurrentUser }>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true } ).subscribe({
        next: (res) => {
          this.currentUser = res.user;
          this.isUserLoading = false;
        },
        error: () => {
          this.isUserLoading = false;
          this.router.navigate(['/auth']);
        },
      });
  }

  /* ============== ACTIONS UI ============== */

  goToEditProfile() {
    this.router.navigate(['/settings'], { queryParams: { section: 'profile' } });
  }

  openPost(post: ProfilePostPreview) {
    // plus tard : router vers la page de détail
    console.log('Ouvrir la publication', post.id);
  }

  openFriend(friend: FriendPreview) {
    console.log('Ouvrir ami', friend.id);
  }

  openGroup(group: GroupPreview) {
    console.log('Ouvrir groupe', group.id);
  }

  openPhoto(photo: string) {
    console.log('Ouvrir photo', photo);
  }
}
