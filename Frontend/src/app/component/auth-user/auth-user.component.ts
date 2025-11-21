import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
// import { CountrySelectComponent } from '@wlucha/ng-country-select';
import { Router, RouterModule } from '@angular/router';


@Component({
selector: 'app-auth-user',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, RouterModule],
templateUrl: './auth-user.component.html'
})
export class AuthUserComponent {
 mode: 'login' | 'signup' = 'login';
  signupStep = 1;

  loginForm: FormGroup;
  signupForm: FormGroup;

  signupErrors: { [key: string]: string } = {};

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.signupForm = this.fb.group({
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

  setMode(mode: 'login' | 'signup') {
    this.mode = mode;
    if (mode === 'signup') {
      this.signupStep = 1;
      this.clearErrors();
    }
  }

  // --- helpers ---
  clearErrors() {
    this.signupErrors = {};
  }

  private validatePassword(password: string): boolean {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasUpper && hasNumber && hasSpecial;
  }

  // --- navigation entre les étapes ---
  goFromStep1() {
    this.clearErrors();
    const fullName = this.signupForm.get('fullName')?.value?.trim();
    const email = this.signupForm.get('email')?.value?.trim();
    let ok = true;

    if (!fullName) {
      this.signupErrors['fullName'] = 'Le champ "Nom complet" est obligatoire';
      ok = false;
    }

    if (!email) {
      this.signupErrors['email'] = 'Le champ "Adresse email" est obligatoire';
      ok = false;
    } else if (this.signupForm.get('email')?.invalid) {
      this.signupErrors['email'] = 'Veuillez entrer une adresse email valide';
      ok = false;
    }

    if (ok) this.signupStep = 2;
  }

  goFromStep2() {
    this.clearErrors();
    const password = this.signupForm.get('password')?.value;
    let ok = true;

    if (!password) {
      this.signupErrors['password'] = 'Le champ "Mot de passe" est obligatoire';
      ok = false;
    } else if (!this.validatePassword(password)) {
      this.signupErrors['password'] = 'Le mot de passe ne respecte pas les critères de sécurité';
      ok = false;
    }

    if (ok) this.signupStep = 3;
  }

  goFromStep3() {
    this.clearErrors();
    const birthdate = this.signupForm.get('birthdate')?.value;
    let ok = true;

    if (!birthdate) {
      this.signupErrors['birthdate'] = 'Le champ "Date de naissance" est obligatoire';
      ok = false;
    }

    if (ok) this.signupStep = 4;
  }

  // --- submit forms ---
  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    console.log('Connexion...', this.loginForm.value); // appel API ici
    
  }

  onSignup() {
    this.clearErrors();
    if (this.signupStep !== 4) return;

    const sq = this.signupForm.get('secretQuestion')?.value;
    const sa = this.signupForm.get('secretAnswer')?.value?.trim();
    let ok = true;

    if (!sq) {
      this.signupErrors['secretQuestion'] = 'Le champ "Question secrète" est obligatoire';
      ok = false;
    }
    if (!sa) {
      this.signupErrors['secretAnswer'] = 'Le champ "Réponse secrète" est obligatoire';
      ok = false;
    }

    if (!ok) return;

    if (this.signupForm.invalid) {
      // au cas où d’autres champs seraient invalides
      this.signupForm.markAllAsTouched();
      return;
    }

    console.log('Inscription complétée', this.signupForm.value);
    alert('Inscription réussie ! Un email de confirmation vous a été envoyé.');
    this.router.navigate(['/fil-actualite'])
  }
}
