import { Component } from '@angular/core';
import { ColorPicker } from '../../../../controls/color-picker/color-picker';

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
  selectedColor = '#3a7bd5';
  isPickerOpen = false;

  acc_edits: AccountEditControl[] = [
    {
      key: 'displayName',
      label: 'Display Name',
      value: 'Exepta',
      description: 'This is the public name other users will see.',
    },
    {
      key: 'username',
      label: 'Username',
      value: 'dev',
      description: 'Your username is used to log in or identify you.',
    },
    {
      key: 'email',
      label: 'Email',
      value: 'dev@caro.de',
      description:
        'Your email is used to log in or identify you. It can be used for contact or billing.',
    },
    {
      key: 'mobil',
      label: 'Mobile',
      value: '+49 123 4567890',
      description:
        'Your mobile number can be used for two-factor authentication or contact.',
    },
  ];

  colors = [
    '#3a7bd5', // modern blue
    '#6c5ce7', // violet
    '#ff7675', // soft red
    '#00cec9', // cyan teal
    '#fab1a0', // peach
    '#fdcb6e', // amber
    '#a29bfe', // soft purple
    '#55efc4', // mint
    '#ffeaa7', // light yellow
    '#00b894', // strong teal
    '#0984e3', // pure blue
    '#d63031', // strong red
    '#e84393', // hot pink
    '#fd79a8', // pastel pink
    '#ff6b81', // coral pink
    '#1e90ff', // deep sky blue
    '#e17055', // orange copper
    '#74b9ff', // baby blue
  ];

  selectAccentColor(color: string) {
    this.selectedColor = color;
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
    this.activeControl.value = this.editValue;
    // TODO: Backend-Update hier
    this.closeEdit();
  }

  avatarImageSrc: string | null = null;
  bannerImageSrc: string | null = null;

  // Avatar-Modal
  isAvatarModalOpen = false;
  avatarTempSrc: string | null = null;
  avatarUrlInput = '';

  openAvatarModal() {
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
    this.closeAvatarModal();
  }

  removeAvatar() {
    this.avatarImageSrc = null;
  }

  // Banner-Modal
  isBannerModalOpen = false;
  bannerTempSrc: string | null = null;
  bannerUrlInput = '';

  openBannerModal() {
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
    this.closeBannerModal();
  }

  removeBanner() {
    this.bannerImageSrc = null;
  }


  protected get displayName(): string {
    return (
      this.acc_edits.find((c) => c.key === 'displayName')?.value?.trim() ||
      'User'
    );
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
