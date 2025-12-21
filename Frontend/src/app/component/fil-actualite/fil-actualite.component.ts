import { Component, HostListener, OnInit, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule  } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HeaderComponent } from '../header/header.component';
import { PostCreatorComponent } from '../post-creator/post-creator.component';
import { environment } from '../../../environments/environment.dev';
import { ThemeService } from '../../service/theme.service';
import { RealtimeService } from '../../service/realtime.service';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  mine: boolean;
  createdAt: string;

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
export class FilActualiteComponent implements OnInit, OnDestroy {

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
  selectedPhoto: string | null = null;

  constructor( private fb: FormBuilder, private router: Router, private http: HttpClient, private themeService: ThemeService, private realtime: RealtimeService) {
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

    this.realtime.connect();
    this.realtime.on<any>('post:created', (Post) => {
    if (this.allPosts.some(p => p.id === Post.id)) return;

    const mapped = this.mapSocketPost(Post);

    this.allPosts = [mapped, ...this.allPosts];
    this.visiblePosts = [mapped, ...this.visiblePosts];
  });
  }

  ngOnDestroy(): void {
  this.realtime.off('post:created');
}

private mapSocketPost(resPost: any): Post {
  const comments = Array.isArray(resPost.comments) ? resPost.comments : [];
  const createdAt = resPost.createdAt ?? new Date().toISOString();

  return {
    id: resPost.id,
    description: resPost.description ?? '',
    image: resPost.image ?? undefined,

    user: {
      id: resPost.user.id,
      nom: resPost.user.nom,
      prenom: resPost.user.prenom,
      photo: resPost.user.photo ?? this.defaultAvatar,
    },

    nombreLikes: resPost.nombreLikes ?? 0,
    nombrePartages: resPost.nombrePartages ?? 0,
    createdAt,

    authorAvatar: resPost.user.photo ?? this.defaultAvatar,
    timeAgo: this.timeAgo(createdAt),
    text: resPost.description ?? '',
    likes: resPost.likes ?? resPost.nombreLikes ?? 0,
    commentsCount: resPost.commentsCount ?? comments.length,
    shares: resPost.shares ?? resPost.nombrePartages ?? 0,
    likedByMe: resPost.likedByMe ?? false,
    comments,
    showAllComments: false,
  };
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
    this.http.get<{ user: CurrentUser }>(`${environment.apiUrl}/users/getUserconnected`, { withCredentials: true }).subscribe({
        next: (res) => {
          this.currentUser = res.user;
        },
        error: () => {
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
        showAllComments: false
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      this.formErrors['image'] =
        'Format non supporté. Formats acceptés : JPG, PNG, HEIC';
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
  toggleLike(event: MouseEvent, postId: number) {
    const btn = event.currentTarget as HTMLButtonElement;
    const styles = window.getComputedStyle(btn);
    const color = styles.color;
    console.log('Styles du bouton :', color);

    const valueLike = true
    this.http.post<Post>(`${environment.apiUrl}/posts/${postId}/like`, { like: valueLike }, { withCredentials: true }).subscribe({
        next: (updatedPost) => {
        },
        error: (err) => {
          console.error('Erreur lors du like', err);
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
    if (!comment.mine) return;

    this.http.delete(`${environment.apiUrl}/posts/${post.id}/comments/${comment.id}`,{ withCredentials: true }).subscribe({
        next: () => {
          post.comments = post.comments.filter((c) => c.id !== comment.id);
          post.commentsCount = Math.max(0, post.commentsCount - 1);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du commentaire', err);
        }
      });
  }

  /**
   * Partager un post via backend
   */
  sharePost(post: Post) {
    this.http
      .post<Post>(
        `${environment.apiUrl}/posts/${post.id}/share`,
        {},
        { withCredentials: true }
      )
      .subscribe({
        next: (sharedPost) => {
          post.shares += 1;
          this.allPosts = [sharedPost, ...this.allPosts];
          this.visiblePosts = [sharedPost, ...this.visiblePosts];
        },
        error: (err) => {
          console.error('Erreur lors du partage du post', err);
        }
      });
  }

  timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  }


srcImage(imagePath?: string | null): string {
  if (!imagePath) return this.defaultAvatar;

  const api = environment.apiUrl.replace(/\/$/, '');
  return `${api}/media/${encodeURIComponent(imagePath)}`;
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
  input.value = '';
}

  openPhoto(photo: string) {
    this.selectedPhoto = photo;
  }

  closePhotoModal() {
    this.selectedPhoto = null;
  }
}
