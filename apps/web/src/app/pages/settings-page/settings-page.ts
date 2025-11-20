import {Component, inject, signal} from '@angular/core';
import {Location} from '@angular/common';
import {SettingsPageType} from '../../types/settings-page-types';
import {SettingsAccountModule} from './module/settings-account-module/settings-account-module';
import {
  SettingsPrivacyAndSecurityModule
} from './module/settings-privacy-and-security-module/settings-privacy-and-security-module';

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

  openPage = signal<SettingsPageType>(SettingsPageType.Account);

  pages = [
    { type: SettingsPageType.Account, label: 'My Account' },
    { type: SettingsPageType.Security, label: 'Privacy & Security' },
  ];

  private pageLabels = new Map<SettingsPageType, string>(
    this.pages.map(p => [p.type, p.label])
  );

  setPage(page: SettingsPageType): void {
    this.openPage.set(page);
  }

  goBack() {
    this.location.back();
  }

  currentPageLabel(): string {
    return this.pageLabels.get(this.openPage()) ?? '';
  }

  protected readonly SettingsPageType = SettingsPageType;
}
