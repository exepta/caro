import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TokenService } from './services/auth/token.service';
import { UserService } from './services/user/user.service';
import { UserSettingsService } from './services/user/user-settings.service';

describe('App root component', () => {
  let tokenServiceMock: jest.Mocked<TokenService>;
  let userServiceMock: jest.Mocked<UserService>;
  let userSettingsServiceMock: jest.Mocked<UserSettingsService>;

  beforeEach(() => {
    tokenServiceMock = {
      getAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      storeTokens: jest.fn(),
      clear: jest.fn(),
      hasTokens: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    userServiceMock = {
      loadCurrentUser: jest.fn(),
      clearUser: jest.fn(),
      updateUser: jest.fn(),
      user: jest.fn().mockReturnValue(null),
      loading: jest.fn().mockReturnValue(false),
      error: jest.fn().mockReturnValue(null),
      isLoggedIn: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<UserService>;

    userSettingsServiceMock = {
      initFromUser: jest.fn(),
      initFromCurrentUser: jest.fn(),
      reset: jest.fn(),
      save: jest.fn(),
      patchDraft: jest.fn(),
      patchProfile: jest.fn(),
      hasUnsavedChanges: jest.fn().mockReturnValue(false),
      draft: jest.fn().mockReturnValue(null),
    } as unknown as jest.Mocked<UserSettingsService>;

    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: UserSettingsService, useValue: userSettingsServiceMock },
      ],
    });
  });

  it('should not call loadCurrentUser when there is no access token', () => {
    tokenServiceMock.getAccessToken.mockReturnValue(null);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(tokenServiceMock.getAccessToken).toHaveBeenCalledTimes(1);
    expect(userServiceMock.loadCurrentUser).not.toHaveBeenCalled();
  });

  it('should call loadCurrentUser when an access token exists', () => {
    tokenServiceMock.getAccessToken.mockReturnValue('dummy-access-token');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(tokenServiceMock.getAccessToken).toHaveBeenCalledTimes(1);
    expect(userServiceMock.loadCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should initialize UserSettingsService with current user from UserService', () => {
    const fakeUser = {
      id: '123',
      username: 'dev',
      email: 'dev@example.com',
    } as any;

    userServiceMock.user.mockReturnValue(fakeUser);
    tokenServiceMock.getAccessToken.mockReturnValue('dummy-access-token');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(userServiceMock.loadCurrentUser).toHaveBeenCalledTimes(1);

    expect(userSettingsServiceMock.initFromUser).toHaveBeenCalledWith(fakeUser);
    expect(userSettingsServiceMock.initFromUser).toHaveBeenCalledTimes(1);
  });
});
