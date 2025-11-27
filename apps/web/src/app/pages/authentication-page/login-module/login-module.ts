import {Component, inject, signal} from '@angular/core';
import {AuthService} from '../../../services/auth/auth.service';
import {Router} from '@angular/router';
import {UserService} from '../../../services/user/user.service';

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

  private authService: AuthService = inject(AuthService);
  private readonly userService = inject(UserService);
  private router = inject(Router);

  submit(e: Event) {
    e.preventDefault();

    if (!this.email() || !this.password()) {
      this.error.set('Missing credentials');
      return;
    }

    this.authService.login({ emailOrUsername: this.email(), password: this.password() })
      .subscribe({
        next: (response) => {
          console.log('Login success:', response);
          this.email.set('');
          this.password.set('');

          this.userService.loadCurrentUser();

          void this.router.navigateByUrl('/client');
        },
        error: (error) => {
          console.error('Login error', error);
          this.error.set(error?.error?.message ?? 'Login failed');
        }
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
}
