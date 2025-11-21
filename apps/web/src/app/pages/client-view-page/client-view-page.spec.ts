import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientViewPage } from './client-view-page';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';

describe('ClientViewPage', () => {
  let component: ClientViewPage;
  let fixture: ComponentFixture<ClientViewPage>;
  let router: Router;

  const authServiceMock = {
    logout: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientViewPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientViewPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.logout on logout()', () => {
    authServiceMock.logout.mockClear();

    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
  });

  it('should navigate to /settings on openSettings()', async () => {
    const navigateSpy = jest
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true as any);

    component.openSettings();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/settings');
  });
});
