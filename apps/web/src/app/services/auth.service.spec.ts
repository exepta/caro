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
import { Router } from '@angular/router';

describe('AuthService (enhanced tests)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigateByUrl: jest.Mock<Promise<boolean>, [string]> };

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
        {
          provide: Router,
          useValue: {
            navigateByUrl: jest.fn().mockResolvedValue(true),
          } as Partial<Router>,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as unknown as {
      navigateByUrl: jest.Mock<Promise<boolean>, [string]>;
    };

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    service = TestBed.inject(AuthService);
    expect(service).toBeTruthy();
  });

  it('should call /api/auth/register with POST', () => {
    service = TestBed.inject(AuthService);

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
    service = TestBed.inject(AuthService);

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

  it('should store tokens in localStorage and set authenticated after login', () => {
    service = TestBed.inject(AuthService);

    const payload: LoginRequest = {
      emailOrUsername: 'dev@caro.net',
      password: '123456',
    };

    const mockResponse: TokenResponse = {
      accessToken: 'access-token-login',
      refreshToken: 'refresh-token-login',
    };

    expect(service.isAuthenticated()).toBeFalsy();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();

    service.login(payload).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush(mockResponse);

    expect(localStorage.getItem('accessToken')).toBe('access-token-login');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token-login');
    expect(service.isAuthenticated()).toBeTruthy();
  });

  it('should not store tokens when response tokens are null', () => {
    service = TestBed.inject(AuthService);

    const payload: LoginRequest = {
      emailOrUsername: 'dev@caro.net',
      password: '123456',
    };

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();

    const mockResponse = {
      accessToken: null,
      refreshToken: null,
    } as unknown as TokenResponse;

    service.login(payload).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush(mockResponse);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('should initialize state from localStorage if tokens exist', () => {
    localStorage.setItem('accessToken', 'stored-access-token');
    localStorage.setItem('refreshToken', 'stored-refresh-token');

    service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeTruthy();
  });

  it('should not be authenticated if localStorage is empty', () => {
    service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeFalsy();
  });

  it('logout should clear tokens and navigate to /auth', () => {
    service = TestBed.inject(AuthService);

    localStorage.setItem('accessToken', 'token');
    localStorage.setItem('refreshToken', 'ref');

    service.logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(service.isAuthenticated()).toBeFalsy();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth');
  });

  it('isAuthenticated should reflect authState changes', () => {
    service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeFalsy();

    const payload: LoginRequest = {
      emailOrUsername: 'dev@caro.net',
      password: '123456',
    };

    const mockResponse: TokenResponse = {
      accessToken: 'A',
      refreshToken: 'B',
    };

    service.login(payload).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBeTruthy();

    service.logout();

    expect(service.isAuthenticated()).toBeFalsy();
  });
});
