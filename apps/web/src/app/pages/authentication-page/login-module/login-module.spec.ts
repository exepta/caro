import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginModule } from './login-module';

describe('LoginModule', () => {
  let component: LoginModule;
  let fixture: ComponentFixture<LoginModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginModule);
    component = fixture.componentInstance;
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

  it('does not display error when email and password are provided', () => {
    component.email.set('user@example.com');
    component.password.set('password123');

    component.submit(new Event('submit'));

    expect(component.error()).toBe('');
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
