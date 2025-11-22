import {computed, effect, inject, Injectable, signal} from '@angular/core';
import { UserInternalService, UserSettingsResponse } from '../api';
import { UserService } from './user.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly api = inject(UserInternalService);
  private readonly userService = inject(UserService);

  private readonly draftState = signal<UserSettingsResponse | null>(null);
  readonly draft = this.draftState.asReadonly();

  readonly hasUnsavedChanges = computed(() => {
    const original = this.userService.user();
    const draft = this.draftState();
    if (!original || !draft) return false;

    return JSON.stringify(original) !== JSON.stringify(draft);
  });

  constructor() {
    effect(() => {
      const user = this.userService.user();
      if (user && !this.draftState()) {
        this.draftState.set(structuredClone(user));
      }
    });
  }

  initFromCurrentUser(): void {
    const original = this.userService.user();
    if (!original) {
      return;
    }

    this.draftState.set(structuredClone(original));
  }

  initFromUser(user: UserSettingsResponse): void {
    this.draftState.set(structuredClone(user));
  }

  reset(): void {
    this.initFromCurrentUser();
  }

  save(): Observable<UserSettingsResponse> {
    const draft = this.draftState();
    if (!draft) {
      throw new Error('No draft to save');
    }

    return this.api.updateCurrentUser(draft).pipe(
      tap((updated) => {
        this.userService.updateUser(updated);
        this.draftState.set(structuredClone(updated));
      })
    );
  }

  patchDraft(partial: Partial<UserSettingsResponse>): void {
    const current = this.draftState();
    if (!current) return;

    const next: UserSettingsResponse = {
      ...current,
      ...partial,
      profile: {
        ...(current.profile ?? {}),
        ...(partial.profile ?? {}),
      },
    };

    this.draftState.set(next);
  }

  patchProfile(partial: Partial<NonNullable<UserSettingsResponse['profile']>>): void {
    const current = this.draftState();
    if (!current) return;

    const next: UserSettingsResponse = {
      ...current,
      profile: {
        ...(current.profile ?? {}),
        ...partial,
      },
    };

    this.draftState.set(next);
  }
}
