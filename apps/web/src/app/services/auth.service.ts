import {inject, Injectable, signal} from '@angular/core';
import {InternalAuthService, LoginRequest, RegisterRequest, TokenResponse} from '../api';
import {Router} from '@angular/router';
import {tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly authApi = inject(InternalAuthService);
  private readonly router = inject(Router);

  private readonly authState = signal<TokenResponse | null>(null);

  constructor() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      this.authState.set({ accessToken, refreshToken });
    }
  }

  register(data: RegisterRequest) {
    return this.authApi.register(data);
  }

  login(data: LoginRequest) {
    return this.authApi.login(data).pipe(
      tap((response) => {
        this.authState.set(response);
        if (response.accessToken != null && response.refreshToken != null) {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      }),
    );
  }

  logout() {
    this.authState.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    void this.router.navigateByUrl('/auth');
  }

  isAuthenticated(): boolean {
    return this.authState() !== null;
  }
}
