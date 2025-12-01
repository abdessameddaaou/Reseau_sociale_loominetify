import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ThemeService, ThemeMode, AccentId } from '../../service/theme.service';
import { environment } from '../../../environments/environment.dev';

type Tab = 'home' | 'notifications' | 'messages' | 'settings' | 'deconnexion';
type Section = 'profile' | 'security' | 'privacy' | 'notifications' | 'appearance' | 'account';

interface RecentSession {
  device: string;
  location: string;
  time: string;
  current: boolean;
}

interface AccentColor {
  id: AccentId;
  value: string; // dégradé CSS pour l'aperçu
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  // onglet actif du header
  activeTab: Tab = 'settings';

  // section active dans la page
  section: Section = 'profile';

  /* ================= PROFIL ================= */

  profileForm = {
    avatar: '',
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    interests: '',
    relationStatus: '',
    profession: '',
    birthDate: '',
  };
  profileSaved = false;

  get interestChips(): string[] {
    return this.profileForm.interests
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /* ================= SÉCURITÉ ================= */

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

  /* ================= CONFIDENTIALITÉ ================= */

  privacyForm = {
    profileVisibility: 'friends' as 'public' | 'friends' | 'private',
    allowTagging: true,
    messagesFrom: 'friends' as 'everyone' | 'friends' | 'none',
    showOnline: true,
  };
  privacySaved = false;

  /* ================= NOTIFICATIONS ================= */

  notificationsForm = {
    emailLikes: true,
    emailComments: true,
    emailFollowers: true,
    pushMessages: true,
    pushReminders: false,
    pushFavorites: true,
  };
  notificationsSaved = false;

  /* ================= APPARENCE ================= */

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

  /* ================= COMPTE ================= */

  accountForm = {
    language: 'fr' as 'fr' | 'en' | 'es',
  };

  /* ================= CONSTRUCTEUR ================= */

  constructor(
    private router: Router,
    private http: HttpClient,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Préférences actuelles côté front
    const current = this.themeService.current;
    this.appearanceForm.theme = current.theme;
    this.appearanceForm.accent = current.accent;

    // Chargement initial depuis le backend
    this.loadProfile();
    this.loadSecuritySettings();
    this.loadRecentSessions();
    this.loadPrivacy();
    this.loadNotifications();
    this.loadAppearance();
    this.loadAccount();
  }

  /* ================= MÉTHODES GÉNÉRALES ================= */

  setSection(section: Section) {
    this.section = section;
  }

  setActiveTab(tab: Tab) {
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

  /* ================= PROFIL ================= */

  private loadProfile() {
    this.http
      .get<Partial<typeof this.profileForm>>(
        `${environment.apiUrl}/settings/profile`,
        { withCredentials: true }
      )
      .subscribe({
        next: (data) => {
          this.profileForm = {
            ...this.profileForm,
            ...data,
          };
        },
        error: (err) => {
          console.error('Erreur lors du chargement du profil', err);
        },
      });
  }

  saveProfile() {
    this.profileSaved = false;

    this.http
      .put(
        `${environment.apiUrl}/settings/profile`,
        this.profileForm,
        { withCredentials: true }
      )
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
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Prévisualisation immédiate
    const reader = new FileReader();
    reader.onload = () => {
      this.profileForm.avatar = reader.result as string;
    };
    reader.readAsDataURL(file);

    // ➜ si tu veux envoyer l'avatar au backend séparément :
    // const formData = new FormData();
    // formData.append('avatar', file);
    // this.http.post(`${environment.apiUrl}/settings/profile/avatar`, formData, { withCredentials: true }).subscribe(...)
  }

  /* ================= SÉCURITÉ ================= */

  private loadSecuritySettings() {
    this.http
      .get<{ twoFactorEnabled: boolean }>(
        `${environment.apiUrl}/settings/security`,
        { withCredentials: true }
      )
      .subscribe({
        next: (data) => {
          this.securityForm.twoFactorEnabled = data.twoFactorEnabled;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des paramètres de sécurité', err);
        },
      });
  }

  saveSecurity() {
    if (this.passwordsDontMatch) return;

    // 1. changer le mot de passe
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
          // 2. mettre à jour 2FA
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
                // On nettoie les champs mots de passe
                this.securityForm.currentPassword = '';
                this.securityForm.newPassword = '';
                this.securityForm.confirmPassword = '';
              },
              error: (err) => {
                console.error('Erreur lors de la mise à jour de la 2FA', err);
              },
            });
        },
        error: (err) => {
          console.error('Erreur lors de la modification du mot de passe', err);
        },
      });
  }

  private loadRecentSessions() {
    this.http
      .get<RecentSession[]>(
        `${environment.apiUrl}/settings/sessions`,
        { withCredentials: true }
      )
      .subscribe({
        next: (sessions) => {
          this.recentSessions = sessions || [];
        },
        error: (err) => {
          console.error('Erreur lors du chargement des sessions récentes', err);
          this.recentSessions = [];
        },
      });
  }

  logoutAllDevices() {
    this.http
      .post(
        `${environment.apiUrl}/auth/logout-all`,
        {},
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          // Tu peux aussi recharger les sessions depuis le backend
          this.loadRecentSessions();
        },
        error: (err) => {
          console.error('Erreur lors de la déconnexion de tous les appareils', err);
        },
      });
  }

  /* ================= CONFIDENTIALITÉ ================= */

  private loadPrivacy() {
    this.http
      .get<Partial<typeof this.privacyForm>>(
        `${environment.apiUrl}/settings/privacy`,
        { withCredentials: true }
      )
      .subscribe({
        next: (data) => {
          this.privacyForm = {
            ...this.privacyForm,
            ...data,
          };
        },
        error: (err) => {
          console.error('Erreur lors du chargement des paramètres de confidentialité', err);
        },
      });
  }

  savePrivacy() {
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
          console.error('Erreur lors de la sauvegarde de la confidentialité', err);
        },
      });
  }

  /* ================= NOTIFICATIONS ================= */

  private loadNotifications() {
    this.http
      .get<Partial<typeof this.notificationsForm>>(
        `${environment.apiUrl}/settings/notifications`,
        { withCredentials: true }
      )
      .subscribe({
        next: (data) => {
          this.notificationsForm = {
            ...this.notificationsForm,
            ...data,
          };
        },
        error: (err) => {
          console.error('Erreur lors du chargement des notifications', err);
        },
      });
  }

  saveNotifications() {
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
          console.error('Erreur lors de la sauvegarde des notifications', err);
        },
      });
  }

  /* ================= APPARENCE ================= */

  private loadAppearance() {
    this.http
      .get<Partial<typeof this.appearanceForm>>(
        `${environment.apiUrl}/settings/appearance`,
        { withCredentials: true }
      )
      .subscribe({
        next: (data) => {
          this.appearanceForm = {
            ...this.appearanceForm,
            ...data,
          };

          // applique aussi côté front
          this.themeService.setTheme(this.appearanceForm.theme);
          this.themeService.setAccent(this.appearanceForm.accent);
        },
        error: (err) => {
          console.error('Erreur lors du chargement de l’apparence', err);
        },
      });
  }

  saveAppearance() {
    // applique le thème globalement + sauvegarde dans le service
    this.themeService.setTheme(this.appearanceForm.theme);
    this.themeService.setAccent(this.appearanceForm.accent);

    this.appearanceSaved = false;

    this.http
      .put(
        `${environment.apiUrl}/settings/appearance`,
        this.appearanceForm,
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.appearanceSaved = true;
          setTimeout(() => (this.appearanceSaved = false), 2000);
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde de l’apparence', err);
        },
      });
  }

  /* ================= COMPTE ================= */

  private loadAccount() {
    this.http
      .get<Partial<typeof this.accountForm>>(
        `${environment.apiUrl}/settings/account`,
        { withCredentials: true }
      )
      .subscribe({
        next: (data) => {
          this.accountForm = {
            ...this.accountForm,
            ...data,
          };
        },
        error: (err) => {
          console.error('Erreur lors du chargement des paramètres de compte', err);
        },
      });
  }

  downloadData() {
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
          console.error('Erreur lors du téléchargement des données', err);
        },
      });
  }

  requestAccountDeletion() {
    this.http
      .post(
        `${environment.apiUrl}/account/delete-request`,
        {},
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          // Ici tu peux ouvrir un toast / message de confirmation
        },
        error: (err) => {
          console.error('Erreur lors de la demande de suppression du compte', err);
        },
      });
  }
}
