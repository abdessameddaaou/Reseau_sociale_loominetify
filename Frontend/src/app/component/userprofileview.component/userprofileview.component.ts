// src/app/components/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';

type HeaderTab = 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion';

interface ProfileUser {
  id: number | string;
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

/**
 * Réponse typique de ton API pour un profil public.
 * À adapter à ton backend.
 */
interface PublicProfileResponse {
  user: ProfileUser;
  isMe: boolean;
  isFollowing: boolean;
  followers: number;
  following: number;
  postsCount: number;

  // Optionnel : tu peux renvoyer ça directement depuis l’API
  lastPosts?: ProfilePostPreview[];
  recentActivity?: ProfileActivity[];
  stats?: {
    activityScore: number;
    daysStreak: number;
    groupsJoined: number;
  };
  badges?: string[];
  groups?: GroupPreview[];
  recentPhotos?: string[];
}

type FollowStatus = 'unknown' | 'following' | 'not-following' | 'requested';



@Component({
  selector: 'app-userprofileview',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './userprofileview.component.html',
})
export class UserprofileviewComponent implements OnInit{
   activeTab: HeaderTab = 'home';

  profileUser: ProfileUser | null = null;
  isLoading = true;
  isOwnProfile = false;

  defaultAvatar =
    'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';

  followers = 0;
  following = 0;
  postsCount = 0;

  followStatus: FollowStatus = 'not-following';

  recentActivity: ProfileActivity[] = [];

  stats = {
    activityScore: 0,
    daysStreak: 0,
    groupsJoined: 0,
  };

  badges: string[] = [];

  lastPosts: ProfilePostPreview[] = [];

  closeFriends: FriendPreview[] = [];

  groups: GroupPreview[] = [];

  recentPhotos: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '1';
    this.loadMockProfile(id);
  }

  /* ================== GETTERS ================== */

  get joinedDate(): string {
    if (!this.profileUser?.createdAt) return 'Non renseigné';
    return new Date(this.profileUser.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  get age(): string {
    if (!this.profileUser?.dateNaissance) return 'Non renseigné';
    const birth = new Date(this.profileUser.dateNaissance);
    if (isNaN(birth.getTime())) return this.profileUser.dateNaissance;
    const diff = Date.now() - birth.getTime();
    const ageDate = new Date(diff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${years} ans`;
  }

  /* ============== NAV HEADER ============== */

  setActiveTab(tab: HeaderTab) {
    this.activeTab = tab;

    if (tab === 'home') {
      this.router.navigate(['/fil-actualite']);
    } else if (tab === 'messages') {
      this.router.navigate(['/messages']);
    } else if (tab === 'settings') {
      this.router.navigate(['/settings']);
    } else if (tab === 'deconnexion') {
      // pour le moment tu peux laisser vide ou juste console.log
      console.log('Déconnexion à implémenter plus tard');
    }
  }

  /* ============== MOCK DE DONNÉES ============== */

  private loadMockProfile(id: string) {
    // ➜ Tu peux faire varier les données selon l’id si tu veux
    this.profileUser = {
      id,
      nom: 'Dupont',
      prenom: 'Alice',
      email: 'alice.dupont@example.com',
      telephone: '+33 6 12 34 56 78',
      dateNaissance: '1995-04-10',
      ville: 'Paris',
      pays: 'France',
      isAdmin: false,
      photo: this.defaultAvatar,
      createdAt: '2023-01-15T12:00:00Z',
      bio: 'Développeuse front passionnée par Angular et le design UI.',
      relationStatus: 'Célibataire',
      profession: 'Développeuse web',
      siteweb: 'https://alice.dev',
    };

    this.isOwnProfile = false;
    this.followStatus = 'not-following';

    this.followers = 123;
    this.following = 87;
    this.postsCount = 5;

    this.lastPosts = [
      {
        id: 1,
        text: 'Première publication sur ce super réseau ✨',
        timeAgo: 'Il y a 2h',
        likes: 14,
        comments: 3,
      },
      {
        id: 2,
        text: 'Je travaille sur un nouveau projet Angular, ça avance bien !',
        timeAgo: 'Hier',
        likes: 32,
        comments: 10,
      },
    ];

    this.recentActivity = [
      {
        id: 1,
        icon: 'comment',
        text: 'A commenté une publication.',
        timeAgo: 'Il y a 3 heures',
      },
      {
        id: 2,
        icon: 'group',
        text: 'A rejoint le groupe "Développeurs Angular".',
        timeAgo: 'Il y a 1 jour',
      },
    ];

    this.stats = {
      activityScore: 4.5,
      daysStreak: 12,
      groupsJoined: 3,
    };

    this.badges = ['Angular', 'UI/UX', 'TypeScript'];

    this.closeFriends = [
      {
        id: 10,
        name: 'John Martin',
        handle: 'johnm',
        avatar: this.defaultAvatar,
        online: true,
        mutual: 5,
      },
      {
        id: 11,
        name: 'Emma Leroy',
        handle: 'emma_l',
        avatar: this.defaultAvatar,
        online: false,
        mutual: 2,
      },
    ];

    this.groups = [
      {
        id: 1,
        name: 'Développeurs Angular',
        avatar: this.defaultAvatar,
        members: 120,
        role: 'Membre',
        lastActivity: 'Actif il y a 2 h',
      },
      {
        id: 2,
        name: 'UI Design Lovers',
        avatar: this.defaultAvatar,
        members: 80,
        role: 'Membre',
        lastActivity: 'Actif hier',
      },
    ];

    this.recentPhotos = [
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
    ];

    this.isLoading = false;
  }

  /* ============== FOLLOW / UNFOLLOW (mock) ============== */

toggleFollow() {
  if (!this.profileUser || this.isOwnProfile) return;

  if (this.followStatus === 'not-following') {
    this.followStatus = 'following';
    this.followers++;
  } else if (this.followStatus === 'following') {
    this.followStatus = 'not-following';
    this.followers = Math.max(0, this.followers - 1);
  }
}

  /* ============== ACTIONS UI ============== */

openConversationWithUser() {
  if (!this.profileUser) return;

  // Si ce n’est pas mon profil et que je ne suis pas abonné → on bloque
  if (!this.isOwnProfile && this.followStatus !== 'following') {
    return;
  }

  console.log('Ouvrir conversation avec', this.profileUser.id);
  // plus tard : redirection vers la page de messages
}


  goToEditProfile() {
    this.router.navigate(['/settings'], {
      queryParams: { section: 'profile' },
    });
  }

  openPost(post: ProfilePostPreview) {
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