import {Component, inject, signal} from '@angular/core';
import {AuthService} from '../../../services/auth.service';

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

  private authService: AuthService = inject(AuthService);

  submit(e: Event) {
    e.preventDefault();

    if (!this.email() || !this.username() || !this.password()) {
      this.error.set('Missing fields');
      return;
    }

    this.authService.register({ email: this.email(), username: this.username(), password: this.password() })
      .subscribe({
        next: (response) => {
          console.log('Register success:', response);
          this.email.set('');
          this.username.set('');
          this.password.set('');
        },
        error: (error) => {
          console.error('Register error:', error);
          this.error.set(error?.error?.message ?? 'Register failed');
        }
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
