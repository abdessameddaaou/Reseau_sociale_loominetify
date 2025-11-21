import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule , Validators, FormsModule  } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HeaderComponent } from '../header/header.component'
import { PostCreatorComponent } from '../post-creator/post-creator.component';


interface PostComment {
  id: number;
  author: string;
  text: string;
  mine: boolean;
}

interface Post {
  id: number;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  timeAgo: string;
  text: string;
  imageUrl?: string;
  likes: number;
  commentsCount: number;
  shares: number;
  likedByMe: boolean;
  comments: PostComment[];
}

@Component({
  selector: 'app-fil-actualite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, HeaderComponent, PostCreatorComponent   ],
  templateUrl: './fil-actualite.component.html'
})
export class FilActualiteComponent {
  // Navigation du header
  activeTab: 'home' | 'notifications' | 'messages' | 'profile' | 'settings' = 'home';

  // Formulaire de création de post
  postForm: FormGroup;
  imagePreview: string | null = null;
  formErrors: { [key: string]: string } = {};

  // fill d'actualite
  allPosts: Post[] = [];
  visiblePosts: Post[] = [];

  isInitialLoading = true;
  isLoadingMore = false;
  hasMore = true;

  // Commentaires
  newCommentText: { [postId: number]: string } = {};

constructor(private fb: FormBuilder) {
  this.postForm = this.fb.group({
    text: ['', [Validators.maxLength(1000)]],
    image: [null]
  });

    // Génération de quelques posts mock
    this.seedPosts();
    this.loadInitialPosts();
  }

  // ----------------- Navigation -----------------
  setActiveTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    // Plus tard tu pourras faire un this.router.navigate(...)
  }

  // ----------------- les posts depuis le backend requette
  seedPosts() {
    this.allPosts = [
      {
        id: 1,
        authorName: 'Sophie Martin', // nom prénom
        authorHandle: '@sophie.martin', // username
        authorAvatar: 'https://i.pravatar.cc/150?img=47', // avatar
        timeAgo: 'Il y a 2 heures', // date de publication
        text: 'Belle journée pour explorer la nature ! 🌿 Les montagnes sont magnifiques cette saison.', // Description
        imageUrl: 'https://images.pexels.com/photos/712876/pexels-photo-712876.jpeg?auto=compress&cs=tinysrgb&w=1200', // Image de publication
        likes: 124, // Like
        commentsCount: 2, // Commentaire
        shares: 12, // publication
        likedByMe: false, // j'ai liké ou non ()
        comments: [
          { id: 1, author: 'Marie', text: 'Magnifique photo 😍', mine: false },
          { id: 2, author: 'Toi', text: 'Ça donne envie de partir en rando !', mine: true }
        ]
      }
    ];
  }

  loadInitialPosts() {
    setTimeout(() => {
      this.visiblePosts = this.allPosts.slice(0, 3);
      this.hasMore = this.visiblePosts.length < this.allPosts.length;
      this.isInitialLoading = false;
    }, 800); // simulation de délai backend
  }

  loadMorePosts() {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;

    setTimeout(() => {
      const currentLength = this.visiblePosts.length;
      const next = this.allPosts.slice(currentLength, currentLength + 3);
      this.visiblePosts = [...this.visiblePosts, ...next];
      this.hasMore = this.visiblePosts.length < this.allPosts.length;
      this.isLoadingMore = false;
    }, 800);
  }

  // Infinite scroll (sur la fenêtre)
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const threshold = 300;
    const position = window.innerHeight + window.scrollY;
    const height = document.body.offsetHeight;
    if (position + threshold >= height) {
      this.loadMorePosts();
    }
  }

  // ----------------- Création de publication -----------------
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.postForm.patchValue({ image: null });
      this.imagePreview = null;
      return;
    }

    const file = input.files[0];
    this.formErrors['image'] = '';

    // Validation format
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.formErrors['image'] = 'Format non supporté. Formats acceptés : JPG, PNG.';
      this.postForm.patchValue({ image: null });
      this.imagePreview = null;
      return;
    }

    // Validation taille (5 Mo)
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

  const newPost: Post = {
    id: Date.now(),
    authorName: 'Toi',
    authorHandle: '@toi',
    authorAvatar: 'https://i.pravatar.cc/150?img=5',
    timeAgo: 'À l’instant',
    text: text || '',                  
    imageUrl: this.imagePreview || undefined, 
    likes: 0,
    commentsCount: 0,
    shares: 0,
    likedByMe: false,
    comments: []
  };

  this.allPosts.unshift(newPost);
  this.visiblePosts.unshift(newPost);

  this.postForm.reset({ text: '', image: null });
  this.imagePreview = null;
}




  // ----------------- Like / Comment / Share -----------------
  toggleLike(post: Post) {
    post.likedByMe = !post.likedByMe;
    post.likes += post.likedByMe ? 1 : -1;
  }

  addComment(post: Post) {
    const text = this.newCommentText[post.id]?.trim();
    if (!text) return;

    const comment: PostComment = {
      id: Date.now(),
      author: 'Toi',
      text,
      mine: true
    };

    post.comments.push(comment);
    post.commentsCount += 1;
    this.newCommentText[post.id] = '';
  }

  deleteComment(post: Post, comment: PostComment) {
    if (!comment.mine) return;
    post.comments = post.comments.filter(c => c.id !== comment.id);
    post.commentsCount = Math.max(0, post.commentsCount - 1);
  }

  sharePost(post: Post) {
    post.shares += 1;

    const sharedPost: Post = {
      ...post,
      id: Date.now(),
      authorName: 'Toi (partage)',
      authorHandle: '@toi',
      authorAvatar: 'https://i.pravatar.cc/150?img=5',
      timeAgo: 'À l’instant',
      likedByMe: false,
      likes: 0,
      comments: [],
      commentsCount: 0,
      shares: 0
    };

    this.allPosts.unshift(sharedPost);
    this.visiblePosts.unshift(sharedPost);
  }
}
