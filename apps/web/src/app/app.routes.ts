import { Routes } from '@angular/router';
import {AuthenticationPage} from './pages/authentication-page/authentication-page';
import {ClientViewPage} from './pages/client-view-page/client-view-page';
import {authGuard} from './guard/auth-guard';
import {SettingsPage} from './pages/settings-page/settings-page';
import {authRedirectGuard} from './guard/auth-redirect-guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthenticationPage,
    canMatch: [authRedirectGuard]
  },
  {
    path: 'client',
    component: ClientViewPage,
    canMatch: [authGuard],
  },
  {
    path: 'settings',
    component: SettingsPage,
    canMatch: [authGuard]
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
