import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserService } from './user.service';
import { UserInternalService, UserSettingsResponse } from '../api';

describe('UserService', () => {
  let service: UserService;

  const mockUser: UserSettingsResponse = {
    id: '123',
    username: 'TestUser',
    email: 'test@example.com',
  } as UserSettingsResponse;

  const userApiMock = {
    getCurrentUser: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: UserInternalService, useValue: userApiMock },
      ],
    });

    service = TestBed.inject(UserService);
    jest.clearAllMocks();
  });

  it('should have correct initial state', () => {
    expect(service.user()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should load current user successfully', () => {
    userApiMock.getCurrentUser.mockImplementation(() => {
      expect(service.loading()).toBe(true);
      return of(mockUser);
    });

    service.loadCurrentUser();

    expect(userApiMock.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(service.user()).toEqual(mockUser);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should handle error when loading current user fails', () => {
    const error = new Error('Network error');

    userApiMock.getCurrentUser.mockImplementation(() => {
      expect(service.loading()).toBe(true);
      return throwError(() => error);
    });

    service.loadCurrentUser();

    expect(userApiMock.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(service.user()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('Cant load user settings.');
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should clear user and error on clearUser()', () => {
    service.updateUser(mockUser);
    (service as any).errorState.set('Some error');

    service.clearUser();

    expect(service.user()).toBeNull();
    expect(service.error()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should update user on updateUser()', () => {
    service.updateUser(mockUser);

    expect(service.user()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBe(true);
  });
});
