import { Routes } from '@angular/router';
import {AuthenticationPage} from './pages/authentication-page/authentication-page';
import {ClientViewPage} from './pages/client-view-page/client-view-page';
import {authGuard} from './guard/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthenticationPage,
  },
  {
    path: 'client',
    component: ClientViewPage,
    canMatch: [authGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth',
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];
