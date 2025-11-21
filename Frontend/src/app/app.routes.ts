import { Routes } from '@angular/router';
import { AuthUserComponent } from './component/auth-user/auth-user.component';
import { ResetPasswordComponent } from './component/reset-password/reset-password.component';
import { FilActualiteComponent } from './component/fil-actualite/fil-actualite.component';
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
    component: FilActualiteComponent 
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

