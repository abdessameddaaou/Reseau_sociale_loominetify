import { Routes } from '@angular/router';
import { AuthGuard } from './service/auth-guard.service';
import { AuthUserComponent } from './component/auth-user/auth-user.component';
import { ResetPasswordComponent } from './component/reset-password/reset-password.component';
import { FilActualiteComponent } from './component/fil-actualite/fil-actualite.component';
import { ActivationCompte } from './component/activation-compte/activation-compte.component'
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
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'auth',
  }
];

