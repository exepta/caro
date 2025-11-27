import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { RegisterModule } from './register-module';
import { AuthService } from '../../../services/auth/auth.service';

class AuthServiceMock {
  register = jest.fn();
}

describe('RegisterModule', () => {
  let component: RegisterModule;
  let fixture: ComponentFixture<RegisterModule>;
  let authService: AuthServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterModule],
      providers: [{ provide: AuthService, useClass: AuthServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterModule);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as AuthServiceMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays error when fields are missing', () => {
    component.email.set('');
    component.username.set('');
    component.password.set('');

    component.submit(new Event('submit'));

    expect(component.error()).toBe('Missing fields');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('calls AuthService.register when all fields are provided', () => {
    component.email.set('test@example.com');
    component.username.set('testuser');
    component.password.set('password123');

    authService.register.mockReturnValue(
      of({ accessToken: 'access', refreshToken: 'refresh' } as any),
    );

    component.submit(new Event('submit'));

    expect(authService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    });
  });

  it('clears fields and leaves error empty on successful register', () => {
    component.email.set('test@example.com');
    component.username.set('testuser');
    component.password.set('password123');

    authService.register.mockReturnValue(
      of({ accessToken: 'access', refreshToken: 'refresh' } as any),
    );

    component.submit(new Event('submit'));

    expect(component.email()).toBe('');
    expect(component.username()).toBe('');
    expect(component.password()).toBe('');
    expect(component.error()).toBe('');
  });

  it('sets error signal when register fails with message', () => {
    component.email.set('test@example.com');
    component.username.set('testuser');
    component.password.set('password123');

    const httpError = { error: { message: 'User already exists' } };

    authService.register.mockReturnValue(throwError(() => httpError));

    component.submit(new Event('submit'));

    expect(component.error()).toBe('User already exists');
  });

  it('falls back to default error message when register fails without message', () => {
    component.email.set('test@example.com');
    component.username.set('testuser');
    component.password.set('password123');

    authService.register.mockReturnValue(throwError(() => ({})));

    component.submit(new Event('submit'));

    expect(component.error()).toBe('Register failed');
  });

  it('updates email signal on input', () => {
    const inputEvent = new Event('input');
    const inputElement = document.createElement('input');
    inputElement.value = 'newemail@example.com';
    Object.defineProperty(inputEvent, 'target', { value: inputElement });

    component.onEmailInput(inputEvent);

    expect(component.email()).toBe('newemail@example.com');
  });

  it('updates username signal on input', () => {
    const inputEvent = new Event('input');
    const inputElement = document.createElement('input');
    inputElement.value = 'newusername';
    Object.defineProperty(inputEvent, 'target', { value: inputElement });

    component.onUsernameInput(inputEvent);

    expect(component.username()).toBe('newusername');
  });

  it('updates password signal on input', () => {
    const inputEvent = new Event('input');
    const inputElement = document.createElement('input');
    inputElement.value = 'newpassword';
    Object.defineProperty(inputEvent, 'target', { value: inputElement });

    component.onPasswordInput(inputEvent);

    expect(component.password()).toBe('newpassword');
  });

  it('does not update email signal if input event has no target', () => {
    component.email.set('');
    const inputEvent = new Event('input');

    component.onEmailInput(inputEvent);

    expect(component.email()).toBe('');
  });

  it('does not update username signal if input event has no target', () => {
    component.username.set('');
    const inputEvent = new Event('input');

    component.onUsernameInput(inputEvent);

    expect(component.username()).toBe('');
  });

  it('does not update password signal if input event has no target', () => {
    component.password.set('');
    const inputEvent = new Event('input');

    component.onPasswordInput(inputEvent);

    expect(component.password()).toBe('');
  });
});
