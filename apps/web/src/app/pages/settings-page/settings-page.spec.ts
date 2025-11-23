import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { SettingsPage } from './settings-page';
import { SettingsPageType } from '../../types/settings-page-types';
import { UserSettingsService } from '../../services/user-settings.service';
import { AuthService } from '../../services/auth.service';
import { Location } from '@angular/common';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let component: SettingsPage;

  const draftSignal = signal<any>(null);

  const hasUnsavedChangesFn = jest.fn(() => false);

  const settingsStateMock: Partial<UserSettingsService> = {
    draft: draftSignal.asReadonly(),
    initFromCurrentUser: jest.fn(),
    hasUnsavedChanges: hasUnsavedChangesFn as any,
    save: jest.fn(() => of({} as any)),
    reset: jest.fn(),
    patchDraft: jest.fn(),
    patchProfile: jest.fn(),
  };

  const authServiceMock = {
    logout: jest.fn(),
  };

  const locationMock = {
    back: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { provide: UserSettingsService, useValue: settingsStateMock as UserSettingsService },
        { provide: AuthService, useValue: authServiceMock as unknown as AuthService },
        { provide: Location, useValue: locationMock as unknown as Location },
      ],
    }).compileComponents();

    jest.clearAllMocks();
    draftSignal.set(null);
    hasUnsavedChangesFn.mockReturnValue(false);

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and call initFromCurrentUser', () => {
    expect(component).toBeTruthy();
    expect(settingsStateMock.initFromCurrentUser).toHaveBeenCalled();
  });

  it('should set page on non-modal nav click (Account)', () => {
    const page = { type: SettingsPageType.Account, label: 'My Account', modal: false };

    component.onNavClick(page);

    expect(component.openPage()).toBe(SettingsPageType.Account);
    expect(component.showLogoutModal()).toBe(false);
  });

  it('should set page on non-modal nav click (Security)', () => {
    const page = { type: SettingsPageType.Security, label: 'Privacy & Security', modal: false };

    component.onNavClick(page);

    expect(component.openPage()).toBe(SettingsPageType.Security);
    expect(component.showLogoutModal()).toBe(false);
  });

  it('should do nothing for Split nav click', () => {
    component.openPage.set(SettingsPageType.Account);

    const page = { type: SettingsPageType.Split, label: '', modal: false };

    component.onNavClick(page);

    expect(component.openPage()).toBe(SettingsPageType.Account);
    expect(component.showLogoutModal()).toBe(false);
  });

  it('should open logout modal on Logout nav click', () => {
    const page = { type: SettingsPageType.Logout, label: 'Logout', modal: true };

    component.onNavClick(page);

    expect(component.showLogoutModal()).toBe(true);
  });

  it('goBack should NOT call location.back when hasUnsavedChanges is true', () => {
    hasUnsavedChangesFn.mockReturnValueOnce(true);

    component.goBack();

    expect(locationMock.back).not.toHaveBeenCalled();
  });

  it('goBack should call location.back when hasUnsavedChanges is false', () => {
    hasUnsavedChangesFn.mockReturnValueOnce(false);

    component.goBack();

    expect(locationMock.back).toHaveBeenCalledTimes(1);
  });

  it('onSave should call settingsState.save', () => {
    component.onSave();

    expect(settingsStateMock.save).toHaveBeenCalledTimes(1);
  });

  it('onRevoke should call settingsState.reset', () => {
    component.onRevoke();

    expect(settingsStateMock.reset).toHaveBeenCalledTimes(1);
  });

  it('hasUnsavedChanges should delegate to settingsState.hasUnsavedChanges', () => {
    hasUnsavedChangesFn.mockReturnValueOnce(true);

    const beforeCalls = hasUnsavedChangesFn.mock.calls.length;

    const result = component.hasUnsavedChanges();

    const afterCalls = hasUnsavedChangesFn.mock.calls.length;

    expect(afterCalls).toBe(beforeCalls + 1);
    expect(result).toBe(true);
  });

  it('currentPageLabel should return correct label for current page', () => {
    component.openPage.set(SettingsPageType.Security);

    const label = component.currentPageLabel();

    expect(label).toBe('Privacy & Security');
  });

  it('openLogoutModal and closeLogoutModal should toggle showLogoutModal', () => {
    expect(component.showLogoutModal()).toBe(false);

    component.openLogoutModal();
    expect(component.showLogoutModal()).toBe(true);

    component.closeLogoutModal();
    expect(component.showLogoutModal()).toBe(false);
  });

  it('confirmLogout should close modal and call authService.logout', () => {
    component.showLogoutModal.set(true);

    component.confirmLogout();

    expect(component.showLogoutModal()).toBe(false);
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
  });
});
