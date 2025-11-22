import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-user.component.html',
})
export class AuthUserComponent {
  pageRedirection: 'login' | 'signup' = 'login';
  signupStep = 1;

  loginForm: FormGroup;
  signupForm: FormGroup;

  /**
   * Erreurs
   */
  signupErrors: Record<string, string> = {};
  loginError = '';
  signupError = '';

  /**
   * URL API backend
   */
  private apiUrl = 'http://localhost:3500/api';

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.loginForm = this.buildLoginForm();
    this.signupForm = this.buildSignupForm();
  }

  // ---------------------------------------------------------------------------
  // Getters pour le template
  // ---------------------------------------------------------------------------

  get LoginForm(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  get SignUpForm(): { [key: string]: AbstractControl } {
    return this.signupForm.controls;
  }

  // ---------------------------------------------------------------------------
  // Initialisation des formulaires
  // ---------------------------------------------------------------------------

  private buildLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  private buildSignupForm(): FormGroup {
    return this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: [''],
      birthdate: ['', Validators.required],
      city: [''],
      secretQuestion: ['', Validators.required],
      secretAnswer: ['', Validators.required],
    });
  }

  // ---------------------------------------------------------------------------
  // Gestion du mode login / signup ( pour la redirection )
  // ---------------------------------------------------------------------------

  setMode(modeChoisis: 'login' | 'signup'): void {
    this.pageRedirection = modeChoisis;
    this.clearGlobalErrors();

    if (modeChoisis === 'signup') {
      this.signupStep = 1;
      this.clearSignupFieldErrors();
    }
  }

  // ---------------------------------------------------------------------------
  // Connexion
  // ---------------------------------------------------------------------------

  onLogin(): void {
    this.clearGlobalErrors();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.http
      .post(`${this.apiUrl}/auth/login`, this.loginForm.value, { withCredentials: true })
      .subscribe({
        next: () => {
          this.router.navigate(['/fil-actualite']);
        },
        error: (err: HttpErrorResponse) => {
          this.loginError = this.extractErrorMessage(err, 'Impossible de se connecter au serveur.');
        },
      });
  }

  // ---------------------------------------------------------------------------
  // Inscription – Navigation entre les étapes
  // ---------------------------------------------------------------------------

  goFromStep1(): void {
    this.clearGlobalErrors();
    this.clearSignupFieldErrors(['fullName', 'email']);

    const fullName = this.SignUpForm['fullName']?.value?.trim();
    const email = this.SignUpForm['email']?.value?.trim();

    let isValid = true;

    if (!fullName) {
      this.signupErrors['fullName'] = 'Le champ "Nom complet" est obligatoire.';
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

  goFromStep2(): void {
    this.clearGlobalErrors();
    this.clearSignupFieldErrors(['password']);

    const password = this.SignUpForm['password']?.value;
    let isValid = true;

    if (!password) {
      this.signupErrors['password'] = 'Le champ "Mot de passe" est obligatoire.';
      isValid = false;
    } else if (!this.validatePassword(password)) {
      this.signupErrors['password'] =
        'Le mot de passe ne respecte pas les critères de sécurité (8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial).';
      isValid = false;
    }

    if (isValid) {
      this.signupStep = 3;
    }
  }

  goFromStep3(): void {
    this.clearGlobalErrors();
    this.clearSignupFieldErrors(['birthdate']);

    const birthdate = this.SignUpForm['birthdate']?.value;
    let isValid = true;

    if (!birthdate) {
      this.signupErrors['birthdate'] = 'Le champ "Date de naissance" est obligatoire.';
      isValid = false;
    }

    if (isValid) {
      this.signupStep = 4;
    }
  }

  // ---------------------------------------------------------------------------
  // Inscription
  // ---------------------------------------------------------------------------

  onSignup(): void {
    this.clearGlobalErrors();

    if (this.signupStep !== 4) return;

    this.clearSignupFieldErrors(['secretQuestion', 'secretAnswer']);

    const questionSecrete = this.SignUpForm['secretQuestion']?.value;
    const reponseQuestion = this.SignUpForm['secretAnswer']?.value?.trim();

    let isValid = true;

    if (!questionSecrete) {
      this.signupErrors['secretQuestion'] = 'Le champ "Question secrète" est obligatoire.';
      isValid = false;
    }
    if (!reponseQuestion) {
      this.signupErrors['secretAnswer'] = 'Le champ "Réponse secrète" est obligatoire.';
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

    this.http.post(`${this.apiUrl}/users/newUser`, this.signupForm.value, { withCredentials: true }).subscribe({
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

  // ---------------------------------------------------------------------------
  // Validation & Erreurs
  // ---------------------------------------------------------------------------

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
  private extractErrorMessage(err: HttpErrorResponse, defaultMessage: string): string {

    if (!err || err.status === 0) {
      return 'Impossible de contacter le serveur. Veuillez réessayer plus tard.';
    }

    const backend = err.error;

    if (typeof backend === 'string' && backend.trim()) {
      return backend;
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
