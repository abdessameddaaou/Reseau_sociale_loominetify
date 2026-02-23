import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import Swal from 'sweetalert2';
import { ThemeService } from '../../service/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule, TranslateModule],
  templateUrl: './auth-user.component.html'
})
export class AuthUserComponent implements OnInit {

  /**
   * Variables 
   */
  countries: any[] = [];
  pageRedirection: 'login' | 'signup' = 'login';
  signupStep = 1;
  loginForm: FormGroup;
  signupForm: FormGroup;
  dropdownOpen = false;
  selectedCountry: any = null;
  phoneCodeDropdownOpen = false;
  selectedPhoneCountry: any = null;
  signupErrors: { [key: string]: string } = {};
  loginError = '';
  signupError = '';

  /**
   * Constructeur
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private themeService: ThemeService,
    public translate: TranslateService
  ) {
    this.loginForm = this.buildLoginForm();
    this.signupForm = this.buildSignupForm();
  }

  get currentLang(): string {
    return this.translate.currentLang || this.translate.getDefaultLang() || 'fr';
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }

  /**
   * Getters pour le template
   */

  get LoginForm(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  get SignUpForm(): { [key: string]: AbstractControl } {
    return this.signupForm.controls;
  }

  /**
   * 
   * @returns Initialisation des formulaires
   */
  private buildLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  private buildSignupForm(): FormGroup {
    return this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      telephone: [''],
      dateNaissance: ['', Validators.required],
      pays: [''],
      ville: [''],
      question: ['', Validators.required],
      reponse: ['', Validators.required],
    });
  }

  /**
   * ngOnInit()
   */

  ngOnInit() {
    this.http.get<any[]>('https://restcountries.com/v3.1/all?fields=name,flags,cca2,translations,idd').subscribe((data) => {
      this.countries = data
        .map((c) => ({
          name: c.translations?.fra?.common || c.name.common,
          code: c.cca2,
          flag: c.flags.png,
          dialCode: c.idd?.root ? c.idd.root + (c.idd.suffixes?.[0] || '') : ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Mettre la France par défaut si possible
      this.selectedPhoneCountry = this.countries.find(c => c.code === 'FR') || null;
    });

    this.themeService.applyAuthTheme();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  /**
   * Fonction Choisir un pays 
   * @param country 
   */
  selectCountry(country: any) {
    this.selectedCountry = country;
    this.signupForm.get('pays')?.setValue(country.name);
    this.dropdownOpen = false;
  }

  togglePhoneCodeDropdown() {
    this.phoneCodeDropdownOpen = !this.phoneCodeDropdownOpen;
  }

  selectPhoneCountry(country: any) {
    this.selectedPhoneCountry = country;
    this.phoneCodeDropdownOpen = false;
  }


  /**
   * Gestion du mode login / signup ( pour la redirection )
   * @param modeChoisis 
   */
  setMode(modeChoisis: 'login' | 'signup'): void {
    this.pageRedirection = modeChoisis;
    this.clearGlobalErrors();

    if (modeChoisis === 'signup') {
      this.signupStep = 1;
      this.clearSignupFieldErrors();
    }
  }

  /**
   * Connexion
   * @returns 
   */
  onLogin(): void {
    this.clearGlobalErrors();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.http
      .post(`${environment.apiUrl}/auth/login`, this.loginForm.value, { withCredentials: true })
      .subscribe({
        next: () => {
          // l’utilisateur est connecté → on remet son thème perso
          this.themeService.reapplyUserTheme();

          this.router.navigate(['/fil-actualite']);
        },
        error: (err: any) => {
          this.loginError = this.extractErrorMessage(
            err,
            'Impossible de se connecter au serveur.'
          );
        },
      });
  }


  /**
   * Inscription – Navigation entre les étapes
   * Step 1 => Inscription
   */
  goFromStep1(): void {
    this.clearGlobalErrors();
    this.clearSignupFieldErrors(['nom', 'prenom', 'email']);
    const nom = this.signupForm.get('nom')?.value?.trim();
    const prenom = this.signupForm.get('prenom')?.value?.trim();
    const email = this.signupForm.get('email')?.value?.trim();

    let isValid = true;

    if (!nom) {
      this.signupErrors['nom'] = 'Le champ "Nom" est obligatoire.';
      isValid = false;
    }
    if (!prenom) {
      this.signupErrors['prenom'] = 'Le champ "Prénom" est obligatoire.';
      isValid = false;
    }

    if (!email) {
      this.signupErrors['email'] = 'Le champ "Adresse email" est obligatoire.';
      isValid = false;
    } else if (this.SignUpForm['email']?.invalid) {
      this.signupErrors['email'] = 'Veuillez entrer une adresse email valide.';
      isValid = false;
    }

    if (isValid) {
      this.signupStep = 2;
    }
  }

  /**
   * Step 2 => Inscription
   */
  goFromStep2(): void {
    this.clearGlobalErrors();
    this.clearSignupFieldErrors(['password']);

    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;

    let isValid = true;

    if (!password) {
      this.signupErrors['password'] = 'Le champ "Mot de passe" est obligatoire.';
      isValid = false;
    } else if (!this.validatePassword(password)) {
      this.signupErrors['password'] =
        'Le mot de passe ne respecte pas les critères de sécurité (8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial).';
      isValid = false;
    } else if (password !== confirmPassword) {
      this.signupErrors['confirmPassword'] = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    if (isValid) {
      this.signupStep = 3;
    }
  }

  /**
   * Step 3 => Inscription
   */
  goFromStep3(): void {
    this.clearGlobalErrors();
    this.clearSignupFieldErrors(['dateNaissance']);

    const dateNaissance = this.signupForm.get('dateNaissance')?.value;
    const pays = this.signupForm.get('pays')?.value;
    let isValid = true;

    if (!dateNaissance) {
      this.signupErrors['dateNaissance'] = 'Le champ "Date de naissance" est obligatoire';
      isValid = false;
    } else {
      const birth = new Date(dateNaissance);
      if (isNaN(birth.getTime())) {
        this.signupErrors['dateNaissance'] = 'La date de naissance est invalide';
        isValid = false;
      } else {
        const today = new Date();
        if (birth > today) {
          this.signupErrors['dateNaissance'] = 'La date de naissance ne peut pas être dans le futur';
          isValid = false;
        } else {
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          if (age < 18) {
            this.signupErrors['dateNaissance'] =
              'Vous devez avoir au moins 18 ans pour vous inscrire';
            isValid = false;
          }
        }
      }
    }

    if (isValid) {
      this.signupStep = 4;
    }
  }

  /**
   * Inscription
   * @returns 
   */
  onSignup(): void {
    this.clearGlobalErrors();

    if (this.signupStep !== 4) return;

    this.clearSignupFieldErrors(['question', 'reponse']);

    const questionSecrete = this.SignUpForm['question']?.value;
    const reponseQuestion = this.SignUpForm['reponse']?.value?.trim();

    let isValid = true;

    if (!questionSecrete) {
      this.signupErrors['question'] = 'Le champ "Question secrète" est obligatoire.';
      isValid = false;
    }
    if (!reponseQuestion) {
      this.signupErrors['reponse'] = 'Le champ "Réponse secrète" est obligatoire.';
      isValid = false;
    }

    if (!isValid) return;

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();

      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Certains champs dans les étapes précédentes sont invalides.',
        timer: 1500,
        showConfirmButton: false,
      });

      return;
    }

    const payload = { ...this.signupForm.value };
    if (payload.telephone && payload.telephone.trim() !== '') {
      payload.telephone = `${this.selectedPhoneCountry?.dialCode || ''} ${payload.telephone.trim()}`;
    } else {
      payload.telephone = null;
    }

    this.http.post(`${environment.apiUrl}/users/newUser`, payload, { withCredentials: true }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Inscription réussie',
          text: 'Vous pouvez maintenant vous connecter.',
          timer: 1500,
          showConfirmButton: false,
        });

        this.setMode('login');
      },
      error: (err: HttpErrorResponse) => {
        this.signupError = this.extractErrorMessage(
          err,
          'Une erreur est survenue lors de la création du compte.'
        );
      },
    });
  }


  /**
   * Valide les critères du mot de passe :
   * - Min. 8 caractères
   * - Min. 1 majuscule
   * - Min. 1 chiffre
   * - Min. 1 caractère spécial
   */
  private validatePassword(password: string): boolean {
    const minLength = password?.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasUpper && hasNumber && hasSpecial;
  }

  /**
   * Extrait un message d'erreur depuis la réponse backend.
   */

  private extractErrorMessage(err: any, defaultMessage: string): string {
    if (!err || typeof err.status === 'number' && err.status === 0) {
      return 'Impossible de contacter le serveur. Veuillez réessayer plus tard.';
    }

    const backend = err.error ?? err;

    if (backend && typeof backend === 'object') {

      if (typeof backend.error === 'string' && backend.error.trim()) {
        return backend.error;
      }
    }
    return defaultMessage;
  }


  private clearGlobalErrors(): void {
    this.loginError = '';
    this.signupError = '';
  }

  /**
   * Efface toutes les erreurs de signup ou seulement certains champs.
   */
  private clearSignupFieldErrors(fields?: string[]): void {
    if (!fields) {
      this.signupErrors = {};
      return;
    }

    fields.forEach((field) => delete this.signupErrors[field]);
  }
}
