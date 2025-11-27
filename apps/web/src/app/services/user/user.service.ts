import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { UserInternalService, UserSettingsResponse } from '../../api';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private readonly userApi = inject(UserInternalService);

  private readonly userSettingState = signal<UserSettingsResponse | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly user = this.userSettingState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly isLoggedIn = computed(() => this.user() !== null);

  loadCurrentUser(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.userApi.getCurrentUser().subscribe({
      next: (userSettings) => {
        this.userSettingState.set(userSettings);
        this.loadingState.set(false);
      },
      error: (err) => {
        this.userSettingState.set(null);
        this.loadingState.set(false);
        this.errorState.set('Cant load user settings.');
        console.error(err);
      },
    });
  }

  currentUser(): Observable<UserSettingsResponse> {
    return this.userApi.getCurrentUser();
  }

  getCurrentUser(): UserSettingsResponse | null {
    return this.user();
  }

  clearUser(): void {
    this.userSettingState.set(null);
    this.errorState.set(null);
  }

  updateUser(user: UserSettingsResponse): void {
    this.userSettingState.set(user);
  }

  getUserById(id: string): Observable<UserSettingsResponse> {
    return this.userApi.getUserById(id);
  }

  getUserByUsername(username: string): Observable<UserSettingsResponse> {
    return this.userApi.getUserByUsername(username);
  }

  searchUsersByUsername(username: string): Observable<UserSettingsResponse[]> {
    return this.userApi.searchUsersByUsername(username);
  }
}
