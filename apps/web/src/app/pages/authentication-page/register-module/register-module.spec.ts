import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterModule } from './register-module';

describe('RegisterModule', () => {
  let component: RegisterModule;
  let fixture: ComponentFixture<RegisterModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterModule);
    component = fixture.componentInstance;
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
  });

  it('does not display error when all fields are filled', () => {
    component.email.set('test@example.com');
    component.username.set('testuser');
    component.password.set('password123');

    component.submit(new Event('submit'));

    expect(component.error()).toBe('');
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

  it('logs register payload when all fields are provided', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    component.email.set('user@example.com');
    component.username.set('testuser');
    component.password.set('password123');

    component.submit(new Event('submit'));

    expect(logSpy).toHaveBeenCalledWith('Register payload:', {
      email: 'user@example.com',
      username: 'testuser',
      password: 'password123',
    });

    logSpy.mockRestore();
  });

});
