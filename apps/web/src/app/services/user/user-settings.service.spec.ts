import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserSettingsService } from './user-settings.service';
import { UserService } from './user.service';
import { UserInternalService, UserSettingsResponse } from '../../api';

if (typeof (globalThis as any).structuredClone !== 'function') {
  (globalThis as any).structuredClone = (val: any) =>
    JSON.parse(JSON.stringify(val));
}

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let userServiceMock: {
    user: jest.Mock<UserSettingsResponse | null, []>;
    updateUser: jest.Mock<void, [UserSettingsResponse]>;
  };
  let apiMock: {
    updateCurrentUser: jest.Mock<any, [UserSettingsResponse]>;
  };

  function createUser(partial: Partial<UserSettingsResponse>): UserSettingsResponse {
    return {
      id: 'user-id',
      username: 'testuser',
      email: 'test@example.com',
      profile: {
        displayName: 'Tester',
        avatarUrl: 'https://avatar',
        bannerUrl: 'https://banner',
        accentColor: '#ffffff',
        ...(partial.profile ?? {}),
      },
      ...partial,
    } as unknown as UserSettingsResponse;
  }

  function setup(initialUser: UserSettingsResponse | null = null) {
    userServiceMock = {
      user: jest.fn(() => initialUser),
      updateUser: jest.fn(),
    };

    apiMock = {
      updateCurrentUser: jest.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UserSettingsService,
        { provide: UserService, useValue: userServiceMock },
        { provide: UserInternalService, useValue: apiMock },
      ],
    });

    service = TestBed.inject(UserSettingsService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    setup();
    expect(service).toBeTruthy();
  });

  it('initFromCurrentUser should initialize draft from current user when available', () => {
    const original = createUser({ username: 'original' });

    setup(original);

    service.initFromCurrentUser();

    const draft = service.draft();
    expect(draft).toEqual(original);
    expect(draft).not.toBe(original);
  });

  it('constructor effect should NOT initialize draft when no current user', () => {
    setup(null);

    expect(service.draft()).toBeNull();
  });

  it('currentUser should return UserService.user()', () => {
    const original = createUser({ username: 'original' });
    setup(original);

    expect(service.currentUser()).toEqual(original);
  });

  it('initFromCurrentUser should copy current user into draft', () => {
    const original = createUser({ username: 'original' });
    setup(original);

    service.initFromCurrentUser();

    const draft = service.draft();
    expect(draft).toEqual(original);
    expect(draft).not.toBe(original);
  });

  it('initFromCurrentUser should do nothing when no current user', () => {
    setup(null);

    service.initFromCurrentUser();

    expect(service.draft()).toBeNull();
  });

  it('initFromUser should set draft from given user', () => {
    setup(null);
    const user = createUser({ username: 'from-init' });

    service.initFromUser(user);

    const draft = service.draft();
    expect(draft).toEqual(user);
    expect(draft).not.toBe(user);
  });

  it('currentProfile should return draft.profile when draft has profile', () => {
    const original = createUser({ username: 'original' });
    setup(original);

    const draftUser = createUser({
      username: 'draft-user',
      profile: {
        displayName: 'Draft Name',
        avatarUrl: 'https://draft-avatar',
        bannerUrl: 'https://draft-banner',
        accentColor: '#ff0000',
      },
    });

    service.initFromUser(draftUser);

    const profile = service.currentProfile();
    expect(profile).toEqual(draftUser.profile);
  });

  it('currentProfile should fallback to currentUser.profile when draft has no profile', () => {
    const original = createUser({
      profile: {
        displayName: 'Profile Name',
        avatarUrl: 'https://avatar',
        bannerUrl: 'https://banner',
        accentColor: '#00ff00',
      },
    });

    setup(original);

    const profile = service.currentProfile();
    expect(profile).toEqual(original.profile);
  });

  it('currentProfile should return null when neither draft nor current user have profile', () => {
    const original = { ...createUser({}), profile: null as any };
    setup(original as any);

    const profile = service.currentProfile();
    expect(profile).toBeNull();
  });

  it('avatarUrl should return profile.avatarUrl or null', () => {
    const original = createUser({
      profile: {
        displayName: 'X',
        avatarUrl: 'https://avatar-url',
        bannerUrl: '',
        accentColor: '#fff',
      },
    });
    setup(original);

    expect(service.avatarUrl()).toBe('https://avatar-url');

    const noAvatarUser = createUser({
      profile: {
        displayName: 'X',
        avatarUrl: undefined as any,
        bannerUrl: '',
        accentColor: '#fff',
      },
    });
    setup(noAvatarUser);

    expect(service.avatarUrl()).toBeNull();
  });

  it('displayName should prefer profile.displayName, then username, then null', () => {
    const userWithProfile = createUser({
      username: 'user1',
      profile: {
        displayName: 'Profile Name',
        avatarUrl: '',
        bannerUrl: '',
        accentColor: '#fff',
      },
    });
    setup(userWithProfile);
    expect(service.displayName()).toBe('Profile Name');

    const userWithoutProfile = createUser({
      username: 'userWithoutProfile',
      profile: null as any,
    });
    setup(userWithoutProfile);
    expect(service.displayName()).toBe('userWithoutProfile');

    const noUser = null;
    setup(noUser);
    expect(service.displayName()).toBeNull();
  });

  it('hasUnsavedChanges should be false when original is null', () => {
    setup(null);
    service.initFromUser(createUser({ username: 'draft' }));

    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges should be false when draft is null', () => {
    const original = createUser({ username: 'original' });
    setup(original);

    (service as any).draftState.set(null);

    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges should be false when draft equals original', () => {
    const original = createUser({ username: 'original' });
    setup(original);

    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges should be true when draft differs from original', () => {
    const original = createUser({ username: 'original' });
    setup(original);

    const modified = createUser({ username: 'modified' });
    service.initFromUser(modified);

    expect(service.hasUnsavedChanges()).toBe(true);
  });

  it('save should throw when no draft exists', () => {
    setup(null);

    // draft ist null
    expect(() => service.save()).toThrow('No draft to save');
  });

  it('save should call api.updateCurrentUser, update userService and update draft', () => {
    const original = createUser({ username: 'original' });
    setup(original);

    const draft = createUser({ username: 'draft-user' });
    service.initFromUser(draft);

    const updated = createUser({ username: 'updated-user' });
    apiMock.updateCurrentUser.mockReturnValue(of(updated));

    let result: UserSettingsResponse | undefined;

    service.save().subscribe((value) => {
      result = value;
    });

    expect(apiMock.updateCurrentUser).toHaveBeenCalledTimes(1);
    expect(apiMock.updateCurrentUser).toHaveBeenCalledWith(draft);

    expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
    expect(userServiceMock.updateUser).toHaveBeenCalledWith(updated);

    expect(service.draft()).toEqual(updated);
    expect(result).toEqual(updated);
  });

  it('patchDraft should merge top-level and profile fields into existing draft', () => {
    const original = createUser({
      username: 'original',
      profile: {
        displayName: 'Orig Name',
        avatarUrl: 'https://orig-avatar',
        bannerUrl: 'https://orig-banner',
        accentColor: '#111111',
      },
    });
    setup(original);

    const draft = createUser({
      username: 'draft',
      profile: {
        displayName: 'Draft Name',
        avatarUrl: 'https://draft-avatar',
        bannerUrl: 'https://draft-banner',
        accentColor: '#222222',
      },
    });
    service.initFromUser(draft);

    service.patchDraft({
      username: 'patched-user',
      profile: {
        avatarUrl: 'https://patched-avatar',
      } as any,
    });

    const result = service.draft()!;
    expect(result.username).toBe('patched-user');
    expect(result.email).toBe(draft.email);
    expect(result.profile!.displayName).toBe('Draft Name');
    expect(result.profile!.avatarUrl).toBe('https://patched-avatar');
    expect(result.profile!.accentColor).toBe('#222222');
  });

  it('patchDraft should do nothing when no draft', () => {
    setup(null);

    service.patchDraft({ username: 'x' });

    expect(service.draft()).toBeNull();
  });

  it('patchProfile should merge into existing profile', () => {
    const draft = createUser({
      profile: {
        displayName: 'Draft Name',
        avatarUrl: 'https://avatar',
        bannerUrl: 'https://banner',
        accentColor: '#abcdef',
      },
    });
    setup(null);
    service.initFromUser(draft);

    service.patchProfile({
      avatarUrl: 'https://new-avatar',
    });

    const result = service.draft()!;
    expect(result.profile!.displayName).toBe('Draft Name');
    expect(result.profile!.avatarUrl).toBe('https://new-avatar');
    expect(result.profile!.accentColor).toBe('#abcdef');
  });

  it('patchProfile should create profile when none exists on draft', () => {
    const draft = {
      ...createUser({}),
      profile: null as any,
    } as UserSettingsResponse;

    setup(null);
    service.initFromUser(draft);

    service.patchProfile({
      avatarUrl: 'https://created-avatar',
    });

    const result = service.draft()!;
    expect(result.profile).toBeTruthy();
    expect(result.profile!.avatarUrl).toBe('https://created-avatar');
  });

  it('patchProfile should do nothing when no draft', () => {
    setup(null);

    service.patchProfile({ avatarUrl: 'x' });

    expect(service.draft()).toBeNull();
  });
});
