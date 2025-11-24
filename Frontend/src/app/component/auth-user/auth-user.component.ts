import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import Swal from 'sweetalert2';

@Component({
selector: 'app-auth-user',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
templateUrl: './auth-user.component.html'
})
export class AuthUserComponent implements OnInit {
  countries: any[] = [];


  pageRedirection: 'login' | 'signup' = 'login';
  signupStep = 1;

  loginForm: FormGroup;
  signupForm: FormGroup;


  dropdownOpen = false;
  selectedCountry: any = null;

  /**
   * Erreurs
   */
  signupErrors: { [key: string]: string } = {};
  loginError = '';
  signupError = '';
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
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      phone: [''],
      dateNaissance: ['', Validators.required],
      pays: [''],
      city: [''],
      question: ['', Validators.required],
      reponse: ['', Validators.required],
    });
  }

  /**
   * ngOnInit()
   */

ngOnInit() {
  this.http.get<any[]>('https://restcountries.com/v3.1/all?fields=name,flags,cca2,translations').subscribe((data) => {
    this.countries = data
      .map((c) => ({
        name: c.translations?.fra?.common || c.name.common,
        code: c.cca2,
        flag: c.flags.png,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
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
      .post(`${environment.apiUrl}/auth/login`, this.loginForm.value, { withCredentials: true })
      .subscribe({
        next: () => {
          this.router.navigate(['/fil-actualite']);
        },
        error: (err: any) => {
          this.loginError = this.extractErrorMessage(err, 'Impossible de se connecter au serveur.');
        },
      });
  }

  // ---------------------------------------------------------------------------
  // Inscription – Navigation entre les étapes
  // ---------------------------------------------------------------------------

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
    }else if (password !== confirmPassword) {
      this.signupErrors['confirmPassword'] = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    if (isValid) {
      this.signupStep = 3;
    }
  }

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

  // ---------------------------------------------------------------------------
  // Inscription
  // ---------------------------------------------------------------------------

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
    this.http.post(`${environment.apiUrl}/users/newUser`, this.signupForm.value, { withCredentials: true }).subscribe({
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
