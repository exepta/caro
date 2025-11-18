import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { LoginModule } from './login-module';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

class AuthServiceMock {
  login = jest.fn();
}

describe('LoginModule', () => {
  let component: LoginModule;
  let fixture: ComponentFixture<LoginModule>;
  let authService: AuthServiceMock;
  let router: { navigateByUrl: jest.Mock<Promise<boolean>, [string]> };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginModule],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock },
        {
          provide: Router,
          useValue: {
            navigateByUrl: jest.fn().mockResolvedValue(true),
          } as Partial<Router>,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginModule);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as AuthServiceMock;
    router = TestBed.inject(Router) as unknown as {
      navigateByUrl: jest.Mock<Promise<boolean>, [string]>;
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays error when email or password is missing', () => {
    component.email.set('');
    component.password.set('');

    component.submit(new Event('submit'));

    expect(component.error()).toBe('Missing credentials');
  });

  it('calls AuthService.login when email and password are provided', () => {
    component.email.set('user@example.com');
    component.password.set('password123');

    authService.login.mockReturnValue(
      of({ accessToken: 'access', refreshToken: 'refresh' } as any),
    );

    component.submit(new Event('submit'));

    expect(authService.login).toHaveBeenCalledWith({
      emailOrUsername: 'user@example.com',
      password: 'password123',
    });
  });

  it('clears email and password on successful login, keeps error empty and navigates to /client', () => {
    component.email.set('user@example.com');
    component.password.set('password123');

    authService.login.mockReturnValue(
      of({ accessToken: 'access', refreshToken: 'refresh' } as any),
    );

    component.submit(new Event('submit'));

    expect(component.email()).toBe('');
    expect(component.password()).toBe('');
    expect(component.error()).toBe('');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/client');
  });

  it('sets error signal when login fails', () => {
    component.email.set('user@example.com');
    component.password.set('password123');

    const httpError = {
      error: { message: 'Invalid credentials' },
    };

    authService.login.mockReturnValue(throwError(() => httpError));

    component.submit(new Event('submit'));

    expect(component.error()).toBe('Invalid credentials');
  });

  it('falls back to default error message when login fails without message', () => {
    component.email.set('user@example.com');
    component.password.set('password123');

    authService.login.mockReturnValue(throwError(() => ({})));

    component.submit(new Event('submit'));

    expect(component.error()).toBe('Login failed');
  });

  it('updates email signal on valid input', () => {
    const inputEvent = new Event('input');
    const inputElement = document.createElement('input');
    inputElement.value = 'test@example.com';
    Object.defineProperty(inputEvent, 'target', { value: inputElement });

    component.onEmailInput(inputEvent);

    expect(component.email()).toBe('test@example.com');
  });

  it('updates password signal on valid input', () => {
    const inputEvent = new Event('input');
    const inputElement = document.createElement('input');
    inputElement.value = 'securepassword';
    Object.defineProperty(inputEvent, 'target', { value: inputElement });

    component.onPasswordInput(inputEvent);

    expect(component.password()).toBe('securepassword');
  });

  it('does not update email signal if input event has no target', () => {
    const inputEvent = new Event('input');

    component.onEmailInput(inputEvent);

    expect(component.email()).toBe('');
  });

  it('does not update password signal if input event has no target', () => {
    const inputEvent = new Event('input');

    component.onPasswordInput(inputEvent);

    expect(component.password()).toBe('');
  });
});
