import {Component, signal} from '@angular/core';

@Component({
  selector: 'app-register-module',
  imports: [],
  templateUrl: './register-module.html',
  styleUrls: ['./register-module.scss', '../../../shared/styles/auth.scss'],
})
export class RegisterModule {
  email = signal('');
  username = signal('');
  password = signal('');
  error = signal('');

  submit(e: Event) {
    e.preventDefault();

    if (!this.email() || !this.username() || !this.password()) {
      this.error.set('Missing fields');
      return;
    }

    console.log('Register payload:', {
      email: this.email(),
      username: this.username(),
      password: this.password(),
    });
  }

  onEmailInput(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    this.email.set(target.value);
  }

  onUsernameInput(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    this.username.set(target.value);
  }

  onPasswordInput(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    this.password.set(target.value);
  }
}
