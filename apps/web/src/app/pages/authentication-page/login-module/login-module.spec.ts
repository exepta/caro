import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginModule } from './login-module';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';

describe('LoginModule', () => {
  let component: LoginModule;

  const authServiceMock = {
    login: jest.fn(),
  };

  const userServiceMock = {
    loadCurrentUser: jest.fn(),
  };

  const routerMock = {
    navigateByUrl: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginModule);
    component = fixture.componentInstance;

    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty initial signals', () => {
    expect(component.email()).toBe('');
    expect(component.password()).toBe('');
    expect(component.error()).toBe('');
  });

  it('onEmailInput should update email signal', () => {
    const event = {
      target: { value: 'test@example.com' },
    } as unknown as Event;

    component.onEmailInput(event);

    expect(component.email()).toBe('test@example.com');
  });

  it('onEmailInput should ignore event without target', () => {
    const event = { target: null } as unknown as Event;

    component.onEmailInput(event);

    expect(component.email()).toBe('');
  });

  it('onPasswordInput should update password signal', () => {
    const event = {
      target: { value: 'superSecret' },
    } as unknown as Event;

    component.onPasswordInput(event);

    expect(component.password()).toBe('superSecret');
  });

  it('onPasswordInput should ignore event without target', () => {
    const event = { target: null } as unknown as Event;

    component.onPasswordInput(event);

    expect(component.password()).toBe('');
  });

  it('submit should set error when credentials are missing and not call authService', () => {
    const preventDefault = jest.fn();
    const event = { preventDefault } as unknown as Event;

    component.submit(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(component.error()).toBe('Missing credentials');
    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(userServiceMock.loadCurrentUser).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('submit should call authService.login with correct payload on valid credentials', () => {
    const preventDefault = jest.fn();
    const event = { preventDefault } as unknown as Event;

    component.email.set('test@example.com');
    component.password.set('secret');

    authServiceMock.login.mockReturnValue(of({ accessToken: 'abc' }));

    component.submit(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(authServiceMock.login).toHaveBeenCalledTimes(1);
    expect(authServiceMock.login).toHaveBeenCalledWith({
      emailOrUsername: 'test@example.com',
      password: 'secret',
    });
  });

  it('submit success flow should clear credentials, load user and navigate', () => {
    const preventDefault = jest.fn();
    const event = { preventDefault } as unknown as Event;

    component.email.set('test@example.com');
    component.password.set('secret');

    authServiceMock.login.mockReturnValue(of({ accessToken: 'abc' }));

    component.submit(event);

    expect(component.email()).toBe('');
    expect(component.password()).toBe('');
    expect(component.error()).toBe('');

    // User laden
    expect(userServiceMock.loadCurrentUser).toHaveBeenCalledTimes(1);

    // Navigation
    expect(routerMock.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/client');
  });

  it('submit error flow should set error from backend if available', () => {
    const preventDefault = jest.fn();
    const event = { preventDefault } as unknown as Event;

    component.email.set('test@example.com');
    component.password.set('secret');

    authServiceMock.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );

    component.submit(event);

    expect(component.error()).toBe('Invalid credentials');
    expect(userServiceMock.loadCurrentUser).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('submit error flow should fallback to "Login failed" when error message missing', () => {
    const preventDefault = jest.fn();
    const event = { preventDefault } as unknown as Event;

    component.email.set('test@example.com');
    component.password.set('secret');

    authServiceMock.login.mockReturnValue(
      throwError(() => ({})),
    );

    component.submit(event);

    expect(component.error()).toBe('Login failed');
    expect(userServiceMock.loadCurrentUser).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });
});
