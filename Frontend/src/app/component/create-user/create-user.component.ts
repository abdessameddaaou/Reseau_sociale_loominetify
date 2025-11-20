import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CountrySelectComponent } from '@wlucha/ng-country-select';


@Component({
selector: 'app-create-user',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, CountrySelectComponent],
templateUrl: './create-user.component.html',
styleUrl: './create-user.component.scss'
})
export class CreateUserComponent {
activeTab = 0;


addUserForm: FormGroup;


constructor(private fb: FormBuilder) {
this.addUserForm = this.fb.group({
// Personal
nom: ['', Validators.required],
prenom: ['', Validators.required],
email: ['', [Validators.required, Validators.email]],
telephone: ['', Validators.pattern(/^\+?[1-9]\d{1,14}$/)],
dateDeNaissance: ['', Validators.required],
ville : [''],
pays : [''],
questionSecrete: ['', Validators.required],
reponseSecrete: ['', Validators.required],
// Account
password: [
  '',
  [
    Validators.required,
    Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  ]
],
confirmPassword: ['', Validators.required]
},
{ validator: this.passwordsMatch }
);
}


passwordsMatch(form: AbstractControl) {
  const password = form.get('password')?.value;
  const confirm = form.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}


next() {
if (this.validateTab(this.activeTab)) this.activeTab++;
}


prev() {
if (this.activeTab > 0) this.activeTab--;
}


validateTab(index: number): boolean {
if (index === 0) {
return this.addUserForm.get('nom')?.valid && this.addUserForm.get('prenom')?.valid && this.addUserForm.get('email')?.valid || false;
}
if (index === 1) {
return this.addUserForm.get('email')?.valid && !this.addUserForm.errors?.['mismatch'] && this.addUserForm.get('password')?.valid && this.addUserForm.get('confirmPassword')?.valid || false;
}
return true;
}


hasError(control: string, error: string) {
return this.addUserForm.get(control)?.touched && this.addUserForm.get(control)?.hasError(error);
}


submit() {

if (this.addUserForm.valid) {
    alert("Formulaire soumis !");
console.log('Form submitted:', this.addUserForm.value);
}
}
}
