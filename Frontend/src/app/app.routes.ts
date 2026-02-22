import { Routes } from '@angular/router';
import { AuthGuard } from './service/auth-guard.service';
import { AuthUserComponent } from './component/auth-user/auth-user.component';
import { ResetPasswordComponent } from './component/reset-password/reset-password.component';
import { FilActualiteComponent } from './component/fil-actualite/fil-actualite.component';
import { ActivationCompte } from './component/activation-compte/activation-compte.component';
import { MessagesComponent } from './component/messages/messages.component';
import { SettingsComponent } from './component/settingscomponent/settings.component';
import { ProfileComponent } from './component/profile/profile.component';
import { UserprofileviewComponent } from './component/userprofileview.component/userprofileview.component';
export const routes: Routes = [
  {
    path: 'auth',
    component: AuthUserComponent
  },
  { 
    path: 'reset-password', 
    component: ResetPasswordComponent 
  },
  { 
    path: 'fil-actualite', 
    component: FilActualiteComponent,
    canActivate: [AuthGuard],
  },
  { 
    path: 'activation-compte/:id', 
    component: ActivationCompte 
  },
  { 
    path: 'messages', 
    component: MessagesComponent,
    canActivate: [AuthGuard],
  },
  { 
    path: 'settings', 
    component: SettingsComponent,
    canActivate: [AuthGuard],
  },
  { 
    path: 'profile', 
    component: ProfileComponent, 
    canActivate: [AuthGuard],
  },
    { 
    path: 'profil/:id', 
    component: UserprofileviewComponent, 
    canActivate: [AuthGuard],
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'auth',
  }
];

