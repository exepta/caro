import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Location } from '@angular/common';

import { SettingsPage } from './settings-page';
import { UserSettingsService } from '../../services/user-settings.service';
import { SettingsPageType } from '../../types/settings-page-types';

describe('SettingsPage', () => {
  let component: SettingsPage;

  const settingsStateMock = {
    initFromCurrentUser: jest.fn(),
    hasUnsavedChanges: jest.fn().mockReturnValue(false),
    save: jest.fn(),
    reset: jest.fn(),
  };

  const locationMock = {
    back: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { provide: UserSettingsService, useValue: settingsStateMock },
        { provide: Location, useValue: locationMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    jest.clearAllMocks();
    (settingsStateMock.hasUnsavedChanges as jest.Mock).mockReturnValue(false);

    const fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
  });

  it('should create and call initFromCurrentUser in constructor', () => {
    expect(component).toBeTruthy();
    expect(settingsStateMock.initFromCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should have Account as default openPage', () => {
    expect(component.openPage()).toBe(SettingsPageType.Account);
    expect(component.currentPageLabel()).toBe('My Account');
  });

  it('setPage should update openPage signal', () => {
    component.setPage(SettingsPageType.Security);

    expect(component.openPage()).toBe(SettingsPageType.Security);
    expect(component.currentPageLabel()).toBe('Privacy & Security');
  });

  it('goBack should not navigate when there are unsaved changes', () => {
    (settingsStateMock.hasUnsavedChanges as jest.Mock).mockReturnValue(true);

    component.goBack();

    expect(settingsStateMock.hasUnsavedChanges).toHaveBeenCalledTimes(1);
    expect(locationMock.back).not.toHaveBeenCalled();
  });

  it('goBack should navigate back when there are no unsaved changes', () => {
    (settingsStateMock.hasUnsavedChanges as jest.Mock).mockReturnValue(false);

    component.goBack();

    expect(settingsStateMock.hasUnsavedChanges).toHaveBeenCalledTimes(1);
    expect(locationMock.back).toHaveBeenCalledTimes(1);
  });

  it('onSave should call settingsState.save and subscribe (success path)', () => {
    (settingsStateMock.save as jest.Mock).mockReturnValue(of({}));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.onSave();

    expect(settingsStateMock.save).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('onSave should log error when save observable errors', () => {
    const error = new Error('save failed');
    (settingsStateMock.save as jest.Mock).mockReturnValue(
      throwError(() => error),
    );

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.onSave();

    expect(settingsStateMock.save).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toBe('Failed to save settings');

    consoleErrorSpy.mockRestore();
  });

  it('onRevoke should call settingsState.reset', () => {
    component.onRevoke();

    expect(settingsStateMock.reset).toHaveBeenCalledTimes(1);
  });

  it('hasUnsavedChanges should delegate to settingsState.hasUnsavedChanges', () => {
    (settingsStateMock.hasUnsavedChanges as jest.Mock).mockReturnValue(true);

    const result = component.hasUnsavedChanges();

    expect(settingsStateMock.hasUnsavedChanges).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('currentPageLabel should return empty string for unknown page type', () => {
    // @ts-ignore
    component.openPage.set(999);

    const label = component.currentPageLabel();

    expect(label).toBe('');
  });
});
