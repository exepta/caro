import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { SettingsPageType } from '../../types/settings-page-types';
import { SettingsAccountModule } from './module/settings-account-module/settings-account-module';
import {
  SettingsPrivacyAndSecurityModule
} from './module/settings-privacy-and-security-module/settings-privacy-and-security-module';
import { UserSettingsService } from '../../services/user-settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings-page',
  imports: [
    SettingsAccountModule,
    SettingsPrivacyAndSecurityModule
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly location = inject(Location);
  private readonly settingsState = inject(UserSettingsService);
  private readonly authService = inject(AuthService);

  openPage = signal<SettingsPageType>(SettingsPageType.Account);
  showLogoutModal = signal(false);

  pages = [
    { type: SettingsPageType.Account, label: 'My Account', modal: false },
    { type: SettingsPageType.Security, label: 'Privacy & Security', modal: false },
    { type: SettingsPageType.Split, label: '', modal: false },
    { type: SettingsPageType.Logout, label: 'Logout', modal: true },
  ];

  private pageLabels = new Map<SettingsPageType, string>(
    this.pages.map(p => [p.type, p.label])
  );

  constructor() {
    this.settingsState.initFromCurrentUser();
  }

  onNavClick(page: { type: SettingsPageType; label: string; modal: boolean }): void {
    if (page.type === SettingsPageType.Split) {
      return;
    }

    if (page.modal) {
      this.openLogoutModal();
    } else {
      this.setPage(page.type);
    }
  }

  setPage(page: SettingsPageType): void {
    this.openPage.set(page);
  }

  goBack(): void {
    if (this.settingsState.hasUnsavedChanges()) {
      return;
    }
    this.location.back();
  }

  onSave(): void {
    this.settingsState.save().subscribe({
      error: (err) => console.error('Failed to save settings', err),
    });
  }

  onRevoke(): void {
    this.settingsState.reset();
  }

  hasUnsavedChanges(): boolean {
    return this.settingsState.hasUnsavedChanges();
  }

  currentPageLabel(): string {
    return this.pageLabels.get(this.openPage()) ?? '';
  }

  openLogoutModal(): void {
    this.showLogoutModal.set(true);
  }

  closeLogoutModal(): void {
    this.showLogoutModal.set(false);
  }

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }

  protected readonly SettingsPageType = SettingsPageType;
}
