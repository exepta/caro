import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UserSettingsService } from './user-settings.service';
import { UserInternalService, UserSettingsResponse } from '../api';
import { UserService } from './user.service';

if (typeof (globalThis as any).structuredClone === 'undefined') {
  (globalThis as any).structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value));
}

describe('UserSettingsService', () => {
  let service: UserSettingsService;

  const userSignal = signal<UserSettingsResponse | null>(null);

  const baseUser: UserSettingsResponse = {
    id: '123',
    username: 'TestUser',
    email: 'test@example.com',
    profile: {
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
      bannerUrl: 'https://example.com/banner.png',
      accentColor: '#ff00ff',
    },
  } as UserSettingsResponse;

  const updatedUser: UserSettingsResponse = {
    ...baseUser,
    username: 'UpdatedUser',
    profile: {
      ...baseUser.profile,
      displayName: 'Updated Display Name',
    },
  };

  const userApiMock = {
    updateCurrentUser: jest.fn(),
  };

  const userServiceMock = {
    user: userSignal.asReadonly(),
    updateUser: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserSettingsService,
        { provide: UserInternalService, useValue: userApiMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    });

    jest.clearAllMocks();
    userSignal.set(null);
    userApiMock.updateCurrentUser.mockReset();
    userServiceMock.updateUser.mockReset?.();

    service = TestBed.inject(UserSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.draft()).toBeNull();
    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges should be false when original is null', () => {
    userSignal.set(null);
    service.initFromUser(baseUser);

    expect(service.draft()).not.toBeNull();
    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges should be false when draft is null', () => {
    userSignal.set(baseUser);

    expect(service.draft()).toBeNull();
    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges should be false when original and draft are equal', () => {
    userSignal.set(baseUser);
    service.initFromCurrentUser();

    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges should be true when original and draft differ', () => {
    userSignal.set(baseUser);
    service.initFromCurrentUser();

    service.patchDraft({ username: 'ChangedName' });

    expect(service.hasUnsavedChanges()).toBe(true);
  });

  it('initFromCurrentUser should set draft when current user exists', () => {
    userSignal.set(baseUser);

    service.initFromCurrentUser();

    const draft = service.draft();
    expect(draft).not.toBeNull();
    expect(draft).toEqual(baseUser);
    expect(draft).not.toBe(baseUser);
  });

  it('initFromCurrentUser should do nothing when current user is null', () => {
    userSignal.set(null);

    service.initFromCurrentUser();

    expect(service.draft()).toBeNull();
  });

  it('initFromUser should set draft from given user', () => {
    const otherUser: UserSettingsResponse = {
      ...baseUser,
      username: 'OtherUser',
    };

    service.initFromUser(otherUser);

    const draft = service.draft();
    expect(draft).toEqual(otherUser);
    expect(draft).not.toBe(otherUser);
  });

  it('reset should re-init draft from current user', () => {
    userSignal.set(baseUser);
    service.initFromCurrentUser();

    service.patchDraft({ username: 'Changed' });
    expect(service.draft()!.username).toBe('Changed');

    service.reset();

    expect(service.draft()).toEqual(baseUser);
  });

  it('save should throw when there is no draft', () => {
    expect(service.draft()).toBeNull();

    expect(() => service.save()).toThrow('No draft to save');
    expect(userApiMock.updateCurrentUser).not.toHaveBeenCalled();
  });

  it('save should update userService and draft on success', (done) => {
    service.initFromUser(baseUser);
    userApiMock.updateCurrentUser.mockReturnValue(of(updatedUser));

    service.save().subscribe({
      next: (result) => {
        expect(userApiMock.updateCurrentUser).toHaveBeenCalledTimes(1);
        expect(userApiMock.updateCurrentUser).toHaveBeenCalledWith(baseUser);

        expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.updateUser).toHaveBeenCalledWith(updatedUser);

        expect(service.draft()).toEqual(updatedUser);
        expect(result).toEqual(updatedUser);
        done();
      },
      error: done.fail,
    });
  });

  it('save should propagate error from API', (done) => {
    const apiError = new Error('Update failed');
    service.initFromUser(baseUser);
    userApiMock.updateCurrentUser.mockReturnValue(throwError(() => apiError));

    service.save().subscribe({
      next: () => done.fail('Expected error, but got success'),
      error: (err) => {
        expect(err).toBe(apiError);
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('patchDraft should do nothing when no draft exists', () => {
    expect(service.draft()).toBeNull();

    service.patchDraft({ username: 'NoEffect' });

    expect(service.draft()).toBeNull();
  });

  it('patchDraft should merge root fields and profile fields (with existing profile)', () => {
    service.initFromUser(baseUser);

    service.patchDraft({
      email: 'new@example.com',
      profile: {
        displayName: 'New Name',
        accentColor: '#000000',
      },
    });

    const draft = service.draft()!;
    expect(draft.email).toBe('new@example.com');
    expect(draft.profile).toEqual({
      ...baseUser.profile,
      displayName: 'New Name',
      accentColor: '#000000',
    });
  });

  it('patchDraft should handle current.profile === undefined', () => {
    const noProfileUser: UserSettingsResponse = {
      id: '456',
      username: 'NoProfile',
      email: 'no-profile@example.com',
      profile: undefined,
    } as UserSettingsResponse;

    service.initFromUser(noProfileUser);

    service.patchDraft({
      profile: {
        displayName: 'FromScratch',
        avatarUrl: 'https://x/y.png',
      },
    });

    const draft = service.draft()!;
    expect(draft.profile).toEqual({
      displayName: 'FromScratch',
      avatarUrl: 'https://x/y.png',
    });
  });

  it('patchDraft should handle partial.profile === undefined (nur Root-Felder)', () => {
    service.initFromUser(baseUser);

    service.patchDraft({
      username: 'RootOnlyChange',
    });

    const draft = service.draft()!;
    expect(draft.username).toBe('RootOnlyChange');
    expect(draft.profile).toEqual(baseUser.profile);
  });

  it('patchProfile should do nothing when no draft exists', () => {
    expect(service.draft()).toBeNull();

    service.patchProfile({
      displayName: 'NoEffect',
    });

    expect(service.draft()).toBeNull();
  });

  it('patchProfile should merge into existing profile', () => {
    service.initFromUser(baseUser);

    service.patchProfile({
      displayName: 'ProfileOnlyChange',
      bannerUrl: 'https://changed/banner.png',
    });

    const draft = service.draft()!;
    expect(draft.username).toBe(baseUser.username);
    expect(draft.profile).toEqual({
      ...baseUser.profile,
      displayName: 'ProfileOnlyChange',
      bannerUrl: 'https://changed/banner.png',
    });
  });

  it('patchProfile should create profile when it was undefined', () => {
    const userWithoutProfile: UserSettingsResponse = {
      id: '789',
      username: 'NoProfileUser',
      email: 'noprof@example.com',
      profile: undefined,
    } as UserSettingsResponse;

    service.initFromUser(userWithoutProfile);

    service.patchProfile({
      displayName: 'CreatedProfile',
      accentColor: '#123456',
    });

    const draft = service.draft()!;
    expect(draft.profile).toEqual({
      displayName: 'CreatedProfile',
      accentColor: '#123456',
    });
  });
});
