import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { ThemeService, ThemeMode, AccentId } from '../../service/theme.service';
import { environment } from '../../../environments/environment.dev';

/* =========================================================
 *                      TYPES & INTERFACES
 * ========================================================= */

type Tab = 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion';

type Section =
  | 'profile'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'appearance'
  | 'account';

interface RecentSession {
  device: string;
  location: string;
  time: string;
  current: boolean;
}

interface AccentColor {
  id: AccentId;
  value: string;
}

/**
 * Profil tel que renvoyé par le backend pour l'utilisateur connecté.
 */
interface UserProfile {
  nom?: string;
  prenom?: string;
  telephone: string;
  dateNaissance: string;
  ville?: string;
  pays: string;
  photo?: string;
  bio?: string;
  siteweb?: string;
  profession?: string;
  relationStatus?: string | null;
  hashtags?: string[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  /* =========================================================
   *                 NAVIGATION / LAYOUT
   * ========================================================= */

  activeTab: Tab = 'settings';
  section: Section = 'profile';

  /* =========================================================
   *                        PROFIL
   * ========================================================= */

  userForm!: FormGroup;
  profileSaved = false;

  /* =========================================================
   *                        SÉCURITÉ
   * ========================================================= */

  securityForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  };

  securitySaved = false;
  recentSessions: RecentSession[] = [];

  get passwordsDontMatch(): boolean {
    const f = this.securityForm;
    return !!f.newPassword && f.newPassword !== f.confirmPassword;
  }

  /* =========================================================
   *                     CONFIDENTIALITÉ
   * ========================================================= */

  privacyForm = {
    profileVisibility: 'friends' as 'public' | 'friends' | 'private',
    allowTagging: true,
    messagesFrom: 'friends' as 'everyone' | 'friends' | 'none',
    showOnline: true,
  };
  privacySaved = false;

  /* =========================================================
   *                     NOTIFICATIONS
   * ========================================================= */

  notificationsForm = {
    emailLikes: true,
    emailComments: true,
    emailFollowers: true,
    pushMessages: true,
    pushReminders: false,
    pushFavorites: true,
  };
  notificationsSaved = false;

  /* =========================================================
   *                      APPARENCE (100% FRONT)
   * ========================================================= */

  appearanceForm = {
    theme: 'light' as ThemeMode,
    accent: 'indigo' as AccentId,
  };
  appearanceSaved = false;

  accentColors: AccentColor[] = [
    { id: 'indigo', value: 'linear-gradient(to right,#5b7cff,#8b5cf6)' },
    { id: 'emerald', value: 'linear-gradient(to right,#10b981,#059669)' },
    { id: 'rose', value: 'linear-gradient(to right,#fb7185,#f97316)' },
    { id: 'sky', value: 'linear-gradient(to right,#0ea5e9,#38bdf8)' },
  ];

  get selectedAccent(): AccentColor | undefined {
    return this.accentColors.find((c) => c.id === this.appearanceForm.accent);
  }

  /* =========================================================
   *                        COMPTE
   * ========================================================= */

  accountForm = {
    language: 'fr' as 'fr' | 'en' | 'es',
  };

  /* =========================================================
   *                   CONSTRUCTEUR / INIT
   * ========================================================= */

  constructor(
    private router: Router,
    private http: HttpClient,
    private themeService: ThemeService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildUserForm();
    this.loadProfile();
    this.loadAppearanceFromTheme();
  }

  /* =========================================================
   *              FORMULAIRE PROFIL (RÉACTIF)
   * ========================================================= */

  private buildUserForm(): void {
    this.userForm = this.fb.group({
      nom: [''],
      prenom: [''],
      telephone: [''],
      dateNaissance: [''],
      ville: [''],
      pays: [''],
      photo: [''],
      bio: [''],
      siteweb: [''],
      profession: [''],
      relationStatus: [null],
      hashtags: [[]]
    });
  }

/**
 * Méthode pour ajouter un hashtag individuellement
 * @param input 
 * @returns 
 */
addHashtag(input: HTMLInputElement): void {
  const value = input.value.trim().replace(/\s/g, '');
  if (!value) return;

  const formatted = value.startsWith('#') ? value : '#' + value;
  const currentTags = this.userForm.get('hashtags')?.value || [];

  if (!currentTags.includes(formatted)) {
    this.userForm.patchValue({ hashtags: [...currentTags, formatted] });
  }
  
  input.value = '';
}

/**
 * Méthode pour supprimer un hashtag
 * @param tag 
 */
removeHashtag(tag: string): void {
  const currentTags = this.userForm.get('hashtags')?.value || [];
  this.userForm.patchValue({ 
    hashtags: currentTags.filter((t: string) => t !== tag) 
  });
}

/**
 * 
 */
relationStatusOptions = [
  { value: 'CELIBATAIRE', label: 'Célibataire' },
  { value: 'EN_COUPLE', label: 'En couple' },
  { value: 'MARIE', label: 'Marié(e)' },
  { value: 'FIANCE', label: 'Fiancé(e)' },
  { value: 'COMPLIQUE', label: "C'est compliqué" },
  { value: 'DIVORCE', label: 'Divorcé(e)' },
  { value: 'VEUF', label: 'Veuf(ve)' },
];

/**
 * Méthode pour charger les information de l'utilisateur connecté
 */
  loadProfile(): void {
    this.http.get<{ user: UserProfile }>(`${environment.apiUrl}/users/getUserconnected`,{ withCredentials: true }).subscribe({
        next: (res) => {
          const u = res.user;
          this.userForm.patchValue({
            nom: u.nom,
            prenom: u.prenom,
            telephone: u.telephone ?? '',
            dateNaissance: u.dateNaissance ? u.dateNaissance.substring(0, 10) : '',
            ville: u.ville ?? '',
            pays: u.pays,
            photo: u.photo ?? '',
            bio: u.bio ?? '',
            siteweb: u.siteweb ?? '',
            profession: u.profession ?? '',
            hashtags: res.user.hashtags || [],
            relationStatus: u.relationStatus ?? null, 
          });
        },
        error: () => {
          this.themeService.applyAuthTheme();
          this.router.navigate(['/auth']);
        },
      });
  }

  /**
   * Appellée pour enregistré les informations de l'utilisateur
   */
  saveProfile(): void {
    const raw = this.userForm.value as Partial<UserProfile>;

    const payload: UserProfile = {
      nom: raw.nom ?? '',
      prenom: raw.prenom ?? '',
      telephone: raw.telephone ?? '',
      dateNaissance: raw.dateNaissance ?? '',
      ville: raw.ville ?? '',
      pays: raw.pays ?? '',
      photo: raw.photo ?? '',
      bio: raw.bio ?? '',
      siteweb: raw.siteweb ?? '',
      profession: raw.profession ?? '',
      hashtags: raw.hashtags ?? [],
      relationStatus: raw.relationStatus ?? null
    };

    this.http
      .put(`${environment.apiUrl}/users/updateUser`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this.profileSaved = true;
          setTimeout(() => (this.profileSaved = false), 2000);
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde du profil', err);
        },
      });
  }

onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Optionnel : check taille
  if (file.size > 5 * 1024 * 1024) {
    console.error('Fichier trop lourd (> 5 Mo)');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result as string;
    this.userForm.patchValue({ photo: base64 });
  };
  reader.readAsDataURL(file);
}

  /* =========================================================
   *                 MÉTHODES GÉNÉRALES / NAV
   * ========================================================= */

  setSection(section: Section): void {
    this.section = section;
  }

  setActiveTab(tab: Tab): void {
    this.activeTab = tab;

    if (tab === 'home') {
      this.router.navigate(['/fil-actualite']);
    } else if (tab === 'messages') {
      this.router.navigate(['/messages']);
    } else if (tab === 'settings') {
      this.router.navigate(['/settings']);
    } else if (tab === 'deconnexion') {
      this.http
        .post(
          `${environment.apiUrl}/auth/logout`,
          {},
          { withCredentials: true }
        )
        .subscribe({
          next: () => {
            this.themeService.applyAuthTheme();
            this.router.navigate(['/auth']);
          },
          error: () => {
            this.themeService.applyAuthTheme();
            this.router.navigate(['/auth']);
          },
        });
    }
  }

  /* =========================================================
   *                           SÉCURITÉ
   * ========================================================= */

  private loadSecuritySettings(): void {
    // à implémenter quand l'API sera prête
  }

  saveSecurity(): void {
    if (this.passwordsDontMatch) return;

    const payload: { currentPassword: string; newPassword: string } = {
      currentPassword: this.securityForm.currentPassword,
      newPassword: this.securityForm.newPassword,
    };

    this.securitySaved = false;

    this.http
      .post(
        `${environment.apiUrl}/settings/security/change-password`,
        payload,
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.http
            .post(
              `${environment.apiUrl}/settings/security/two-factor`,
              { enabled: this.securityForm.twoFactorEnabled },
              { withCredentials: true }
            )
            .subscribe({
              next: () => {
                this.securitySaved = true;
                setTimeout(() => (this.securitySaved = false), 2000);
                this.securityForm.currentPassword = '';
                this.securityForm.newPassword = '';
                this.securityForm.confirmPassword = '';
              },
              error: (err) => {
                console.error(
                  'Erreur lors de la mise à jour de la 2FA',
                  err
                );
              },
            });
        },
        error: (err) => {
          console.error(
            'Erreur lors de la modification du mot de passe',
            err
          );
        },
      });
  }

  private loadRecentSessions(): void {
    // à implémenter quand l'API sera prête
  }

  logoutAllDevices(): void {
    // à implémenter quand l'API sera prête
  }

  /* =========================================================
   *                        CONFIDENTIALITÉ
   * ========================================================= */

  private loadPrivacy(): void {
    // à implémenter quand l'API sera prête
  }

  savePrivacy(): void {
    this.privacySaved = false;

    this.http
      .put(
        `${environment.apiUrl}/settings/privacy`,
        this.privacyForm,
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.privacySaved = true;
          setTimeout(() => (this.privacySaved = false), 2000);
        },
        error: (err) => {
          console.error(
            'Erreur lors de la sauvegarde de la confidentialité',
            err
          );
        },
      });
  }

  /* =========================================================
   *                        NOTIFICATIONS
   * ========================================================= */

  private loadNotifications(): void {
    // à implémenter quand l'API sera prête
  }

  saveNotifications(): void {
    this.notificationsSaved = false;

    this.http
      .put(
        `${environment.apiUrl}/settings/notifications`,
        this.notificationsForm,
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.notificationsSaved = true;
          setTimeout(() => (this.notificationsSaved = false), 2000);
        },
        error: (err) => {
          console.error(
            'Erreur lors de la sauvegarde des notifications',
            err
          );
        },
      });
  }

  /* =========================================================
   *                         APPARENCE
   *              (uniquement ThemeService côté front)
   * ========================================================= */

  /** Récupère le thème courant stocké par ThemeService (localStorage, etc.). */
  private loadAppearanceFromTheme(): void {
    const current = this.themeService.current;
    this.appearanceForm.theme = current.theme;
    this.appearanceForm.accent = current.accent;
  }

  /** Applique le thème + accent et affiche juste un indicateur visuel. */
  saveAppearance(): void {
    this.themeService.setTheme(this.appearanceForm.theme);
    this.themeService.setAccent(this.appearanceForm.accent);

    this.appearanceSaved = true;
    setTimeout(() => (this.appearanceSaved = false), 2000);
  }

  /* =========================================================
   *                           COMPTE
   * ========================================================= */

  private loadAccount(): void {
    // à implémenter quand l'API sera prête
  }

  downloadData(): void {
    this.http
      .get(`${environment.apiUrl}/account/export`, {
        withCredentials: true,
        responseType: 'blob' as 'json',
      })
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'loominefty-data.zip';
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error(
            'Erreur lors du téléchargement des données',
            err
          );
        },
      });
  }

  requestAccountDeletion(): void {
    this.http
      .post(
        `${environment.apiUrl}/account/delete-request`,
        {},
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          // TODO: afficher un toast / message de confirmation si tu veux
        },
        error: (err) => {
          console.error(
            'Erreur lors de la demande de suppression du compte',
            err
          );
        },
      });
  }
}
