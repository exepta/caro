import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { SettingsPageType } from '../../types/settings-page-types';
import { SettingsAccountModule } from './module/settings-account-module/settings-account-module';
import {
  SettingsPrivacyAndSecurityModule
} from './module/settings-privacy-and-security-module/settings-privacy-and-security-module';
import { UserSettingsService } from '../../services/user-settings.service';

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

  openPage = signal<SettingsPageType>(SettingsPageType.Account);

  pages = [
    { type: SettingsPageType.Account, label: 'My Account' },
    { type: SettingsPageType.Security, label: 'Privacy & Security' },
  ];

  private pageLabels = new Map<SettingsPageType, string>(
    this.pages.map(p => [p.type, p.label])
  );

  constructor() {
    this.settingsState.initFromCurrentUser();
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

  protected readonly SettingsPageType = SettingsPageType;
}
