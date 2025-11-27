import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authRedirectGuard } from './auth-redirect-guard';
import { AuthService } from '../services/auth/auth.service';

describe('authRedirectGuard', () => {
  const executeGuard = (...guardParameters: Parameters<typeof authRedirectGuard>) =>
    TestBed.runInInjectionContext(() =>
      authRedirectGuard(...guardParameters),
    );

  let router: Router;
  let authServiceMock: { isAuthenticated: jest.Mock<boolean, []> };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should be defined', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow activation when user is NOT authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBe(true);
  });

  it('should redirect to /client when user IS authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBeInstanceOf(Object);
    const url = router.serializeUrl(result as any);

    expect(url).toBe('/client');
  });
});

