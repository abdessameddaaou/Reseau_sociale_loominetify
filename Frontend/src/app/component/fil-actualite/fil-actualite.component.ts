import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule  } from '@angular/router';
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
/**
 * Interface pour les commentaires
 */
interface PostComment {
  id: number;
  user : {
    id: number;
    nom: string;
    prenom: string;
    photo?: string;
  };
  contenu: string;
  image?: string;
  nombreLikes: number;
  mine: boolean;
  createdAt: string;

}
/**
 * Interface pour les interactions sur les publications
 */
interface PostInteraction {
  id: number;
  userId: number;
  publicationId: number;
}

/**
 * Interface pour les publications
 */
interface Post {
  id: number;
  description: string;
  image?: string;
  user : {
    id: number;
    nom: string;
    prenom: string;
    photo?: string;
  };
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
  interactions : PostInteraction[] | null;
  sharedPublication : Post | null;
  commentairePartage?: string | null;
}

/**
 * Interface pour les amis online
 */
interface OnlineFriend {
  name: string;
  avatar: string;
  status?: string;
  lastActive?: string;
}

/**
 * Interface pour l'utilisateur connecté
 */
export interface CurrentUser {
  nom: string;
  id: number;
  prenom: string;
  isAdmin: boolean;
  photo?: string;
}


@Component({
  selector: 'app-fil-actualite',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, HeaderComponent, PostCreatorComponent, RouterModule ],
  templateUrl: './fil-actualite.component.html',
})
export class FilActualiteComponent implements OnInit {

  /**
   * Variables
   */
  activeTab: 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion' = 'home';
  currentUser: CurrentUser | null = null;
  // isUserLoading = true;
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
  private postsPage = 0;
  private readonly postsLimit = 5; // adapte à ton API
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
  constructor( private fb: FormBuilder, private router: Router, private http: HttpClient, private themeService: ThemeService) {
    this.postForm = this.fb.group({
      text: ['', [Validators.maxLength(1000)]],
      image: [null]
    });
  }

  /**
   * ngOnInit
   */
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadOnlineFriends();
    this.loadInitialPosts();
  }

  /**
   * Navigation
   */
  setActiveTab(tab: typeof this.activeTab) {
    this.activeTab = tab;

    if (tab === 'home') { this.router.navigate(['/fil-actualite']) }
    else if (tab === 'deconnexion') {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
        next: () => {
          this.themeService.applyAuthTheme();
          this.router.navigate(['/auth']);
        },
        error: () => {
          this.themeService.applyAuthTheme();
          this.router.navigate(['/auth']);
        }
      });
    } else if (tab === 'messages') {
      this.router.navigate(['/messages']);
    } else if (tab === 'settings') {
      this.router.navigate(['/settings']);
    }
  }

  /**
   * Charger les informations de l'utilisateur
   */
  private loadCurrentUser() {
    // this.isUserLoading = true;
    this.http.get<{ user: CurrentUser }>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true }).subscribe({
        next: (res) => {
          this.currentUser = res.user;
          // this.isUserLoading = false;
        },
        error: () => {
          // this.isUserLoading = false;
          this.themeService.applyAuthTheme();
          this.router.navigate(['/auth']);
        }
      });
  }

  /**
   * Charger les amis en ligne depuis le backend
   */
  private loadOnlineFriends() {
    this.http.get<OnlineFriend[]>(`${environment.apiUrl}/friends/online`, { withCredentials: true }).subscribe({
        next: (friends) => {
          this.onlineFriends = friends;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des amis en ligne', err);
          this.onlineFriends = [];
        }
      });
  }

  /**
   * clic sur un ami connecté → ouvrir le mini chat
   */
  openChat(friend: OnlineFriend) {
    this.selectedFriend = friend;
    this.activeTab = 'messages';
  }

  /**
   * Chargement initial des publications via backend
   */
  private loadInitialPosts() {
    this.isInitialLoading = true;
    this.postsPage = 0;

    this.http.get<Post[]>(`${environment.apiUrl}/publications/getAllPosts`, {
        params: {
          page: this.postsPage.toString(),
          limit: this.postsLimit.toString()
        },
        withCredentials: true
      }).subscribe({
        next: (posts) => {
          console.log('Posts chargés depuis le backend', posts);
          const postsWithUIState = posts.map(post => ({
        ...post,
        showAllComments: false,
      likedByMe: Array.isArray(post.interactions) ? post.interactions.some(i => i.userId === this.currentUser?.id) : false,
      commentsCount: post.comments.length,
// 👈 INITIALISATION ICI
      }))
          this.allPosts = postsWithUIState;
          this.visiblePosts = postsWithUIState;
          this.hasMore = posts.length === this.postsLimit;
          this.isInitialLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des posts', err);
          this.isInitialLoading = false;
          this.hasMore = false;
          this.allPosts = [];
          this.visiblePosts = [];
        }
      });

  }

  /**
   * Chargement des publications supplémentaires (infinite scroll)
   */
  private loadMorePosts() {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    this.postsPage++;

    this.http.get<Post[]>(`${environment.apiUrl}/publications/getAllPosts`, {
        params: {
          page: this.postsPage.toString(),
          limit: this.postsLimit.toString()
        },
        withCredentials: true
      }).subscribe({
        next: (posts) => {
          this.allPosts = [...this.allPosts, ...posts];
          this.visiblePosts = this.allPosts;
          this.hasMore = posts.length === this.postsLimit;
          this.isLoadingMore = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des posts supplémentaires', err);
          this.isLoadingMore = false;
          this.hasMore = false;
        }
      });
  }

  /**
   * Infinite scroll (sur la fenêtre)
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

  /**
   * Gestion image pour création de publication
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.postForm.patchValue({ image: null });
      this.imagePreview = null;
      return;
    }

    const file = input.files[0];
    this.formErrors['image'] = '';

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.formErrors['image'] =
        'Format non supporté. Formats acceptés : JPG, PNG.';
      this.postForm.patchValue({ image: null });
      this.imagePreview = null;
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.formErrors['image'] = 'Taille trop grande. Maximum 5 Mo.';
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
   * Création de publication → uniquement via backend
   */
  publishPost() {
    this.formErrors = {};

    const textControl = this.postForm.get('text');
    const imageControl = this.postForm.get('image');

    const rawText = (textControl?.value || '') as string;
    const text = rawText.trim();
    const image: File | null = (imageControl?.value as File | null) ?? null;

    if (!text && !image) {
      const msg = 'Vous devez entrer un texte ou ajouter une image.';
      this.formErrors['text'] = msg;
      this.formErrors['image'] = msg;
      return;
    }

    if (text && text.length > 1000) {
      this.formErrors['text'] = 'Le texte ne doit pas dépasser 1 000 caractères.';
      return;
    }

    const formData = new FormData();
    if (text) {
      formData.append('text', text);
    }
    if (image) {
      formData.append('image', image);
    }

    this.http.post<Post>(`${environment.apiUrl}/publications/addPost`, formData, { withCredentials: true }).subscribe({
        next: (createdPost) => {
          console.log('Post publié avec succès', createdPost);
          // On insère le post renvoyé par l’API en haut du feed
          //this.allPosts = [createdPost, ...this.allPosts];
          //this.visiblePosts = [createdPost, ...this.visiblePosts];

          this.postForm.reset({ text: '', image: null });
          this.imagePreview = null;
          this.loadInitialPosts();
        },
        error: (err) => {
          console.error('Erreur lors de la publication du post', err);
          this.formErrors['text'] = 'Impossible de publier pour le moment.';
        }
      });
  }

  /**
   * Like via backend
   */
toggleLike(event: Event, post: Post) {
  event.stopPropagation();

  const newLikeState = !post.likedByMe;

  // Optimistic UI
  post.likedByMe = newLikeState;
  post.nombreLikes += newLikeState ? 1 : -1;

  this.http.post(
    `${environment.apiUrl}/publications/likePost/${post.id}`,
    { like: newLikeState }, // ✅ IMPORTANT
    { withCredentials: true }
  ).subscribe({
    error: () => {
      // rollback si erreur backend
      post.likedByMe = !newLikeState;
      post.nombreLikes += newLikeState ? 1 : -1;
    }
  });
}

  /**
   * Ajouter un commentaire via backend
   */
  addComment(post: Post) {
    const text = this.newCommentText[post.id]?.trim();
    const image = this.selectedCommentImage[post.id];

    if (!text && !image) return;
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (image) formData.append('image', image);
    console.log('FormData pour le commentaire :', formData);
    this.http.post<PostComment>( `${environment.apiUrl}/publications/addComment/${post.id}`, formData, { withCredentials: true }).subscribe({
        next: (createdComment) => {
          console.log('Created Comment:', createdComment);
          this.loadInitialPosts();
          console.log('Commentaire ajouté avec succès', createdComment);
          post.comments.push(createdComment);
          post.commentsCount += 1;
          this.newCommentText[post.id] = '';
          this.selectedCommentImage[post.id] = null;
          this.commentImagePreview[post.id] = null;
        },
        error: (err) => {
          console.error('Erreur lors de l’ajout du commentaire', err);
        }
      });
  }

  /**
   * Supprimer un commentaire via backend
   */
  deleteComment(post: Post, comment: PostComment) {
   // if (!comment.mine) return;
   sweetalert2.fire({
    title: 'Confirmer la suppression',
    text: 'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
         this.http.delete(`${environment.apiUrl}/publications/deleteComment/${comment.id}`,{ withCredentials: true }).subscribe({
        next: (res) => {
          console.log('Commentaire supprimé avec succès', res);
          post.comments = post.comments.filter((c) => c.id !== comment.id);
          post.commentsCount = Math.max(0, post.commentsCount - 1);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du commentaire', err);
        }
      });
    }
  });
  }


  /**
   * Partager un post via backend
   */
  sharePost() {
    if(!this.postToShare) return;
    this.isSharing = true;
    this.http
      .post<Post>(
        `${environment.apiUrl}/publications/sharePublication/${this.postToShare.id}`,
        {commentairePartage: this.shareDescription},
        { withCredentials: true }
      )
      .subscribe({
        next: (sharedPost) => {
          console.log('Post partagé avec succès', sharedPost);
          this.postToShare!.shares += 1;
          this.allPosts = [sharedPost, ...this.allPosts];
          this.visiblePosts = [sharedPost, ...this.visiblePosts];
          this.isSharing = false;
          this.closeShareModal();
          this.shareDescription = '';
          // refresh posts
          this.loadInitialPosts();
        },
        error: (err) => {
          console.error('Erreur lors du partage du post', err);
        }
      });
  }

timeAgo(date: string | Date): string {
  const d = new Date(date);

  const hoursDiff = differenceInHours(new Date(), d);

  if (hoursDiff >= 24) {
    return format(d, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
  }

  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: fr
  });
}


srcImage(imagePath?: string | null): string {
  if (!imagePath) return this.defaultAvatar;

  const api = environment.apiUrl.replace(/\/$/, ''); // enlève le / final si présent
  return `${api}/media/${encodeURIComponent(imagePath)}`;
}
srcImageComments(imagePath?: string | null): string {
  if (!imagePath) return '';
  const api = environment.apiUrl.replace(/\/$/, ''); // enlève le / final si présent
  return `${api}/media/comments/${encodeURIComponent(imagePath)}`;
}
toggleComments(post: Post) {

    post.showAllComments = !post.showAllComments;

 }
onCommentImageSelected(event: Event, postId: number) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  this.selectedCommentImage[postId] = file;

  // Preview
  const reader = new FileReader();
  reader.onload = () => {
    this.commentImagePreview[postId] = reader.result as string;
  };
  reader.readAsDataURL(file);
}
removeCommentImage(postId: number, input: HTMLInputElement) {
  this.selectedCommentImage[postId] = null;
  this.commentImagePreview[postId] = null;

  // 🔥 clé de la solution
  input.value = '';
}

likeComment(commentId: number) {
    this.http.post<{ nombreLikes: number }>(`${environment.apiUrl}/publications/likeComment/${commentId}`, {}, { withCredentials: true }).subscribe({
        next: (res) => {
          console.log('Commentaire liké avec succès', res);
          // Met à jour le nombre de likes du commentaire dans le feed
          this.allPosts.forEach(post => {
            post.comments.forEach(comment => {
              if (comment.id === commentId) {
                comment.nombreLikes = res.nombreLikes;
              }
            });
          });
        },
        error: (err) => {
          console.error('Erreur lors du like du commentaire', err);
        }
      });
}

affichePersonneLike(post: Post) {
  this.http.get<{ users: CurrentUser[] }>(
    `${environment.apiUrl}/publications/getUsersWhoLikedPost/${post.id}`,
    { withCredentials: true }
  ).subscribe({
    next: (res) => {
      this.likedUsers = res.users;
      this.showLikesModal = true;
    },
    error: (err) => {
      console.error('Erreur lors de la récupération des likes', err);
    }
  });
}

affichePersonneComments(post: Post) {
  this.http.get<{ users: CurrentUser[] }>(
    `${environment.apiUrl}/publications/getUsersWhoCommentedPost/${post.id}`,
    { withCredentials: true }
  ).subscribe({
    next: (res) => {
      this.CommentsUsers = res.users;
      this.showCommentsModal = true;
    },
    error: (err) => {
      console.error('Erreur lors de la récupération des commentaires', err);
    }
  });
}

affichePersonnePartage(post: Post) {
  this.http.get<{ users: CurrentUser[] }>(
    `${environment.apiUrl}/publications/getUsersWhoSharedPost/${post.id}`,
    { withCredentials: true }
  ).subscribe({
    next: (res) => {
      console.log('Utilisateurs ayant commenté:', res.users);
      this.ShareUsers = res.users;
      this.showUsersShareModal = true;
    },
    error: (err) => {
      console.error('Erreur lors de la récupération des commentaires', err);
    }
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
}
