import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ClientViewPage } from './client-view-page';
import { AuthService } from '../../services/auth.service';
import { UserSettingsService } from '../../services/user-settings.service';

describe('ClientViewPage', () => {
  let component: ClientViewPage;
  let router: jest.Mocked<Router>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const routerMock: Partial<jest.Mocked<Router>> = {
      navigateByUrl: jest.fn().mockResolvedValue(true),
    };

    const authServiceMock: Partial<jest.Mocked<AuthService>> = {
      logout: jest.fn(),
    };

    const userSettingsServiceMock: Partial<UserSettingsService> = {
      avatarUrl: (() => null) as any,
      displayName: (() => 'Test User') as any,
      initFromCurrentUser: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClientViewPage],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: UserSettingsService,
          useValue: userSettingsServiceMock as UserSettingsService,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ClientViewPage);
    component = fixture.componentInstance;

    router = TestBed.inject(Router) as jest.Mocked<Router>;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('openSettings should navigate to /settings', () => {
    component.openSettings();

    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/settings');
  });

  it('logout should call AuthService.logout', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
