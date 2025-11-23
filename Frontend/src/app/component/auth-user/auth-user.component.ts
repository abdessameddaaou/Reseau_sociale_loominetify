import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';


@Component({
selector: 'app-auth-user',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
templateUrl: './auth-user.component.html'
})
export class AuthUserComponent implements OnInit {
  countries: any[] = [];


  mode: 'login' | 'signup' = 'login';
  signupStep = 1;

  loginForm: FormGroup;
  signupForm: FormGroup;

  signupErrors: { [key: string]: string } = {};
  dropdownOpen = false;
  selectedCountry: any = null;

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.signupForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      phone: [''],
      birthdate: ['', Validators.required],
      pays: [''],
      city: [''],
      secretQuestion: ['', Validators.required],
      secretAnswer: ['', Validators.required],
    });
  }

ngOnInit() {
  this.http.get<any[]>('https://restcountries.com/v3.1/all?fields=name,flags,cca2,translations').subscribe((data) => {
    this.countries = data
      .map((c) => ({
        name: c.translations?.fra?.common || c.name.common, // Nom en français ou fallback
        code: c.cca2,
        flag: c.flags.png,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

  toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
  }

  selectCountry(country: any) {
    this.selectedCountry = country;
    this.signupForm.get('pays')?.setValue(country.name);
    this.dropdownOpen = false;
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
    const nom = this.signupForm.get('nom')?.value?.trim();
    const prenom = this.signupForm.get('prenom')?.value?.trim();
    const email = this.signupForm.get('email')?.value?.trim();
    let ok = true;

    if (!nom) {
      this.signupErrors['nom'] = 'Le champ "Nom complet" est obligatoire';
      ok = false;
    }

    if (!prenom) {
      this.signupErrors['prenom'] = 'Le champ "Prénom" est obligatoire';
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
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;
    let ok = true;

    if (!password) {
      this.signupErrors['password'] = 'Le champ "Mot de passe" est obligatoire';
      ok = false;
    } else if (!this.validatePassword(password)) {
      this.signupErrors['password'] = 'Le mot de passe ne respecte pas les critères de sécurité';
      ok = false;
    } else if (password !== confirmPassword) {
      this.signupErrors['confirmPassword'] = 'Les mots de passe ne correspondent pas';
      ok = false;
    }

    if (ok) this.signupStep = 3;
  }

goFromStep3() {
  this.clearErrors();
  const birthdate = this.signupForm.get('birthdate')?.value;
  const pays = this.signupForm.get('pays')?.value;
  let ok = true;

  // ta validation de date (je la laisse telle quelle)
  if (!birthdate) {
    this.signupErrors['birthdate'] = 'Le champ "Date de naissance" est obligatoire';
    ok = false;
  } else {
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) {
      this.signupErrors['birthdate'] = 'La date de naissance est invalide';
      ok = false;
    } else {
      const today = new Date();
      if (birth > today) {
        this.signupErrors['birthdate'] = 'La date de naissance ne peut pas être dans le futur';
        ok = false;
      } else {
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        if (age < 18) {
          this.signupErrors['birthdate'] =
            'Vous devez avoir au moins 18 ans pour vous inscrire';
          ok = false;
        }
      }
    }
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
