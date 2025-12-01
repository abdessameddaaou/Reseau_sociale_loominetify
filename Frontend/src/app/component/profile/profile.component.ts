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

  // champs qu’on pourra remplir plus tard côté backend
  relationStatus?: string; // 'Célibataire', 'En couple', etc.
  profession?: string;     // 'Développeur web', etc.
  website?: string;        // 'https://...'
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

  defaultAvatar = 'https://i.pravatar.cc/150?img=5';

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

  // Dernières publications (aperçu)
  lastPosts: ProfilePostPreview[] = [
    {
      id: 1,
      text: 'Belle journée pour explorer la nature 🌿 Les montagnes sont magnifiques cette saison.',
      timeAgo: 'Il y a 2 heures',
      likes: 124,
      comments: 24,
    },
    {
      id: 2,
      text: 'On push en prod ce soir 💻 Petite montée d’adrénaline pour l’équipe Loominetfy !',
      timeAgo: 'Hier',
      likes: 89,
      comments: 15,
    },
    {
      id: 3,
      text: 'Nouvelle version de Loominetfy en préparation ✨ Hâte de vous montrer les nouveautés !',
      timeAgo: 'Il y a 3 jours',
      likes: 210,
      comments: 32,
    },
  ];

  // Amis proches
  closeFriends: FriendPreview[] = [
    {
      id: 1,
      name: 'Sophie Martin',
      handle: 'sophie.martin',
      avatar: 'https://i.pravatar.cc/150?img=1',
      online: true,
      mutual: 12,
    },
    {
      id: 2,
      name: 'Thomas Leroy',
      handle: 'thomas.leroy',
      avatar: 'https://i.pravatar.cc/150?img=12',
      online: true,
      mutual: 7,
    },
    {
      id: 3,
      name: 'Groupe Dev Loominetfy',
      handle: 'dev.loom',
      avatar: 'https://i.pravatar.cc/150?img=5',
      online: false,
      mutual: 5,
    },
  ];

  // Groupes
  groups: GroupPreview[] = [
    {
      id: 1,
      name: 'Loominetfy · Dev & Design',
      avatar: 'https://i.pravatar.cc/150?img=30',
      members: 48,
      role: 'Admin',
      lastActivity: 'Actif aujourd’hui',
    },
    {
      id: 2,
      name: 'Startup & Productivité',
      avatar: 'https://i.pravatar.cc/150?img=18',
      members: 132,
      role: 'Membre',
      lastActivity: 'Il y a 3 h',
    },
    {
      id: 3,
      name: 'Photographie & Créa',
      avatar: 'https://i.pravatar.cc/150?img=22',
      members: 76,
      role: 'Membre',
      lastActivity: 'Hier',
    },
  ];

  // Photos récentes (mock)
  recentPhotos: string[] = [
    'https://images.pexels.com/photos/712876/pexels-photo-712876.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/733745/pexels-photo-733745.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/6335/man-coffee-cup-pen.jpg?auto=compress&cs=tinysrgb&w=600',
  ];

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /* ================== GETTERS ================== */

  get displayName(): string {
    if (!this.currentUser) return 'Utilisateur';
    return `${this.currentUser.prenom} ${this.currentUser.nom}`.trim();
  }

  get handle(): string {
    if (!this.currentUser) return 'profil';
    return this.currentUser.nom || 'profil';
  }

  get location(): string {
    if (!this.currentUser) return '';
    const city = this.currentUser.ville;
    const country = this.currentUser.pays;
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    return 'Localisation non renseignée';
  }

  get joinedDate(): string {
    if (!this.currentUser?.createdAt) return 'Non renseigné';
    return new Date(this.currentUser.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  get bio(): string {
    return (
      this.currentUser?.bio ||
      "Une petite bio pourra apparaître ici quand vous l'aurez remplie dans vos paramètres. Présentez-vous, parlez de vos passions ou de ce que vous partagez sur Loominetfy ✨"
    );
  }

  get relationStatus(): string {
    return this.currentUser?.relationStatus || 'Non renseigné';
  }

  get profession(): string {
    return this.currentUser?.profession || 'Non renseignée';
  }

  get age(): string {
    if (!this.currentUser?.dateNaissance) return 'Non renseigné';
    const birth = new Date(this.currentUser.dateNaissance);
    if (isNaN(birth.getTime())) return this.currentUser.dateNaissance;
    const diff = Date.now() - birth.getTime();
    const ageDate = new Date(diff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${years} ans`;
  }

  get website(): string {
    return this.currentUser?.website || '';
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
    this.http
      .get<{ user: CurrentUser }>(
        `${environment.apiUrl}/users/getUserconnected`,
        { withCredentials: true }
      )
      .subscribe({
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

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  goToFeed() {
    this.router.navigate(['/fil-actualite']);
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
