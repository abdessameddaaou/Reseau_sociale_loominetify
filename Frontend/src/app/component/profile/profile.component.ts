import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../service/socket.service';
import { Subscription } from 'rxjs';

type HeaderTab = 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion';

interface CurrentUser {
  nom: string;
  prenom: string;
  username: string;
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
  hashtags?: string[];
}

interface ApiComment {
  id: number;
  contenu: string;
  image: string | null;
  nombreLikes: number;
  createdAt: string;
  mine: boolean;
  user: {
    id: number;
    nom: string;
    prenom: string;
    photo?: string;
  };
}

interface ApiPublication {
  id: number;
  description: string | null;
  image: string | null;
  video: string | null;
  nombreLikes: number;
  nombrePartages: number;
  createdAt: string;
  updatedAt: string;
  userId: number;

  comments?: ApiComment[];
  Comments?: ApiComment[];
  visibility?: 'public' | 'private';
}

interface ProfilePostPreview {
  id: number;
  description: string | null;
  image?: string | null;
  likes: number;
  commentaires: number;
  createdAt?: string;
  timeAgo: string;
  comments: ApiComment[];
  showAllComments: boolean;
  visibility?: 'public' | 'private';
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

interface FollowUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photo?: string;
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
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit, OnDestroy {


  /**
   * Variables
   */
  recentActivity: ProfileActivity[] = [
    { id: 1, icon: 'comment', text: 'A commenté une publication.', timeAgo: 'Il y a 2 heures' },
    { id: 2, icon: 'star', text: 'A ajouté une publication aux favoris.', timeAgo: 'Hier' },
    { id: 3, icon: 'group', text: 'A rejoint un nouveau groupe.', timeAgo: 'Il y a 3 jours' },
  ];

  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';
  activeTab: HeaderTab = 'home';
  currentUser: CurrentUser | null = null;
  isUserLoading = true;
  stats = { activityScore: 0, daysStreak: 0, groupsJoined: 0 };
  followers = 0;
  following = 0;
  postsCount = 0;
  Publications: ProfilePostPreview[] = [];
  Friends: FriendPreview[] = [];
  groups: GroupPreview[] = [];
  Photos: string[] = [];
  selectedPhoto: string | null = null;
  selectedPost: ProfilePostPreview | null = null;
  selectedPostComments: ApiComment[] = [];
  newCommentText: { [postId: number]: string } = {};
  selectedCommentImage: { [postId: number]: File | null } = {};
  commentImagePreview: { [postId: number]: string | null } = {};
  commentLoading = false;
  likeLoading = false;

  // Modal followers/following
  showFollowModal = false;
  followModalTab: 'followers' | 'following' | 'friends' = 'followers';
  followersList: FollowUser[] = [];
  followingList: FollowUser[] = [];

  // Socket subscriptions
  private socketSubs: Subscription[] = [];
  private currentUserIdNum: number | null = null;

  constructor(private router: Router, private http: HttpClient, private socketService: SocketService) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMyPosts();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.socketSubs.forEach(s => s.unsubscribe());
  }

  private setupSocketListeners() {
    // Quand quelqu'un s'abonne ou se désabonne → mettre à jour les compteurs
    this.socketSubs.push(
      this.socketService.onNewFollow().subscribe((data: any) => {
        if (this.currentUserIdNum == null) return;
        // Quelqu'un s'est abonné à MOI
        if (data.followingId === this.currentUserIdNum) {
          this.followers++;
          // Recharger pour mettre à jour les listes
          this.loadCurrentUser();
        }
        // MOI je me suis abonné à quelqu'un (via un autre onglet par ex)
        if (data.followerId === this.currentUserIdNum) {
          this.following++;
        }
      })
    );

    this.socketSubs.push(
      this.socketService.onUnfollow().subscribe((data: any) => {
        if (this.currentUserIdNum == null) return;
        // Quelqu'un s'est désabonné de MOI
        if (data.followingId === this.currentUserIdNum) {
          this.followers = Math.max(0, this.followers - 1);
          this.loadCurrentUser();
        }
        // MOI je me suis désabonné
        if (data.followerId === this.currentUserIdNum) {
          this.following = Math.max(0, this.following - 1);
        }
      })
    );
  }

  /**
   * Getters 
   */
  get joinedDate(): string {
    if (!this.currentUser?.createdAt) return 'Non renseigné';
    return new Date(this.currentUser.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
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

  /**
   * Navbar pour le header
   * @param tab 
   */
  setActiveTab(tab: HeaderTab) {
    this.activeTab = tab;

    if (tab === 'home') this.router.navigate(['/fil-actualite']);
    else if (tab === 'messages') this.router.navigate(['/messages']);
    else if (tab === 'settings') this.router.navigate(['/settings']);
    else if (tab === 'deconnexion') {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
        next: () => this.router.navigate(['/auth']),
        error: () => this.router.navigate(['/auth']),
      });
    }
  }

  /**
   * Charger les informations de l'utilisateur connecté 
   */
  loadCurrentUser() {
    this.http
      .get<any>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.currentUser = res.user;
          this.currentUserIdNum = res.user.id;
          this.isUserLoading = false;

          // Charger les compteurs
          const followersArr = res.user.followers || [];
          const followingArr = res.user.following || [];
          this.followers = followersArr.length;
          this.following = followingArr.length;
          this.followersList = followersArr;
          this.followingList = followingArr;

          // Construire la liste d'amis à partir des relations acceptées
          const sentFriends = (res.user.sentRelations || [])
            .filter((r: any) => r.status === 'acceptée')
            .map((r: any) => r.addresseeId);
          const receivedFriends = (res.user.receivedRelations || [])
            .filter((r: any) => r.status === 'acceptée')
            .map((r: any) => r.requesterId);
          const friendIds = new Set([...sentFriends, ...receivedFriends]);

          // Chercher les infos des amis dans followers + following
          const allUsers = [...followersArr, ...followingArr];
          const seen = new Set<number>();
          this.Friends = [];
          for (const u of allUsers) {
            if (friendIds.has(u.id) && !seen.has(u.id)) {
              seen.add(u.id);
              this.Friends.push({
                id: u.id,
                name: `${u.prenom} ${u.nom}`,
                handle: `@${u.prenom}${u.nom}`,
                avatar: u.photo || this.defaultAvatar,
                online: false,
                mutual: 0
              });
            }
          }
        },
        error: () => {
          this.isUserLoading = false;
          this.router.navigate(['/auth']);
        },
      });
  }

  /**
   * Redirection vers la page settings pour modifier le profile
   */
  goToEditProfile() {
    this.router.navigate(['/settings'], { queryParams: { section: 'profile' } });
  }

  /**
   * Ouvrir les publications 
   * @param post 
   */
  openPost(post: ProfilePostPreview) {
    this.selectedPost = post;
    this.selectedPostComments = Array.isArray(post.comments) ? [...post.comments] : [];
    this.newCommentText[post.id] = this.newCommentText[post.id] ?? '';
    this.selectedCommentImage[post.id] = this.selectedCommentImage[post.id] ?? null;
    this.commentImagePreview[post.id] = this.commentImagePreview[post.id] ?? null;
  }

  /**
   * Fermer les publications
   */
  closePostModal() {
    this.selectedPost = null;
    this.selectedPostComments = [];
  }

  /**
   * Ouvrir les photos
   * @param photo 
   */
  openPhoto(photo: string) {
    this.selectedPhoto = photo;
  }

  /**
   * Fermer les photos
   */
  closePhotoModal() {
    this.selectedPhoto = null;
  }

  /**
   * Naviguer pour voir la liste des amies
   * @param friend 
   */
  openFriend(friend: FriendPreview) {
    console.log('Ouvrir ami', friend.id);
  }

  /**
   * Naviguer pour voir mes groupes
   * @param group 
   */
  openGroup(group: GroupPreview) {
    console.log('Ouvrir groupe', group.id);
  }

  // ── Modal followers/following ──
  openFollowModal(tab: 'followers' | 'following' | 'friends') {
    this.followModalTab = tab;
    this.showFollowModal = true;
  }

  closeFollowModal() {
    this.showFollowModal = false;
  }

  navigateToProfile(userId: number) {
    this.showFollowModal = false;
    this.router.navigate(['/profil', userId]);
  }

  deleteFriend(friendId: number) {
    this.http.post<any>(`${environment.apiUrl}/amis/deleteFriend`, { friendId }, { withCredentials: true }).subscribe({
      next: () => {
        this.Friends = this.Friends.filter(f => f.id !== friendId);
        // Recharger les données pour mettre à jour les compteurs
        this.loadCurrentUser();
      },
      error: (err) => console.error('Erreur suppression ami :', err)
    });
  }

  unfollowUser(userId: number) {
    this.http.delete<any>(`${environment.apiUrl}/amis/unfollowUser/${userId}`, { withCredentials: true }).subscribe({
      next: () => {
        this.followingList = this.followingList.filter(u => u.id !== userId);
        this.following = this.followingList.length;
      },
      error: (err) => console.error('Erreur unfollow :', err)
    });
  }



  /**
   * Chargement de l'image
   * @param imagePath 
   * @returns 
   */
  srcImage(imagePath?: string | null): string {
    if (!imagePath) return '';
    const api = environment.apiUrl.replace(/\/$/, '');
    return `${api}/media/${encodeURIComponent(imagePath)}`;
  }

  /**
   * Méthode pour le compteur de la date de publication / photo
   * @param dateStr 
   * @returns 
   */
  timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    if (!dateStr || isNaN(date.getTime())) return "à l’instant";

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
   * Charger mes publications et commentaires
   */
  loadMyPosts() {
    this.http.get<ApiPublication[]>(`${environment.apiUrl}/publications/getAllPostUserConnected`, { withCredentials: true }).subscribe({
      next: (posts) => {
        const list = Array.isArray(posts) ? posts : [];

        this.Publications = list.map((res) => {
          const rawComments = (res.comments ?? res.Comments ?? []) as ApiComment[];
          const safeComments = Array.isArray(rawComments) ? rawComments : [];

          return {
            id: res.id,
            description: res.description,
            timeAgo: this.timeAgo(res.createdAt),
            likes: res.nombreLikes ?? 0,
            commentaires: safeComments.length,
            image: res.image,
            createdAt: res.createdAt,
            comments: safeComments,
            showAllComments: false,
            visibility: res.visibility,
          };
        });

        this.postsCount = this.Publications.length;

        this.Photos = list
          .filter((p) => !!p.image)
          .map((p) => this.srcImage(p.image!));
      },
      error: (err) => {
        console.error('Erreur récupération posts', err);
        this.Publications = [];
        this.Photos = [];
        this.postsCount = 0;
      },
    });
  }

  /**
   * Afficher et ne pas afficher tous les messages
   * @param post 
   */
  toggleComments(post: ProfilePostPreview) {
    post.showAllComments = !post.showAllComments;
    if (this.selectedPost?.id === post.id) {
      this.selectedPostComments = [...post.comments];
    }
  }

  /**
   * Ajouter les images dans les commentaires
   * @param event 
   * @param postId 
   * @returns 
   */
  onCommentImageSelected(event: Event, postId: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.selectedCommentImage[postId] = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.commentImagePreview[postId] = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Supprimer les images depuis commentaire
   * @param postId 
   * @param input 
   */
  removeCommentImage(postId: number, input: HTMLInputElement) {
    this.selectedCommentImage[postId] = null;
    this.commentImagePreview[postId] = null;
    input.value = '';
  }

  /**
   * Ajouter un commentaires pour une publication
   * @returns 
   */
  addCommentSelectedPost() {
    if (!this.selectedPost) return;

    const postId = this.selectedPost.id;
    const text = (this.newCommentText[postId] || '').trim();
    const image = this.selectedCommentImage[postId];

    if (!text && !image) return;

    const formData = new FormData();
    if (text) formData.append('text', text);
    if (image) formData.append('image', image);

    this.commentLoading = true;

    this.http.post<ApiComment>(`${environment.apiUrl}/publications/addComment/${postId}`, formData, { withCredentials: true }).subscribe({
      next: (createdComment) => {
        const postId = this.selectedPost!.id;

        const fixed: ApiComment = {
          id: createdComment.id,
          contenu: createdComment.contenu ?? (this.newCommentText[postId] || '').trim(),
          image: createdComment.image ?? null,
          nombreLikes: createdComment.nombreLikes ?? 0,
          createdAt:
            createdComment.createdAt && !isNaN(new Date(createdComment.createdAt).getTime())
              ? createdComment.createdAt
              : new Date().toISOString(),
          mine: createdComment.mine ?? true,
          user: createdComment.user ?? {
            id: 0,
            nom: this.currentUser?.nom ?? 'Moi',
            prenom: this.currentUser?.prenom ?? '',
            photo: this.currentUser?.photo ?? this.defaultAvatar,
          },
        };

        this.selectedPost!.comments = [...(this.selectedPost!.comments ?? []), fixed];
        this.selectedPost!.commentaires = this.selectedPost!.comments.length;
        this.selectedPostComments = [...this.selectedPost!.comments];

        const idx = this.Publications.findIndex(p => p.id === postId);
        if (idx !== -1) {
          this.Publications[idx].comments = [...this.selectedPost!.comments];
          this.Publications[idx].commentaires = this.selectedPost!.commentaires;
        }
        this.newCommentText[postId] = '';
        this.selectedCommentImage[postId] = null;
        this.commentImagePreview[postId] = null;

        this.commentLoading = false;
      },

      error: (err) => {
        console.error('Erreur ajout commentaire', err);
        this.commentLoading = false;
      },
    });
  }

  /**
   * Supprimer un commentaire
   * @param post 
   * @param comment 
   * @returns 
   */
  deleteComment(post: ProfilePostPreview, comment: ApiComment) {
    if (!comment.mine) return;

    this.http.delete(`${environment.apiUrl}/posts/${post.id}/comments/${comment.id}`, { withCredentials: true }).subscribe({
      next: () => {
        post.comments = (post.comments || []).filter((c) => c.id !== comment.id);
        post.commentaires = post.comments.length;

        if (this.selectedPost?.id === post.id) {
          this.selectedPost!.comments = [...post.comments];
          this.selectedPost!.commentaires = post.commentaires;
          this.selectedPostComments = [...post.comments];
        }
        const idx = this.Publications.findIndex((p) => p.id === post.id);
        if (idx !== -1) {
          this.Publications[idx].comments = [...post.comments];
          this.Publications[idx].commentaires = post.commentaires;
        }
      },
      error: (err) => {
        console.error('Erreur suppression commentaire', err);
      },
    });
  }

  /**
   * Liker une publication
   * @returns 
   */
  toggleLikeSelectedPost() {
    if (!this.selectedPost) return;
    this.likeLoading = true;
    const postId = this.selectedPost.id;
    const valueLike = true;

    this.http.post(`${environment.apiUrl}/posts/${postId}/like`, { like: valueLike }, { withCredentials: true }).subscribe({
      next: () => {
        this.loadMyPosts();
        this.likeLoading = false;
      },
      error: (err) => {
        console.error('Erreur like', err);
        this.likeLoading = false;
      },
    });
  }
}
