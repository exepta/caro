import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TokenService } from '../services/token.service';
import {
  Observable,
  ReplaySubject,
  throwError,
} from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import {environment} from '../../environment/environment';

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AccessTokenInterceptor implements HttpInterceptor {
  private tokenService = inject(TokenService);
  private http = inject(HttpClient);

  private readonly API_BASE_URL = environment.apiBaseUrl;

  private isRefreshing = false;
  private refreshSubject = new ReplaySubject<string | null>(1);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    let authReq = req;
    const accessToken = this.tokenService.getAccessToken();

    if (accessToken && !req.url.endsWith('/api/auth/refresh')) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        const isUnauthorized = err.status === 401;
        const isRefreshCall = req.url.endsWith('/api/auth/refresh');

        if (!isUnauthorized || isRefreshCall) {
          return throwError(() => err);
        }

        if (this.isRefreshing) {
          return this.refreshSubject.pipe(
            filter((token): token is string => token !== null),
            take(1),
            switchMap((token) => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`,
                },
              });
              return next.handle(retryReq);
            })
          );
        }

        this.isRefreshing = true;
        this.refreshSubject.next(null);

        const refreshToken = this.tokenService.getRefreshToken();
        if (!refreshToken) {
          this.tokenService.clear();
          return throwError(() => err);
        }

        return this.http
          .post<RefreshResponse>(`${this.API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          })
          .pipe(
            tap((res) => {
              const newAccess = res.accessToken;
              const newRefresh =
                res.refreshToken ??
                this.tokenService.getRefreshToken() ??
                '';

              this.tokenService.storeTokens(newAccess, newRefresh);
              this.refreshSubject.next(newAccess);
            }),
            switchMap((res) => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${res.accessToken}`,
                },
              });
              return next.handle(retryReq);
            }),
            catchError((refreshErr) => {
              this.tokenService.clear();
              this.refreshSubject.next(null);
              return throwError(() => refreshErr);
            }),
            finalize(() => {
              this.isRefreshing = false;
            })
          );
      })
    );
  }
}
