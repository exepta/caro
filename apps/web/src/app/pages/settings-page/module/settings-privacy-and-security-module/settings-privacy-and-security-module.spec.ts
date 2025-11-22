import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsPrivacyAndSecurityModule } from './settings-privacy-and-security-module';

describe('SettingsPrivacyAndSecurityModule', () => {
  let component: SettingsPrivacyAndSecurityModule;
  let fixture: ComponentFixture<SettingsPrivacyAndSecurityModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPrivacyAndSecurityModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPrivacyAndSecurityModule);
    component = fixture.componentInstance;
    fixture.detectChanges(); // initialer Render, ist okay
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize firstNameVisible and lastNameVisible as false', () => {
    expect(component.firstNameVisible).toBe(false);
    expect(component.lastNameVisible).toBe(false);
  });

  it('should allow toggling firstNameVisible (pure property)', () => {
    component.firstNameVisible = true;
    expect(component.firstNameVisible).toBe(true);

    component.firstNameVisible = false;
    expect(component.firstNameVisible).toBe(false);
  });

  it('should allow toggling lastNameVisible (pure property)', () => {
    component.lastNameVisible = true;
    expect(component.lastNameVisible).toBe(true);

    component.lastNameVisible = false;
    expect(component.lastNameVisible).toBe(false);
  });

  it('should render two app-switch-button elements', () => {
    const hostElem: HTMLElement = fixture.nativeElement;
    const switches = hostElem.querySelectorAll('app-switch-button');
    expect(switches.length).toBe(2);
  });
});
