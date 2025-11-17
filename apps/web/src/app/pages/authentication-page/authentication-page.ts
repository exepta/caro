import {Component, signal} from '@angular/core';
import {LoginModule} from './login-module/login-module';
import {RegisterModule} from './register-module/register-module';

@Component({
  selector: 'app-authentication-page',
  imports: [
    LoginModule,
    RegisterModule
  ],
  templateUrl: './authentication-page.html',
  styleUrl: './authentication-page.scss',
})
export class AuthenticationPage {
  mode = signal<'login' | 'register'>('login');
}
