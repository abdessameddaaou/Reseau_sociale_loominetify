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
  description: string;
  image?: string | null;
  likes: number;
  commentaires: number;
  createdAt?: string;
  timeAgo: string;
}

interface ApiPublication {
  id: number;
  description: string;
  image: string | null;
  likes?: number;
  commentaires?: number;
  createdAt: string;
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

  /**
   * Variables
   */
  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';
  activeTab: HeaderTab = 'home';
  currentUser: CurrentUser | null = null;
  isUserLoading = true;
  stats = {
    activityScore: 0,
    daysStreak: 0,
    groupsJoined: 0,
  };
  followers = 0;
  following = 0;
  postsCount = 0;
  badges: string[] = ['WebDev'];
  Publications: ProfilePostPreview[] = []
  Friends: FriendPreview[] = []
  groups: GroupPreview[] = [];
  Photos: string[] = [];
  selectedPhoto: string | null = null;

  constructor(private router: Router, private http: HttpClient ) {}

  /**
   * ngOninit => Pour l'affiche lors de chargement de la page
   */
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMyPosts();
  }

/**
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
 * Calculer l'age de l'utilisateur
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


/**
 * Navigation dans le header
 * @param tab 
 */
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


/**
 * Récupération de l'utilisateur connecté
 */
loadCurrentUser() {
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
    this.selectedPhoto = photo;
  }

  closePhotoModal() {
    this.selectedPhoto = null;
  }

/**
 * uploader une image
 * @param imagePath 
 * @returns 
 */
srcImage(imagePath?: string | null): string {
  if (!imagePath) return '';
  const api = environment.apiUrl.replace(/\/$/, '');
  return `${api}/media/${encodeURIComponent(imagePath)}`;
}

/**
 * Affichage de la date dans la publication
 * @param dateStr 
 * @returns 
 */
timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;

  return date.toLocaleDateString('fr-FR');
}

/**
 * Récupération des publications
 */
loadMyPosts() {
  this.http.get<ApiPublication[]>(`${environment.apiUrl}/publications/getAllPostUserConnected`, { withCredentials: true }).subscribe({
      next: (posts) => {
      const list = posts ?? [];
        this.Publications = list.map(res => ({
          id: res.id,
          description: res.description,
          timeAgo: this.timeAgo(res.createdAt),
          likes: res.likes ?? 0,
          commentaires: res.commentaires ?? 0,
          image: res.image,
          createdAt: res.createdAt
        }));
        this.postsCount = list.length;
        this.Photos = list
          .filter(p => !!p.image)
          .map(p => this.srcImage(p.image!));
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des informations de l\'utilisateur de l’invitation', err);
        this.Publications = [];
        this.Photos = [];
        this.postsCount = 0;
      }
    });
}



}
