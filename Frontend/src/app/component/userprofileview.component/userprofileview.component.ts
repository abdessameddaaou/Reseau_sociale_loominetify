// src/app/components/user-profile/userprofileview.component.ts
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
  email?: string;
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

type FollowStatus = 'unknown' | 'following' | 'not-following' | 'requested' | 'received';

@Component({
  selector: 'app-userprofileview',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './userprofileview.component.html',
})
export class UserprofileviewComponent implements OnInit {
  activeTab: HeaderTab = 'home';
  profileUser: ProfileUser | null = null;
  isLoading = true;
  defaultAvatar ='https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';
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
  Friends: FriendPreview[] = [];
  groups: GroupPreview[] = [];
  Photos: string[] = [];
  selectedPhoto: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.http.get<{ user: { id: number | string } }>(`${environment.apiUrl}/users/getUserconnected`,{ withCredentials: true }).subscribe({
          next: (res) => {
            const meId = res?.user?.id;
            if (meId != null && String(meId) === String(id)) {
              this.router.navigate(['/profile']);
              return;
            }
            this.loadUserProfile(id);
          },
          error: () => {
            this.loadUserProfile(id);
          },
        });
    });
  }

  /**
   * Charger l'utilisateur cherché
   * @param id
   */
  loadUserProfile(id: string) {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/users/getUser/${id}`, { withCredentials: true }).subscribe({
        next: (response) => {
          this.profileUser = response.user
           this.http.get<any>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true })
          .subscribe((meRes) => {
            this.resolveFollowStatus(meRes.user, String(this.profileUser?.id));
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  /** Getters */
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

  /**
   * Header nav
   * @param tab
   */
  setActiveTab(tab: HeaderTab) {
    this.activeTab = tab;

    if (tab === 'home') this.router.navigate(['/fil-actualite']);
    else if (tab === 'messages') this.router.navigate(['/messages']);
    else if (tab === 'settings') this.router.navigate(['/settings']);
    else if (tab === 'deconnexion') console.log('Déconnexion à implémenter plus tard');
  }

  /**
   * Suivre le profile
   * @returns
   */
  toggleFollow() {

  /**
   * Récupérer les amies graçe à l'id de l'utilisateur connecté récupér
   * Récupérer les posts d'un amie lorsque je fais follow
   *
   * */

    if (this.followStatus === 'not-following') {
      this.followStatus = 'following';
      this.followers++;
    } else {
      this.followStatus = 'not-following';
      this.followers--;
    }
  }

  /**
   * Ouvrir une conversation
   * @returns
   */
  openConversationWithUser() {
    if (!this.profileUser) return;
    if (this.followStatus !== 'following') return;
    this.router.navigate(['/messages']);
  }

  /**
   *
   * @param post
   */
  openPost(post: ProfilePostPreview) {
    console.log('Ouvrir la publication', post.id);
  }
  openFriend(friend: FriendPreview) {

    // redirection vers la page d el'amie ( cette page )
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

sendInvitation() {
      this.http.post<any>(`${environment.apiUrl}/amis/sendInvitation`, {
        friendId: this.profileUser?.id}, { withCredentials: true }).subscribe({
        next: (response) => {
          console.log('Invitation envoyée avec succès :', response);
          this.followStatus = 'requested';
        },
        error: (err) => {
          console.error('Erreur lors de l\'envoi de l\'invitation :', err);
        },
      });
  }


acceptInvitation() {
    this.http.post<any>(`${environment.apiUrl}/amis/acceptInvitation`, {
      requesterId: this.profileUser?.id}, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('Invitation acceptée avec succès :', response);
        this.followStatus = 'following';
        this.followers++;
      },
      error: (err) => {
        console.error('Erreur lors de l\'acceptation de l\'invitation :', err);
      },
    });
}

rejectInvitation() {
    this.http.post<any>(`${environment.apiUrl}/amis/refuseInvitation`, {
      requesterId: this.profileUser?.id}, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('Invitation refusée avec succès :', response);
        this.followStatus = 'not-following';
      },
      error: (err) => {
        console.error('Erreur lors du refus de l\'invitation :', err);
      },
    });
}

private resolveFollowStatus(
  me: any,
  profileId: string
) {
  const myId = String(me.id);

  // 1️⃣ Amis (accepté dans les deux sens)
  const isFriend =
    me.sentRelations?.some(
      (r: any) =>
        String(r.addresseeId) === profileId &&
        r.status === 'accepté'
    ) ||
    me.receivedRelations?.some(
      (r: any) =>
        String(r.requesterId) === profileId &&
        r.status === 'accepté'
    );

  if (isFriend) {
    this.followStatus = 'following';
    return;
  }

  // 2️⃣ Invitation envoyée par moi
  const sentRequest = me.sentRelations?.some(
    (r: any) =>
      String(r.addresseeId) === profileId &&
      r.status === 'envoyée'
  );

  if (sentRequest) {
    this.followStatus = 'requested';
    return;
  }

  // 3️⃣ Invitation reçue par moi
  const receivedRequest = me.receivedRelations?.some(
    (r: any) =>
      String(r.requesterId) === profileId &&
      r.status === 'envoyée'
  );

  if (receivedRequest) {
    this.followStatus = 'received';
    return;
  }

  // 4️⃣ Aucune relation
  this.followStatus = 'not-following';
}
}
