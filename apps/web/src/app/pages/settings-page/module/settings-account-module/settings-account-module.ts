import { Component, computed, effect, inject } from '@angular/core';
import { ColorPicker } from '../../../../controls/color-picker/color-picker';
import {UserSettingsService} from '../../../../services/user-settings.service';

interface AccountEditControl {
  key: string;
  label: string;
  value: string;
  description: string;
}

@Component({
  selector: 'app-settings-account-module',
  standalone: true,
  imports: [
    ColorPicker,
  ],
  templateUrl: './settings-account-module.html',
  styleUrls: [
    './settings-account-module.scss',
    '../../../../shared/styles/global-settings.scss',
  ],
})
export class SettingsAccountModule {
  private readonly settingsState = inject(UserSettingsService);

  // Draft aus dem State-Service
  readonly draft = this.settingsState.draft;

  selectedColor = '#000000';
  isPickerOpen = false;

  readonly acc_edits = computed<AccountEditControl[]>(() => {
    const user = this.draft();
    if (!user) {
      return [];
    }

    return [
      {
        key: 'displayName',
        label: 'Display Name',
        value: user.profile?.displayName ?? '',
        description: 'This is the public name other users will see.',
      },
      {
        key: 'username',
        label: 'Username',
        value: user.username ?? '',
        description: 'Your username is used to log in or identify you.',
      },
      {
        key: 'email',
        label: 'Email',
        value: user.email ?? '',
        description:
          'Your email is used to log in or identify you. It can be used for contact or billing.',
      },
      {
        key: 'mobil',
        label: 'Mobile',
        value: '',
        description:
          'Your mobile number can be used for two-factor authentication or contact.',
      },
    ];
  });

  colors = [
    '#3a7bd5', '#6c5ce7', '#ff7675', '#00cec9', '#fab1a0',
    '#fdcb6e', '#a29bfe', '#55efc4', '#ffeaa7', '#00b894',
    '#0984e3', '#d63031', '#e84393', '#fd79a8', '#ff6b81',
    '#1e90ff', '#e17055', '#74b9ff',
  ];

  constructor() {
    effect(() => {
      const user = this.draft();
      if (user?.profile?.accentColor) {
        this.selectedColor = user.profile.accentColor;
      }

      this.avatarImageSrc = user?.profile?.avatarUrl ?? null;
      this.bannerImageSrc = user?.profile?.bannerUrl ?? null;
      this.selectedColor = user?.profile?.accentColor ?? '#3a7bd5';
    });
  }

  selectAccentColor(color: string) {
    this.selectedColor = color;
    this.settingsState.patchProfile({ accentColor: color });
  }

  onAccentColorChange(color: string) {
    this.selectedColor = color;
    this.settingsState.patchProfile({ accentColor: color });
  }

  // Accent Color Picker
  openPicker() {
    this.isPickerOpen = true;
  }

  closePicker() {
    this.isPickerOpen = false;
  }

  isEditModalOpen = false;
  activeControl: AccountEditControl | null = null;
  editValue = '';

  openEdit(control: AccountEditControl) {
    this.activeControl = control;
    this.editValue = control.value;
    this.isEditModalOpen = true;
  }

  closeEdit() {
    this.isEditModalOpen = false;
    this.activeControl = null;
    this.editValue = '';
  }

  onEditInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;
    this.editValue = target.value;
  }

  saveEdit() {
    if (!this.activeControl) return;

    const key = this.activeControl.key;
    const value = this.editValue.trim();

    switch (key) {
      case 'displayName':
        this.settingsState.patchProfile({ displayName: value });
        break;
      case 'username':
        this.settingsState.patchDraft({ username: value });
        break;
      case 'email':
        this.settingsState.patchDraft({ email: value });
        break;
      case 'mobil':
        console.log('Not supported yet');
        break;
      default:
        break;
    }

    this.closeEdit();
  }

  avatarImageSrc: string | null = null;
  bannerImageSrc: string | null = null;

  isAvatarModalOpen = false;
  avatarTempSrc: string | null = null;
  avatarUrlInput = '';

  openAvatarModal() {
    const user = this.draft();
    this.avatarImageSrc = user?.profile?.avatarUrl ?? null;

    this.isAvatarModalOpen = true;
    this.avatarTempSrc = this.avatarImageSrc;
    this.avatarUrlInput = this.avatarImageSrc ?? '';
  }

  closeAvatarModal() {
    this.isAvatarModalOpen = false;
    this.avatarTempSrc = null;
    this.avatarUrlInput = '';
  }

  onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input?.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarTempSrc = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  applyAvatarUrl() {
    const url = this.avatarUrlInput.trim();
    if (!url) return;
    this.avatarTempSrc = url;
  }

  saveAvatar() {
    this.avatarImageSrc = this.avatarTempSrc;
    this.settingsState.patchProfile({ avatarUrl: this.avatarImageSrc ?? '' });
    this.closeAvatarModal();
  }

  removeAvatar() {
    this.avatarImageSrc = null;
    this.settingsState.patchProfile({ avatarUrl: '' });
  }

  // Banner-Modal
  isBannerModalOpen = false;
  bannerTempSrc: string | null = null;
  bannerUrlInput = '';

  openBannerModal() {
    const user = this.draft();
    this.bannerImageSrc = user?.profile?.bannerUrl ?? null;

    this.isBannerModalOpen = true;
    this.bannerTempSrc = this.bannerImageSrc;
    this.bannerUrlInput = this.bannerImageSrc ?? '';
  }

  closeBannerModal() {
    this.isBannerModalOpen = false;
    this.bannerTempSrc = null;
    this.bannerUrlInput = '';
  }

  onBannerFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input?.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.bannerTempSrc = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  applyBannerUrl() {
    const url = this.bannerUrlInput.trim();
    if (!url) return;
    this.bannerTempSrc = url;
  }

  saveBanner() {
    this.bannerImageSrc = this.bannerTempSrc;
    this.settingsState.patchDraft({ profile: { bannerUrl: this.bannerImageSrc ?? '' } });
    this.closeBannerModal();
  }

  removeBanner() {
    this.bannerImageSrc = null;
    this.settingsState.patchDraft({ profile: { bannerUrl: '' } });
  }

  protected get displayName(): string {
    const user = this.draft();
    const name =
      user?.profile?.displayName ??
      this.acc_edits().find((c) => c.key === 'displayName')?.value ??
      '';
    return name.trim() || 'User';
  }

  get displayInitial(): string {
    const name = this.displayName;
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  get initialBackground(): string {
    return this.generateColorFromName(this.displayName);
  }

  private generateColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }

    const hue = hash % 360; // 0–359
    const saturation = 55 + (hash % 25); // 55–79%
    const lightness = 40 + (hash % 15); // 40–54%

    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  }
}
