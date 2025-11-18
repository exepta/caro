import { Injectable } from '@angular/core';
import {InternalAuthService, LoginRequest, RegisterRequest} from '../api';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly authApi: InternalAuthService) {}

  register(data: RegisterRequest) {
    return this.authApi.register(data);
  }

  login(data: LoginRequest) {
    return this.authApi.login(data);
  }
}
