import {Component, signal} from '@angular/core';

@Component({
  selector: 'app-login-module',
  imports: [],
  templateUrl: './login-module.html',
  styleUrls: ['./login-module.scss', '../../../shared/styles/auth.scss'],
})
export class LoginModule {
  email = signal('');
  password = signal('');
  error = signal('');

  submit(e: Event) {
    e.preventDefault();

    if (!this.email() || !this.password()) {
      this.error.set('Missing credentials');
      return;
    }

    console.log('Login payload:', {
      email: this.email(),
      password: this.password(),
    });
  }

  onEmailInput(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    this.email.set(target.value);
  }

  onPasswordInput(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    this.password.set(target.value);
  }

  protected readonly HTMLInputElement = HTMLInputElement;
}
