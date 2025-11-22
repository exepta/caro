import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { SettingsAccountModule } from './settings-account-module';
import { UserSettingsService } from '../../../../services/user-settings.service';

describe('SettingsAccountModule', () => {
  let component: SettingsAccountModule;
  let fixture: ComponentFixture<SettingsAccountModule>;

  const draftSignal = signal<any>(null);

  const settingsStateMock = {
    draft: draftSignal.asReadonly(),
    patchProfile: jest.fn(),
    patchDraft: jest.fn(),
  };

  const originalFileReader = globalThis.FileReader;

  class MockFileReader {
    result: string | ArrayBuffer | null = null;
    onload: any = null;

    readAsDataURL(_file: Blob) {
      this.result = 'data:mock';
      if (this.onload) {
        this.onload({} as any);
      }
    }
  }

  beforeAll(() => {
    (globalThis as any).FileReader = MockFileReader as any;
  });

  afterAll(() => {
    (globalThis as any).FileReader = originalFileReader;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsAccountModule],
      providers: [
        { provide: UserSettingsService, useValue: settingsStateMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    jest.clearAllMocks();
    draftSignal.set(null);
  });

  function createComponent() {
    fixture = TestBed.createComponent(SettingsAccountModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('constructor effect should initialize selectedColor and images from draft', () => {
    draftSignal.set({
      profile: {
        accentColor: '#ff00ff',
        avatarUrl: 'https://example.com/avatar.png',
        bannerUrl: 'https://example.com/banner.png',
      },
    });

    createComponent();

    expect(component.selectedColor).toBe('#ff00ff');
    expect(component.avatarImageSrc).toBe('https://example.com/avatar.png');
    expect(component.bannerImageSrc).toBe('https://example.com/banner.png');
  });

  it('acc_edits should be empty when draft is null', () => {
    draftSignal.set(null);
    createComponent();

    const result = component.acc_edits();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('acc_edits should map displayName, username, email correctly when draft is present', () => {
    draftSignal.set({
      username: 'testuser',
      email: 'test@example.com',
      profile: {
        displayName: 'Tester',
      },
    });

    createComponent();
    const result = component.acc_edits();
    const byKey = (k: string) => result.find((c) => c.key === k)!;

    expect(byKey('displayName').value).toBe('Tester');
    expect(byKey('username').value).toBe('testuser');
    expect(byKey('email').value).toBe('test@example.com');
    expect(byKey('mobil').value).toBe('');
  });

  it('selectAccentColor should update selectedColor and call patchProfile', () => {
    createComponent();

    const color = '#ff0000';
    component.selectAccentColor(color);

    expect(component.selectedColor).toBe(color);
    expect(settingsStateMock.patchProfile).toHaveBeenCalledWith({ accentColor: color });
  });

  it('onAccentColorChange should update selectedColor and call patchProfile', () => {
    createComponent();

    const color = '#00ff00';
    component.onAccentColorChange(color);

    expect(component.selectedColor).toBe(color);
    expect(settingsStateMock.patchProfile).toHaveBeenCalledWith({ accentColor: color });
  });

  it('openPicker / closePicker should toggle isPickerOpen', () => {
    createComponent();

    expect(component.isPickerOpen).toBe(false);

    component.openPicker();
    expect(component.isPickerOpen).toBe(true);

    component.closePicker();
    expect(component.isPickerOpen).toBe(false);
  });

  it('openEdit should set activeControl, editValue and open modal', () => {
    createComponent();

    const control = {
      key: 'displayName',
      label: 'Display Name',
      value: 'Test',
      description: 'desc',
    };

    component.openEdit(control);

    expect(component.activeControl).toEqual(control);
    expect(component.editValue).toBe('Test');
    expect(component.isEditModalOpen).toBe(true);
  });

  it('closeEdit should reset modal state', () => {
    createComponent();

    const control = {
      key: 'username',
      label: 'Username',
      value: 'test',
      description: 'desc',
    };

    component.openEdit(control);
    component.closeEdit();

    expect(component.isEditModalOpen).toBe(false);
    expect(component.activeControl).toBeNull();
    expect(component.editValue).toBe('');
  });

  it('onEditInput should update editValue when target exists', () => {
    createComponent();

    const event = {
      target: { value: 'New Value' },
    } as unknown as Event;

    component.onEditInput(event);

    expect(component.editValue).toBe('New Value');
  });

  it('onEditInput should ignore event when target is null', () => {
    createComponent();

    const event = { target: null } as unknown as Event;

    component.editValue = 'Old';
    component.onEditInput(event);

    expect(component.editValue).toBe('Old');
  });

  it('saveEdit should patch displayName via patchProfile and close modal', () => {
    createComponent();

    const control = {
      key: 'displayName',
      label: 'Display Name',
      value: 'Old Name',
      description: '',
    };

    component.openEdit(control);
    component.editValue = 'New Name';

    component.saveEdit();

    expect(settingsStateMock.patchProfile).toHaveBeenCalledWith({ displayName: 'New Name' });
    expect(component.isEditModalOpen).toBe(false);
    expect(component.activeControl).toBeNull();
  });

  it('saveEdit should patch username via patchDraft', () => {
    createComponent();

    const control = {
      key: 'username',
      label: 'Username',
      value: 'olduser',
      description: '',
    };

    component.openEdit(control);
    component.editValue = 'newuser';

    component.saveEdit();

    expect(settingsStateMock.patchDraft).toHaveBeenCalledWith({ username: 'newuser' });
  });

  it('saveEdit should patch email via patchDraft', () => {
    createComponent();

    const control = {
      key: 'email',
      label: 'Email',
      value: 'old@example.com',
      description: '',
    };

    component.openEdit(control);
    component.editValue = 'new@example.com';

    component.saveEdit();

    expect(settingsStateMock.patchDraft).toHaveBeenCalledWith({ email: 'new@example.com' });
  });

  it('saveEdit should log for mobil key and still close modal', () => {
    createComponent();

    const control = {
      key: 'mobil',
      label: 'Mobile',
      value: '123',
      description: '',
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    component.openEdit(control);
    component.editValue = '456';
    component.saveEdit();

    expect(consoleSpy).toHaveBeenCalledWith('Not supported yet');
    expect(component.isEditModalOpen).toBe(false);
    expect(component.activeControl).toBeNull();
    consoleSpy.mockRestore();
  });

  it('saveEdit should return early when no activeControl', () => {
    createComponent();

    component.activeControl = null;
    component.editValue = 'something';

    component.saveEdit();
    expect(settingsStateMock.patchDraft).not.toHaveBeenCalled();
    expect(settingsStateMock.patchProfile).not.toHaveBeenCalled();
  });

  it('openAvatarModal should initialize avatar fields from draft', () => {
    draftSignal.set({
      profile: {
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    createComponent();

    component.openAvatarModal();

    expect(component.isAvatarModalOpen).toBe(true);
    expect(component.avatarImageSrc).toBe('https://example.com/avatar.png');
    expect(component.avatarTempSrc).toBe('https://example.com/avatar.png');
    expect(component.avatarUrlInput).toBe('https://example.com/avatar.png');
  });

  it('closeAvatarModal should reset avatar modal state', () => {
    createComponent();

    component.isAvatarModalOpen = true;
    component.avatarTempSrc = 'tmp';
    component.avatarUrlInput = 'url';

    component.closeAvatarModal();

    expect(component.isAvatarModalOpen).toBe(false);
    expect(component.avatarTempSrc).toBeNull();
    expect(component.avatarUrlInput).toBe('');
  });

  it('onAvatarFileSelected should use FileReader and set avatarTempSrc', () => {
    createComponent();

    const blob = new Blob(['avatar']);
    const event = {
      target: { files: [blob] },
    } as unknown as Event;

    component.onAvatarFileSelected(event);

    expect(component.avatarTempSrc).toBe('data:mock');
  });

  it('onAvatarFileSelected should do nothing when no files', () => {
    createComponent();

    const event = {
      target: { files: [] },
    } as unknown as Event;

    component.avatarTempSrc = 'before';
    component.onAvatarFileSelected(event);

    expect(component.avatarTempSrc).toBe('before');
  });

  it('applyAvatarUrl should set avatarTempSrc when url is non-empty', () => {
    createComponent();

    component.avatarUrlInput = '  https://img  ';

    component.applyAvatarUrl();

    expect(component.avatarTempSrc).toBe('https://img');
  });

  it('applyAvatarUrl should do nothing when url is empty', () => {
    createComponent();

    component.avatarTempSrc = 'old';
    component.avatarUrlInput = '   ';

    component.applyAvatarUrl();

    expect(component.avatarTempSrc).toBe('old');
  });

  it('saveAvatar should patch avatarUrl via patchProfile and close modal', () => {
    createComponent();

    component.avatarTempSrc = 'https://new-avatar';
    component.isAvatarModalOpen = true;

    component.saveAvatar();

    expect(component.avatarImageSrc).toBe('https://new-avatar');
    expect(settingsStateMock.patchProfile).toHaveBeenCalledWith({
      avatarUrl: 'https://new-avatar',
    });
    expect(component.isAvatarModalOpen).toBe(false);
  });

  it('removeAvatar should clear avatarImageSrc and patch empty avatarUrl', () => {
    createComponent();

    component.avatarImageSrc = 'https://avatar';

    component.removeAvatar();

    expect(component.avatarImageSrc).toBeNull();
    expect(settingsStateMock.patchProfile).toHaveBeenCalledWith({ avatarUrl: '' });
  });

  it('openBannerModal should initialize banner fields from draft', () => {
    draftSignal.set({
      profile: {
        bannerUrl: 'https://example.com/banner.png',
      },
    });

    createComponent();

    component.openBannerModal();

    expect(component.isBannerModalOpen).toBe(true);
    expect(component.bannerImageSrc).toBe('https://example.com/banner.png');
    expect(component.bannerTempSrc).toBe('https://example.com/banner.png');
    expect(component.bannerUrlInput).toBe('https://example.com/banner.png');
  });

  it('closeBannerModal should reset banner modal state', () => {
    createComponent();

    component.isBannerModalOpen = true;
    component.bannerTempSrc = 'tmp';
    component.bannerUrlInput = 'url';

    component.closeBannerModal();

    expect(component.isBannerModalOpen).toBe(false);
    expect(component.bannerTempSrc).toBeNull();
    expect(component.bannerUrlInput).toBe('');
  });

  it('onBannerFileSelected should use FileReader and set bannerTempSrc', () => {
    createComponent();

    const blob = new Blob(['banner']);
    const event = {
      target: { files: [blob] },
    } as unknown as Event;

    component.onBannerFileSelected(event);

    expect(component.bannerTempSrc).toBe('data:mock');
  });

  it('onBannerFileSelected should do nothing when no files', () => {
    createComponent();

    const event = {
      target: { files: [] },
    } as unknown as Event;

    component.bannerTempSrc = 'before';
    component.onBannerFileSelected(event);

    expect(component.bannerTempSrc).toBe('before');
  });

  it('applyBannerUrl should set bannerTempSrc when url is non-empty', () => {
    createComponent();

    component.bannerUrlInput = '  https://banner  ';

    component.applyBannerUrl();

    expect(component.bannerTempSrc).toBe('https://banner');
  });

  it('applyBannerUrl should do nothing when url is empty', () => {
    createComponent();

    component.bannerTempSrc = 'old';
    component.bannerUrlInput = '   ';

    component.applyBannerUrl();

    expect(component.bannerTempSrc).toBe('old');
  });

  it('saveBanner should patch bannerUrl via patchDraft and close modal', () => {
    createComponent();

    component.bannerTempSrc = 'https://new-banner';
    component.isBannerModalOpen = true;

    component.saveBanner();

    expect(component.bannerImageSrc).toBe('https://new-banner');
    expect(settingsStateMock.patchDraft).toHaveBeenCalledWith({
      profile: { bannerUrl: 'https://new-banner' },
    });
    expect(component.isBannerModalOpen).toBe(false);
  });

  it('removeBanner should clear bannerImageSrc and patch empty bannerUrl', () => {
    createComponent();

    component.bannerImageSrc = 'https://banner';

    component.removeBanner();

    expect(component.bannerImageSrc).toBeNull();
    expect(settingsStateMock.patchDraft).toHaveBeenCalledWith({
      profile: { bannerUrl: '' },
    });
  });

  it('displayName should default to "User" when no draft and no acc_edits value', () => {
    draftSignal.set(null);
    createComponent();

    expect((component as any).displayName).toBe('User');
    expect(component.displayInitial).toBe('U');
    expect(component.initialBackground.startsWith('hsl(')).toBe(true);
  });

  it('displayName should use profile.displayName and trim it', () => {
    draftSignal.set({
      username: 'x',
      email: 'y',
      profile: {
        displayName: '  Alice  ',
      },
    });

    createComponent();

    expect((component as any).displayName).toBe('Alice');
    expect(component.displayInitial).toBe('A');
  });

  it('displayName should fall back to "User" when displayName is only whitespace', () => {
    draftSignal.set({
      profile: {
        displayName: '   ',
      },
    });

    createComponent();

    expect((component as any).displayName).toBe('User');
    expect(component.displayInitial).toBe('U');
  });

  it('initialBackground should be deterministic for same name and directly cover generateColorFromName', () => {
    draftSignal.set({
      profile: {
        displayName: 'Deterministic User',
      },
    });

    createComponent();

    const color1 = component.initialBackground;
    const color2 = component.initialBackground;

    const directColor = (component as any).generateColorFromName('Deterministic User');

    expect(color1).toBe(color2);
    expect(color1.startsWith('hsl(')).toBe(true);
    expect(directColor.startsWith('hsl(')).toBe(true);
  });
});
