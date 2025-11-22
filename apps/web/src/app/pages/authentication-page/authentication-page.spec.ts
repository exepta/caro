import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthenticationPage } from './authentication-page';

describe('AuthenticationPage', () => {
  let component: AuthenticationPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AuthenticationPage, // standalone component
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(), // ersetzt HttpClientTestingModule
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthenticationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have "login" as default mode', () => {
    expect(component.mode()).toBe('login');
  });

  it('should allow switching mode to "register"', () => {
    component.mode.set('register');
    expect(component.mode()).toBe('register');
  });
});
