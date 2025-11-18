import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthenticationPage } from './authentication-page';
import { AuthService } from '../../services/auth.service';

class AuthServiceMock {
  login = jest.fn();
  register = jest.fn();
}

describe('AuthenticationPage', () => {
  let component: AuthenticationPage;
  let fixture: ComponentFixture<AuthenticationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthenticationPage],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthenticationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
