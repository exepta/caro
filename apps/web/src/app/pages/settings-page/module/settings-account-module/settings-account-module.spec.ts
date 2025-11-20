import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsAccountModule } from './settings-account-module';

describe('SettingsAccountModule', () => {
  let component: SettingsAccountModule;
  let fixture: ComponentFixture<SettingsAccountModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsAccountModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsAccountModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
