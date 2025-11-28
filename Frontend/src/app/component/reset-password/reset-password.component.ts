import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  currentStep = 1; // 1: choix + envoi, 2: code, 3: nouveau mdp
  success = false;
  remainingTime: number = 0;
  isDisabled: boolean = false;
  interval: any;
  errors: { [key: string]: string } = {};

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.resetForm = this.fb.group({
      method: ['email', Validators.required],
      email: [''],
      phone: [''],
      code: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  get methodControl() {
    return this.resetForm.get('method')!;
  }

  clearErrors() {
    this.errors = {};
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasUpperCase && hasNumber && hasSpecialChar;
  }

  // Étape 1 : envoi du code
  sendCode() {
    this.clearErrors();
    const method = this.methodControl.value;
    let ok = true;
    const email = this.resetForm.get('email')?.value?.trim();
    if (method === 'email') {

      if (!email) {
        this.errors['email'] = "L'email est obligatoire.";
        ok = false;
      } else if (!this.validateEmail(email)) {
        this.errors['email'] = 'Veuillez entrer un email valide.';
        ok = false;
      }
    } else {
      const phone = this.resetForm.get('phone')?.value?.trim();
      if (!phone) {
        this.errors['phone'] = 'Le numéro de téléphone est obligatoire.';
        ok = false;
      }
    }

    if (!ok) return;

    // Appel API
    this.http.post(`${environment.apiUrl}/auth/forgotpassword`, { email}).subscribe({
        next: () => {
           // Passage à l’étape 2
           this.currentStep = 2;
           this.success = false;
           this.clearErrors();
           this.startTimer();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'envoi du code de vérification', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err.error.error || 'Une erreur est survenue lors de l\'envoi du code.',
          });
        },
      });
    // TODO: appel API pour envoyer le code
    // console.log('Envoi du code de vérification...', this.resetForm.value);


  }

  resendCode() {
    this.sendCode();
  }

  backToStep1() {
    this.currentStep = 1;
    this.success = false;
    this.clearErrors();
  }

  backToStep2() {
    this.currentStep = 2;
    this.success = false;
    this.clearErrors();
  }

  // Étape 2 : vérification du code
  verifyCode() {
    this.clearErrors();
    const code = this.resetForm.get('code')?.value?.trim();
    const email = this.resetForm.get('email')?.value?.trim();
    let ok = true;

    if (!code || code.length < 4) {
      this.errors['code'] = 'Veuillez entrer le code reçu.';
      ok = false;
    }

    if (!ok) return;

    // TODO: appel API pour vérifier le code
    console.log('Vérification du code...', code);
    this.http.post(`${environment.apiUrl}/auth/checkcode`, { email, codeReinitialisation: code }).subscribe({
        next: () => {
           // Passage à l’étape 3
            this.currentStep = 3;
            this.success = false;
            this.clearErrors();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'envoi du code de vérification', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err.error.error || 'Une erreur est survenue lors de la vérification du code.',
          });
        },
      });


  }

  // Étape 3 : nouveau mot de passe
  onSubmit() {
    if (this.currentStep !== 3) return;

    this.clearErrors();
    this.success = false;
    const email = this.resetForm.get('email')?.value?.trim();
    const newPassword = this.resetForm.get('newPassword')?.value;
    const confirmPassword = this.resetForm.get('confirmPassword')?.value;

    let ok = true;

    if (!newPassword) {
      this.errors['newPassword'] = 'Le nouveau mot de passe est obligatoire.';
      ok = false;
    } else if (!this.validatePassword(newPassword)) {
      this.errors['newPassword'] =
        'Le mot de passe ne respecte pas les critères de sécurité.';
      ok = false;
    }

    if (!confirmPassword) {
      this.errors['confirmPassword'] = 'Veuillez confirmer votre nouveau mot de passe.';
      ok = false;
    } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      this.errors['confirmPassword'] = 'Les mots de passe ne correspondent pas.';
      ok = false;
    }

    if (!ok) return;

    // TODO: appel API pour changer le mot de passe
        this.http.put(`${environment.apiUrl}/auth/resetpassword`, { email, newPassword }).subscribe({
        next: () => {
          Swal.fire({
           icon: 'success',
          title: 'Mot de passe réinitialisé',
          text: 'Votre mot de passe a été modifié avec succès.',
          confirmButtonText: 'Retour à la connexion',
          confirmButtonColor: '#5b7cff'
          }).then(() => {
            this.success = true;
            this.router.navigate(['/auth']);
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err.error.error || 'Une erreur est survenue lors de la vérification du code.',
          });
        },
      });

    this.success = true;
  }

  navigateTo() {
    this.router.navigate(['/auth']);
  }

  startTimer() {
  this.remainingTime = 5 * 60;  // 5 minutes
  this.isDisabled = true;

  if (this.interval) {
    clearInterval(this.interval);
  }

  this.interval = setInterval(() => {
    this.remainingTime--;

    if (this.remainingTime <= 0) {
      clearInterval(this.interval);
      this.isDisabled = false;
    }
  }, 1000);
  }

  formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  const mm = m < 10 ? '0' + m : m;
  const ss = s < 10 ? '0' + s : s;

  return `${mm}:${ss}`;
}
}
