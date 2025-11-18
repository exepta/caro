import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import {
  ApiModule,
  Configuration,
  RegisterRequest,
  LoginRequest,
  TokenResponse,
} from '../api';

describe('AuthService (generated)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ApiModule.forRoot(
          () =>
            new Configuration({
              basePath: 'http://localhost:8080',
            }),
        ),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call /api/auth/register with POST', () => {
    const payload: RegisterRequest = {
      email: 'dev@caro.net',
      username: 'dev',
      password: '123456',
    };

    const mockResponse: TokenResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    let result: TokenResponse | undefined;

    service.register(payload).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('should call /api/auth/login with POST', () => {
    const payload: LoginRequest = {
      emailOrUsername: 'dev@caro.net',
      password: '123456',
    };

    const mockResponse: TokenResponse = {
      accessToken: 'access-token-login',
      refreshToken: 'refresh-token-login',
    };

    let result: TokenResponse | undefined;

    service.login(payload).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });
});
