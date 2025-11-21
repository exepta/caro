import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsAccountModule } from './settings-account-module';

describe('SettingsAccountModule', () => {
  let component: SettingsAccountModule;
  let fixture: ComponentFixture<SettingsAccountModule>;
  class MockFileReader implements Partial<FileReader> {
    result: string | ArrayBuffer | null = 'data:image/png;base64,TEST';
    onload: ((this: any, ev: ProgressEvent<FileReader>) => any) | null = null;

    readAsDataURL(_file: Blob): void {
      if (this.onload) {
        this.onload.call(this, {} as ProgressEvent<FileReader>);
      }
    }
  }

  beforeAll(() => {
    (globalThis as any).FileReader = MockFileReader as any;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsAccountModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsAccountModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ------------------------
  // Accent Color / Palette
  // ------------------------

  it('should select accent color', () => {
    const color = component.colors[3];
    component.selectAccentColor(color);
    expect(component.selectedColor).toBe(color);
  });

  it('should open and close color picker', () => {
    expect(component.isPickerOpen).toBe(false);

    component.openPicker();
    expect(component.isPickerOpen).toBe(true);

    component.closePicker();
    expect(component.isPickerOpen).toBe(false);
  });

  // ------------------------
  // Edit Modal
  // ------------------------

  it('should open edit modal with selected control', () => {
    const control = component.acc_edits[0];

    component.openEdit(control);

    expect(component.isEditModalOpen).toBe(true);
    expect(component.activeControl).toBe(control);
    expect(component.editValue).toBe(control.value);
  });

  it('should update editValue on input', () => {
    const event = {
      target: { value: 'NewValue' },
    } as unknown as Event;

    component.onEditInput(event);

    expect(component.editValue).toBe('NewValue');
  });

  it('should save edit and close modal', () => {
    const control = component.acc_edits[1];
    component.openEdit(control);

    component.editValue = 'UpdatedName';
    component.saveEdit();

    expect(control.value).toBe('UpdatedName');
    expect(component.isEditModalOpen).toBe(false);
    expect(component.activeControl).toBeNull();
    expect(component.editValue).toBe('');
  });

  // ------------------------
  // Avatar Modal / Avatar Image
  // ------------------------

  it('should open avatar modal and initialize temp values', () => {
    component.avatarImageSrc = 'https://example.com/avatar.png';

    component.openAvatarModal();

    expect(component.isAvatarModalOpen).toBe(true);
    expect(component.avatarTempSrc).toBe('https://example.com/avatar.png');
    expect(component.avatarUrlInput).toBe('https://example.com/avatar.png');
  });

  it('should close avatar modal and reset temp values', () => {
    component.isAvatarModalOpen = true;
    component.avatarTempSrc = 'temp';
    component.avatarUrlInput = 'url';

    component.closeAvatarModal();

    expect(component.isAvatarModalOpen).toBe(false);
    expect(component.avatarTempSrc).toBeNull();
    expect(component.avatarUrlInput).toBe('');
  });

  it('should set avatarTempSrc when file is selected', () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const event = {
      target: {
        files: [file],
      },
    } as unknown as Event;

    component.onAvatarFileSelected(event);

    expect(component.avatarTempSrc).toBe('data:image/png;base64,TEST');
  });

  it('should apply avatar url', () => {
    component.avatarUrlInput = '  https://example.com/avatar.png  ';

    component.applyAvatarUrl();

    expect(component.avatarTempSrc).toBe('https://example.com/avatar.png');
  });

  it('should save avatar image and close modal', () => {
    component.avatarTempSrc = 'https://example.com/avatar.png';
    component.isAvatarModalOpen = true;

    component.saveAvatar();

    expect(component.avatarImageSrc).toBe('https://example.com/avatar.png');
    expect(component.isAvatarModalOpen).toBe(false);
  });

  it('should remove avatar image', () => {
    component.avatarImageSrc = 'https://example.com/avatar.png';

    component.removeAvatar();

    expect(component.avatarImageSrc).toBeNull();
  });

  // ------------------------
  // Banner Modal / Banner Image
  // ------------------------

  it('should open banner modal and initialize temp values', () => {
    component.bannerImageSrc = 'https://example.com/banner.png';

    component.openBannerModal();

    expect(component.isBannerModalOpen).toBe(true);
    expect(component.bannerTempSrc).toBe('https://example.com/banner.png');
    expect(component.bannerUrlInput).toBe('https://example.com/banner.png');
  });

  it('should close banner modal and reset temp values', () => {
    component.isBannerModalOpen = true;
    component.bannerTempSrc = 'temp';
    component.bannerUrlInput = 'url';

    component.closeBannerModal();

    expect(component.isBannerModalOpen).toBe(false);
    expect(component.bannerTempSrc).toBeNull();
    expect(component.bannerUrlInput).toBe('');
  });

  it('should set bannerTempSrc when file is selected', () => {
    const file = new File(['banner'], 'banner.png', { type: 'image/png' });
    const event = {
      target: {
        files: [file],
      },
    } as unknown as Event;

    component.onBannerFileSelected(event);

    expect(component.bannerTempSrc).toBe('data:image/png;base64,TEST');
  });

  it('should apply banner url', () => {
    component.bannerUrlInput = '  https://example.com/banner.png  ';

    component.applyBannerUrl();

    expect(component.bannerTempSrc).toBe('https://example.com/banner.png');
  });

  it('should save banner image and close modal', () => {
    component.bannerTempSrc = 'https://example.com/banner.png';
    component.isBannerModalOpen = true;

    component.saveBanner();

    expect(component.bannerImageSrc).toBe('https://example.com/banner.png');
    expect(component.isBannerModalOpen).toBe(false);
  });

  it('should remove banner image', () => {
    component.bannerImageSrc = 'https://example.com/banner.png';

    component.removeBanner();

    expect(component.bannerImageSrc).toBeNull();
  });

  // ------------------------
  // DisplayName / Initial / Background
  // ------------------------

  it('should return displayName from acc_edits', () => {
    const displayName = (component as any).displayName as string;
    expect(displayName).toBe('Exepta');
  });

  it('should compute displayInitial from displayName', () => {
    const initial = component.displayInitial;
    expect(initial).toBe('E');
  });

  it('should compute initialBackground as hsl color', () => {
    const bg = component.initialBackground;
    expect(bg.startsWith('hsl(')).toBe(true);
  });
});
