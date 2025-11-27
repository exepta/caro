import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, ReplaySubject, throwError } from 'rxjs';

import { AccessTokenInterceptor } from './access-token.interceptor-interceptor';
import { TokenService } from '../services/auth/token.service';
import { HttpClient } from '@angular/common/http';

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

describe('AccessTokenInterceptor', () => {
  let interceptor: AccessTokenInterceptor;

  const tokenServiceMock = {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    storeTokens: jest.fn(),
    clear: jest.fn(),
  };

  const httpClientMock = {
    post: jest.fn(),
  };

  const createHandler = () => {
    const handleMock = jest.fn();
    const handler: HttpHandler = {
      handle: handleMock as any,
    };
    return { handler, handleMock };
  };

  function expectInterceptError(
    req: HttpRequest<any>,
    handler: HttpHandler,
    expectedError: unknown,
    extraAsserts: () => void,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      interceptor.intercept(req, handler).subscribe({
        next: () => reject(new Error('Expected error, got next')),
        error: (err) => {
          try {
            expect(err).toBe(expectedError);
            extraAsserts();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
      });
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccessTokenInterceptor,
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: HttpClient, useValue: httpClientMock },
      ],
    });

    interceptor = TestBed.inject(AccessTokenInterceptor);

    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add Authorization header when access token is present and URL is not refresh', (done) => {
    tokenServiceMock.getAccessToken.mockReturnValue('access-123');

    const { handler, handleMock } = createHandler();

    handleMock.mockImplementation((req: HttpRequest<any>) => {
      expect(req.headers.get('Authorization')).toBe('Bearer access-123');
      return of(new HttpResponse({ status: 200, body: 'ok' }));
    });

    const req = new HttpRequest('GET', '/api/data');

    interceptor.intercept(req, handler).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          expect(event.status).toBe(200);
          expect(event.body).toBe('ok');
          done();
        }
      },
      error: done.fail,
    });
  });

  it('should NOT add Authorization header when no access token is present', (done) => {
    tokenServiceMock.getAccessToken.mockReturnValue(null);

    const { handler, handleMock } = createHandler();

    handleMock.mockImplementation((req: HttpRequest<any>) => {
      expect(req.headers.has('Authorization')).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    });

    const req = new HttpRequest('GET', '/api/data');

    interceptor.intercept(req, handler).subscribe({
      next: (event) => {
        if (event instanceof HttpResponse) {
          expect(event.status).toBe(200);
          done();
        }
      },
      error: done.fail,
    });
  });

  it('should NOT add Authorization header to refresh calls even if token is present', (done) => {
    tokenServiceMock.getAccessToken.mockReturnValue('access-123');

    const { handler, handleMock } = createHandler();

    handleMock.mockImplementation((req: HttpRequest<any>) => {
      expect(req.url.endsWith('/api/auth/refresh')).toBe(true);
      expect(req.headers.has('Authorization')).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    });

    const req = new HttpRequest('POST', '/api/auth/refresh', {});

    interceptor.intercept(req, handler).subscribe({
      next: (event) => {
        if (event instanceof HttpResponse) {
          expect(event.status).toBe(200);
          done();
        }
      },
      error: done.fail,
    });
  });

  it('should pass through non-401 errors without refresh logic', async () => {
    tokenServiceMock.getAccessToken.mockReturnValue('access-123');

    const { handler, handleMock } = createHandler();
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server error' });

    handleMock.mockImplementation(() => throwError(() => error));

    const req = new HttpRequest('GET', '/api/data');

    await expectInterceptError(req, handler, error, () => {
      expect(httpClientMock.post).not.toHaveBeenCalled();
      expect(tokenServiceMock.clear).not.toHaveBeenCalled();
    });
  });

  it('should not try refresh for 401 on refresh call itself', async () => {
    tokenServiceMock.getAccessToken.mockReturnValue('access-123');

    const { handler, handleMock } = createHandler();
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });

    handleMock.mockImplementation(() => throwError(() => error));

    const req = new HttpRequest('POST', '/api/auth/refresh', {});

    await expectInterceptError(req, handler, error, () => {
      expect(httpClientMock.post).not.toHaveBeenCalled();
      expect(tokenServiceMock.clear).not.toHaveBeenCalled();
    });
  });

  it('should clear tokens and rethrow when 401 and no refresh token is available', (done) => {
    tokenServiceMock.getAccessToken.mockReturnValue('access-123');
    tokenServiceMock.getRefreshToken.mockReturnValue(null);

    const { handler, handleMock } = createHandler();

    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });

    handleMock.mockImplementation(() => throwError(() => error));

    const req = new HttpRequest('GET', '/api/data');

    interceptor.intercept(req, handler).subscribe({
      next: () => done.fail('Expected error, got next'),
      error: (err) => {
        expect(err).toBe(error);
        expect(tokenServiceMock.clear).toHaveBeenCalledTimes(1);
        expect(httpClientMock.post).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should refresh token and retry original request on 401 with valid refresh token', (done) => {
    tokenServiceMock.getAccessToken.mockReturnValue('old-access');
    tokenServiceMock.getRefreshToken.mockReturnValue('refresh-123');

    const { handler, handleMock } = createHandler();

    const originalError = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
    });

    handleMock
      .mockImplementationOnce(() => throwError(() => originalError))
      .mockImplementationOnce((req: HttpRequest<any>) => {
        expect(req.headers.get('Authorization')).toBe('Bearer new-access');
        return of(new HttpResponse({ status: 200, body: 'ok-after-refresh' }));
      });

    httpClientMock.post.mockReturnValue(
      of<RefreshResponse>({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }),
    );

    const req = new HttpRequest('GET', '/api/data');

    interceptor.intercept(req, handler).subscribe({
      next: (event) => {
        if (event instanceof HttpResponse) {
          expect(event.status).toBe(200);
          expect(event.body).toBe('ok-after-refresh');

          expect(httpClientMock.post).toHaveBeenCalledTimes(1);
          expect(tokenServiceMock.storeTokens).toHaveBeenCalledWith(
            'new-access',
            'new-refresh',
          );

          done();
        }
      },
      error: done.fail,
    });
  });

  it('should clear tokens and error when refresh request fails', (done) => {
    tokenServiceMock.getAccessToken.mockReturnValue('old-access');
    tokenServiceMock.getRefreshToken.mockReturnValue('refresh-123');

    const { handler, handleMock } = createHandler();

    const originalError = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
    });

    const refreshError = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad refresh',
    });

    handleMock.mockImplementationOnce(() => throwError(() => originalError));

    httpClientMock.post.mockReturnValue(throwError(() => refreshError));

    const req = new HttpRequest('GET', '/api/data');

    interceptor.intercept(req, handler).subscribe({
      next: () => done.fail('Expected error, got next'),
      error: (err) => {
        expect(err).toBe(refreshError);
        expect(tokenServiceMock.clear).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });

  it('should queue concurrent 401 requests while refresh is in progress and retry with new token', (done) => {
    const anyInterceptor = interceptor as any;
    anyInterceptor.isRefreshing = true;

    const refreshSubject: ReplaySubject<string | null> = anyInterceptor.refreshSubject;
    refreshSubject.next('queued-access-token');

    tokenServiceMock.getAccessToken.mockReturnValue('old-access');

    const { handler, handleMock } = createHandler();

    const originalError = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
    });

    handleMock
      .mockImplementationOnce(() => throwError(() => originalError))
      .mockImplementationOnce((req: HttpRequest<any>) => {
        expect(req.headers.get('Authorization')).toBe(
          'Bearer queued-access-token',
        );
        return of(new HttpResponse({ status: 200, body: 'ok-queued' }));
      });

    const req = new HttpRequest('GET', '/api/data');

    interceptor.intercept(req, handler).subscribe({
      next: (event) => {
        if (event instanceof HttpResponse) {
          expect(event.status).toBe(200);
          expect(event.body).toBe('ok-queued');
          done();
        }
      },
      error: done.fail,
    });
  });
});
