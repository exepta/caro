import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: { isAuthenticated: jest.Mock<boolean, []> };
  let routerMock: { parseUrl: jest.Mock<UrlTree, [string]> };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: jest.fn(),
    };

    routerMock = {
      parseUrl: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should return true when user is authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(null as any, null as any),
    );

    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(routerMock.parseUrl).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return UrlTree to /auth when user is not authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);

    const urlTree = {} as UrlTree;
    routerMock.parseUrl.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(null as any, null as any),
    );

    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/auth');
    expect(result).toBe(urlTree);
  });
});
