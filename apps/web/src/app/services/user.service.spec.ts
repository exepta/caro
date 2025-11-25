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
      getUserById: jest.fn(),
      getUserByUsername: jest.fn(),
      searchUsersByUsername: jest.fn(),
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

  it('currentUser should delegate to userApi.getCurrentUser()', (done) => {
    userApiMock.getCurrentUser.mockReturnValue(of(mockUser));

    service.currentUser().subscribe((user) => {
      expect(userApiMock.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(user).toEqual(mockUser);
      done();
    });
  });

  it('getUserById should delegate to userApi.getUserById()', (done) => {
    const id = 'abc-123';
    const byIdUser: UserSettingsResponse = {
      id,
      username: 'ByIdUser',
      email: 'byid@example.com',
    } as UserSettingsResponse;

    userApiMock.getUserById.mockReturnValue(of(byIdUser));

    service.getUserById(id).subscribe((user) => {
      expect(userApiMock.getUserById).toHaveBeenCalledTimes(1);
      expect(userApiMock.getUserById).toHaveBeenCalledWith(id);
      expect(user).toEqual(byIdUser);
      done();
    });
  });

  it('getUserByUsername should delegate to userApi.getUserByUsername()', (done) => {
    const username = 'someone';
    const byNameUser: UserSettingsResponse = {
      id: 'u-1',
      username,
      email: 'name@example.com',
    } as UserSettingsResponse;

    userApiMock.getUserByUsername.mockReturnValue(of(byNameUser));

    service.getUserByUsername(username).subscribe((user) => {
      expect(userApiMock.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(userApiMock.getUserByUsername).toHaveBeenCalledWith(username);
      expect(user).toEqual(byNameUser);
      done();
    });
  });

  it('searchUsersByUsername should delegate to userApi.searchUsersByUsername()', (done) => {
    const term = 'test';
    const list: UserSettingsResponse[] = [
      { id: '1', username: 'test1' } as UserSettingsResponse,
      { id: '2', username: 'test2' } as UserSettingsResponse,
    ];

    userApiMock.searchUsersByUsername.mockReturnValue(of(list));

    service.searchUsersByUsername(term).subscribe((users) => {
      expect(userApiMock.searchUsersByUsername).toHaveBeenCalledTimes(1);
      expect(userApiMock.searchUsersByUsername).toHaveBeenCalledWith(term);
      expect(users).toEqual(list);
      done();
    });
  });
});
