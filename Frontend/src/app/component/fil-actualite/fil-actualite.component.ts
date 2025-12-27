import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HeaderComponent } from '../header/header.component';
import { PostCreatorComponent } from '../post-creator/post-creator.component';
import { environment } from '../../../environments/environment.dev';
import { ThemeService } from '../../service/theme.service';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import { de, fr, th } from 'date-fns/locale';
import sweetalert2 from 'sweetalert2';
import { RealtimeService } from '../../service/realtime.service';

/**
 * Interface Commentaires
 */
interface PostComment {
  id: number;
  user: { id: number; nom: string; prenom: string; photo?: string; username?: string };
  contenu: string;
  image?: string;
  nombreLikes: number;
  mine: boolean;
  createdAt: string;
}

/**
 * Interface Interactions
 */
interface PostInteraction {
  id: number;
  userId: number;
  publicationId: number;
}

/**
 * Interface Post
 */
interface Post {
  id: number;
  description: string;
  image?: string;
  user: { id: number; nom: string; prenom: string; photo?: string; username?: string };
  nombreLikes: number;
  nombrePartages: number;
  createdAt: string;
  authorAvatar: string;
  timeAgo: string;
  text: string;
  likes: number;
  commentsCount: number;
  shares: number;
  likedByMe: boolean;
  comments: PostComment[];
  showAllComments: boolean;
  interactions: PostInteraction[] | null;
  sharedPublication: Post | null;
  commentairePartage?: string | null;
}

/**
 * Interface Amis
 */
interface OnlineFriend {
  name: string;
  avatar: string;
  status?: string;
  lastActive?: string;
}

/**
 * Interface User
 */
export interface CurrentUser {
  nom: string;
  id: number;
  prenom: string;
  isAdmin: boolean;
  photo?: string;
  username?: string;
}

/**
 * Type pour écouter sur les commentaires
 */
type NewCommentEvent = {
  publicationId: number;
  comment: PostComment;
};

/**
 * Type pour écouter sur les likes des commentaires
 */
type CommentLikeEvent = {
  commentId: number;
  publicationId: number;
  likesCount: number;
  userId?: number;
};

/**
 * Type pour écouter sur les likes des publications
 */
type PostLikeEvent = {
  publicationId: number;
  likesCount: number;
  userId: number;
  liked: boolean;
};


/**
 * Type pour écouter sur les partages des publications
 */
type PostShareEvent = {
 publicationId: number,
 sharesCount: number
};

@Component({
  selector: 'app-fil-actualite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, HeaderComponent, PostCreatorComponent, RouterModule],
  templateUrl: './fil-actualite.component.html',
})
export class FilActualiteComponent implements OnInit, OnDestroy {

  /**
   * VARIABLES
   */
  activeTab: 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion' = 'home';
  currentUser: CurrentUser | null = null;
  onlineFriends: OnlineFriend[] = [];
  postForm: FormGroup;
  imagePreview: string | null = null;
  formErrors: { [key: string]: string } = {};

  allPosts: Post[] = [];
  visiblePosts: Post[] = [];

  isInitialLoading = true;
  isLoadingMore = false;
  hasMore = true;

  newCommentText: { [postId: number]: string } = {};
  selectedFriend: OnlineFriend | null = null;
  selectedCommentImage: { [postId: number]: File | null } = {};
  commentImagePreview: { [postId: number]: string | null } = {};
  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';

  postsPage = 0;
  readonly postsLimit = 5;

  selectedPhoto: string | null = null;
  likedUsers: CurrentUser[] = [];
  CommentsUsers: CurrentUser[] = [];
  ShareUsers: CurrentUser[] = [];
  showLikesModal = false;
  showCommentsModal = false;
  showUsersShareModal = false;
  isShareModalOpen = false;
  postToShare: Post | null = null;
  shareDescription = '';
  isSharing = false;

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient, private themeService: ThemeService, private realtimeService: RealtimeService) {
    this.postForm = this.fb.group({
      text: ['', [Validators.maxLength(1000)]],
      image: [null],
    });
  }

  /**
   * INITIALISATION
   */
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadOnlineFriends();
    this.loadInitialPosts();

    this.realtimeService.connect();

    /**
     * Vérifier s'il y a nouveaux publications
     */
    this.realtimeService.on<Post>('new_publication', (newPost) => {
      console.log(' Connexion à Socekt réussi pour les publications :', newPost.id);
      this.addNewPostToList(newPost);
    });


    /**
     * Vérifier s'il y a nouveaux commentaires
     */
    this.realtimeService.on<NewCommentEvent>('new_comment', (data) => {
      console.log(' Connexion à Socekt réussi pour les commeentaires :', data.publicationId, data.comment.id);
       this.addNewCommentToPost(data.publicationId, data.comment);
    });


    /**
     * Vérifier s'il y a nouveaux likes pour le commentaire
     */
    this.realtimeService.on<CommentLikeEvent>('comment_like_updated', (data) => {
      console.log(' Connexion à Socekt réussi pour les likes :', data.publicationId, data.commentId, data.likesCount);
      this.addNewLikeToComment(data.publicationId, data.commentId, data.likesCount);
    });


    /**
     * Vérifier s'il y a nouveaux likes pour la publication
     */
    this.realtimeService.on<PostLikeEvent>('post_like_updated', (data) => {
      console.log(' Connexion à Socekt réussi pour les likes publication :', data.publicationId, data.likesCount, data.liked, data.userId);
      this.addNewLikeToPost(data.publicationId, data.likesCount, data.liked, data.userId);
    });


    /**
     * Vérifier s'il y a nouveaux likes pour la publication
     */
    this.realtimeService.on<PostShareEvent>('post_share_updated', (data) => {
      console.log(' Connexion à Socekt réussi pour les shares publication :', data.publicationId, data.sharesCount);
      this.addNewShareToPost(data.publicationId, data.sharesCount);
    });

  }



  /**
   * Se déconnecter de websocekt afin de s'arrêter d'écouter
   */
  ngOnDestroy(): void {
    this.realtimeService.disconnect();
  }

  /**
   * Gestion des publications ( pour vérifier si la publications existe ou non)
   * @param post 
   */
  addNewPostToList(post: Post) {
    const alreadyExists = this.allPosts.some((p) => p.id === post.id);

    if (!alreadyExists) {
      const postReady: Post = {
        ...post,
        showAllComments: false,
        likedByMe: false,
        commentsCount: post.comments ? post.comments.length : 0,
        interactions: post.interactions || [],
        comments: post.comments || [],
        nombreLikes: post.nombreLikes || 0,
        shares: post.shares || 0,
      };

      this.allPosts = [postReady, ...this.allPosts];
      this.visiblePosts = [...this.allPosts];
    }
  }


 /**
  * Gestion des commentaires ( pour vérifier si le commentaire existe ou non)
  * @param publicationId 
  * @param comment 
  */
  addNewCommentToPost(publicationId: number, comment: PostComment) {
    const post = this.allPosts.find(p => p.id === publicationId);
     if (!post) return;

    const alreadyExists = post.comments.some(c => c.id === comment.id);
    if (alreadyExists) return;
      post.comments = [...(post.comments ?? []), comment];
      post.commentsCount = (post.commentsCount ?? 0) + 1;

      this.visiblePosts = [...this.allPosts];
  }


  /**
   * Gestion des likes pour le commentaire
   * @param publicationId 
   * @param commentId 
   * @param likesCount 
   * @returns 
   */
  addNewLikeToComment(publicationId: number, commentId: number, likesCount: number) {
    const post = this.allPosts.find(p => p.id === publicationId);
    if (!post) return;

    const comment = post.comments?.find(c => c.id === commentId);
    if (!comment) return;

    comment.nombreLikes = likesCount;
    this.visiblePosts = [...this.allPosts];
  }


  /**
   * Gestion des likes pour la publication
   * @param publicationId 
   * @param likesCount 
   * @param liked 
   * @param userId 
   * @returns 
   */
  addNewLikeToPost(publicationId: number, likesCount: number, liked: boolean, userId: number) {
    const post = this.allPosts.find(p => p.id === publicationId);
      if (!post) return;

      post.nombreLikes = likesCount
      if(userId == this.currentUser?.id)
      {
        post.likedByMe = liked
      }
    this.visiblePosts = [...this.allPosts];
  }


  /**
   * Gestion des shares pour les publications
   * @param publicationId 
   * @param sharesCount 
   * @returns 
   */
  addNewShareToPost(publicationId: number, sharesCount: number){

    const post = this.allPosts.find(p => p.id === publicationId);
      if (!post) return;
      post.nombrePartages  = sharesCount;
    this.visiblePosts = [...this.allPosts];
  }



  /**
   * Navigation dans le navbar
   * @param tab 
   */
  setActiveTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    if (tab === 'home') {
      this.router.navigate(['/fil-actualite']);
    } else if (tab === 'deconnexion') {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
        next: () => {
          this.themeService.applyAuthTheme();
          this.router.navigate(['/auth']);
        },
        error: () => {
          this.themeService.applyAuthTheme();
          this.router.navigate(['/auth']);
        },
      });
    } else if (tab === 'messages') {
      this.router.navigate(['/messages']);
    } else if (tab === 'settings') {
      this.router.navigate(['/settings']);
    }
  }

  /**
   * Charger les données de l'utilisateur connecté depuis sle backend
   */
  loadCurrentUser() {
    this.http
      .get<{ user: CurrentUser }>(`${environment.apiUrl}/users/getUserconnected`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.currentUser = res.user;
        },
        error: () => {
          this.themeService.applyAuthTheme();
          this.router.navigate(['/auth']);
        },
      });
  }

  /**
   * Charger les amies connectés
   */
  loadOnlineFriends() {
    this.http
      .get<OnlineFriend[]>(`${environment.apiUrl}/friends/online`, { withCredentials: true })
      .subscribe({
        next: (friends) => {
          this.onlineFriends = friends;
        },
        error: (err) => {
          this.onlineFriends = [];
        },
      });
  }

  openChat(friend: OnlineFriend) {
    this.selectedFriend = friend;
    this.activeTab = 'messages';
  }

  /**
   * Charger des publications
   */
  loadInitialPosts() {
    this.isInitialLoading = true;
    this.postsPage = 0;

    this.http.get<Post[]>(`${environment.apiUrl}/publications/getAllPosts`, {
      params: {
        page: this.postsPage.toString(),
        limit: this.postsLimit.toString(),
      },
      withCredentials: true,
    }).subscribe({
      next: (posts) => {
        const postsWithUIState = posts.map((post) => ({
          ...post,
          showAllComments: false,
          likedByMe: Array.isArray(post.interactions) ? post.interactions.some((i) => i.userId === this.currentUser?.id) : false,
          commentsCount: post.comments ? post.comments.length : 0,
        }));
        this.allPosts = postsWithUIState;
        this.visiblePosts = postsWithUIState;
        this.hasMore = posts.length === this.postsLimit;
        this.isInitialLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement posts', err);
        this.isInitialLoading = false;
        this.hasMore = false;
        this.allPosts = [];
        this.visiblePosts = [];
      },
    });
  }

  /**
   * Méthode qui permet de récupérer les publications depuis le backend
   * @returns 
   */
  loadMorePosts() {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    this.postsPage++;

    this.http
      .get<Post[]>(`${environment.apiUrl}/publications/getAllPosts`, {
        params: {
          page: this.postsPage.toString(),
          limit: this.postsLimit.toString(),
        },
        withCredentials: true,
      })
      .subscribe({
        next: (posts) => {

          const uniqueNewPosts = posts.filter(newPost => 
            !this.allPosts.some(existingPost => existingPost.id === newPost.id)
          );

          if (posts.length < this.postsLimit) {
             this.hasMore = false;
          }


          if (uniqueNewPosts.length > 0) {
          const formattedPosts = uniqueNewPosts.map((post) => ({
            ...post,
            showAllComments: false,
            likedByMe: Array.isArray(post.interactions)
              ? post.interactions.some((i) => i.userId === this.currentUser?.id)
              : false,
            commentsCount: post.comments ? post.comments.length : 0,
          }));

          this.allPosts = [...this.allPosts, ...formattedPosts];
          this.visiblePosts = this.allPosts;
          this.hasMore = posts.length === this.postsLimit;
          this.isLoadingMore = false;
          }
        },
        error: (err) => {
          this.isLoadingMore = false;
          this.hasMore = false;
        },
      });
  }

  /**
   * Listenner qui écoute pour charger plus de publications 
   */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const threshold = 300;
    const position = window.innerHeight + window.scrollY;
    const height = document.body.offsetHeight;
    if (position + threshold >= height) {
      this.loadMorePosts();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.postForm.patchValue({ image: null });
      this.imagePreview = null;
      return;
    }

    const file = input.files[0];
    this.formErrors['image'] = '';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];

    if (!allowedTypes.includes(file.type)) {
      this.formErrors['image'] = 'Format non supporté. (JPG, PNG, HEIC)';
      this.postForm.patchValue({ image: null });
      this.imagePreview = null;
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.formErrors['image'] = 'Taille trop grande (Max 5Mo).';
      this.postForm.patchValue({ image: null });
      this.imagePreview = null;
      return;
    }

    this.postForm.patchValue({ image: file });
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Publier une publication
   * @returns 
   */
  publishPost() {
    this.formErrors = {};
    const textControl = this.postForm.get('text');
    const imageControl = this.postForm.get('image');

    const rawText = (textControl?.value || '') as string;
    const text = rawText.trim();
    const image: File | null = (imageControl?.value as File | null) ?? null;

    if (!text && !image) {
      const msg = 'Texte ou image requis.';
      this.formErrors['text'] = msg;
      this.formErrors['image'] = msg;
      return;
    }

    if (text && text.length > 1000) {
      this.formErrors['text'] = 'Max 1000 caractères.';
      return;
    }

    const formData = new FormData();
    if (text) formData.append('text', text);
    if (image) formData.append('image', image);

    this.http.post<Post>(`${environment.apiUrl}/publications/addPost`, formData, { withCredentials: true }).subscribe({
      next: (createdPost) => {
        this.postForm.reset({ text: '', image: null });
        this.imagePreview = null;
        this.addNewPostToList(createdPost);
      },
      error: (err) => {
        console.error('Erreur publication', err);
        this.formErrors['text'] = 'Impossible de publier pour le moment.';
      },
    });
  }



  /**
   * Likes
   * @param event 
   * @param post 
   */
  toggleLike(event: Event, post: Post) {
    event.stopPropagation();
    const newLikeState = !post.likedByMe;
    post.likedByMe = newLikeState;
    post.nombreLikes += newLikeState ? 1 : -1;

    this.http
      .post(
        `${environment.apiUrl}/publications/likePost/${post.id}`,
        { like: newLikeState },
        { withCredentials: true }
      )
      .subscribe({
        error: () => {
          post.likedByMe = !newLikeState;
          post.nombreLikes += newLikeState ? 1 : -1;
        },
      });
  }

  /**
   * Commentaires
   * @param post 
   * @returns 
   */
  addComment(post: Post) {
    const text = this.newCommentText[post.id]?.trim();
    const image = this.selectedCommentImage[post.id];

    if (!text && !image) return;
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (image) formData.append('image', image);

    this.http
      .post<PostComment>(`${environment.apiUrl}/publications/addComment/${post.id}`, formData, {
        withCredentials: true,
      })
      .subscribe({
            next: (createdComment) => {
              const exists = (post.comments ?? []).some(c => c.id === createdComment.id);
              if (!exists) {
                post.comments = [...(post.comments ?? []), createdComment];
                post.commentsCount = (post.commentsCount ?? 0) + 1;
              }

              this.newCommentText[post.id] = '';
              this.selectedCommentImage[post.id] = null;
              this.commentImagePreview[post.id] = null;
            },
        error: (err) => {
          console.error('Erreur ajout commentaire', err);
        },
      });
  }

  /**
   * Supprimer un commentaire
   * @param post 
   * @param comment 
   */
  deleteComment(post: Post, comment: PostComment) {
    sweetalert2
      .fire({
        title: 'Confirmer',
        text: 'Supprimer ce commentaire ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Non',
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .delete(`${environment.apiUrl}/publications/deleteComment/${comment.id}`, {
              withCredentials: true,
            })
            .subscribe({
              next: (res) => {
                post.comments = post.comments.filter((c) => c.id !== comment.id);
                post.commentsCount = Math.max(0, post.commentsCount - 1);
              },
              error: (err) => console.error(err),
            });
        }
      });
  }

  /**
   * Liker un commentaire
   * @param commentId 
   */
  likeComment(commentId: number) {
    this.http
      .post<{ nombreLikes: number }>(
        `${environment.apiUrl}/publications/likeComment/${commentId}`,
        {},
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.allPosts.forEach((post) => {
            post.comments.forEach((comment) => {
              if (comment.id === commentId) {
                comment.nombreLikes = res.nombreLikes;
              }
            });
          });
        },
        error: (err) => console.error(err),
      });
  }

  toggleComments(post: Post) {
    post.showAllComments = !post.showAllComments;
  }

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

  removeCommentImage(postId: number, input: HTMLInputElement) {
    this.selectedCommentImage[postId] = null;
    this.commentImagePreview[postId] = null;
    input.value = '';
  }

  /**
   * Partager une publication
   * @returns 
   */
  sharePost() {
    if (!this.postToShare) return;
    this.isSharing = true;
    this.http
      .post<Post>(
        `${environment.apiUrl}/publications/sharePublication/${this.postToShare.id}`,
        { commentairePartage: this.shareDescription },
        { withCredentials: true }
      )
      .subscribe({
        next: (sharedPost) => {
          this.postToShare!.shares += 1;
          this.addNewPostToList(sharedPost);

          this.isSharing = false;
          this.closeShareModal();
          this.shareDescription = '';
        },
        error: (err) => {
          console.error('Erreur partage', err);
          this.isSharing = false;
        },
      });
  }

  openShareModal(post: Post) {
    this.postToShare = post;
    this.shareDescription = '';
    this.isShareModalOpen = true;
  }
  closeShareModal() {
    this.isShareModalOpen = false;
    this.postToShare = null;
  }

  /**
   * Afficher les personnes qui ont liker la publication
   * @param post 
   */
  affichePersonneLike(post: Post) {
    this.http
      .get<{ users: CurrentUser[] }>(
        `${environment.apiUrl}/publications/getUsersWhoLikedPost/${post.id}`,
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.likedUsers = res.users;
          this.showLikesModal = true;
        },
      });
  }

  /**
   * Afficher les personnes qui ont commenté sur la publication
   * @param post 
   */
  affichePersonneComments(post: Post) {
    this.http
      .get<{ users: CurrentUser[] }>(
        `${environment.apiUrl}/publications/getUsersWhoCommentedPost/${post.id}`,
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.CommentsUsers = res.users;
          this.showCommentsModal = true;
        },
      });
  }

  /**
   * Afficher les personnes qui ont partagé la publication
   * @param post 
   */
  affichePersonnePartage(post: Post) {
    this.http
      .get<{ users: CurrentUser[] }>(
        `${environment.apiUrl}/publications/getUsersWhoSharedPost/${post.id}`,
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.ShareUsers = res.users;
          this.showUsersShareModal = true;
        },
      });
  }

  /**
   * Gérer le temps pour les publications et commentairez
   * @param date 
   * @returns 
   */
  timeAgo(date: string | Date): string {
    const d = new Date(date);
    const hoursDiff = differenceInHours(new Date(), d);
    if (hoursDiff >= 24) return format(d, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  }

  /**
   * Gérer le upload des images pour les publications
   * @param imagePath 
   * @returns 
   */
  srcImage(imagePath?: string | null): string {
    if (!imagePath) return this.defaultAvatar;
    const api = environment.apiUrl.replace(/\/$/, '');
    return `${api}/media/${encodeURIComponent(imagePath)}`;
  }

  /***
   * Gérer le upload des images pour les commentaires
   */
  srcImageComments(imagePath?: string | null): string {
    if (!imagePath) return '';
    const api = environment.apiUrl.replace(/\/$/, '');
    return `${api}/media/comments/${encodeURIComponent(imagePath)}`;
  }

  /**
   * Ouvrir la photo publiée
   * @param photo 
   */
  openPhoto(photo: string) {
    this.selectedPhoto = photo;
  }

  /**
   * Fermer la photo publiée
   */
  closePhotoModal() {
    this.selectedPhoto = null;
  }
}
