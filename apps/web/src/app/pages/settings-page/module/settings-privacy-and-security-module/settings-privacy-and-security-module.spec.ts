import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsPrivacyAndSecurityModule } from './settings-privacy-and-security-module';

describe('SettingsPrivacyAndSecurityModule', () => {
  let component: SettingsPrivacyAndSecurityModule;
  let fixture: ComponentFixture<SettingsPrivacyAndSecurityModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPrivacyAndSecurityModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsPrivacyAndSecurityModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
