import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { SettingsPage } from './settings-page';
import { SettingsPageType } from '../../types/settings-page-types';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;
  let locationMock: { back: jest.Mock };

  beforeEach(async () => {
    locationMock = {
      back: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { provide: Location, useValue: locationMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with Account page open', () => {
    expect(component.openPage()).toBe(SettingsPageType.Account);
  });

  it('should have both pages configured', () => {
    expect(component.pages.length).toBe(2);
    expect(component.pages).toEqual([
      { type: SettingsPageType.Account, label: 'My Account' },
      { type: SettingsPageType.Security, label: 'Privacy & Security' },
    ]);
  });

  it('should change page when setPage is called', () => {
    component.setPage(SettingsPageType.Security);
    expect(component.openPage()).toBe(SettingsPageType.Security);

    component.setPage(SettingsPageType.Account);
    expect(component.openPage()).toBe(SettingsPageType.Account);
  });

  it('should return correct currentPageLabel for Account', () => {
    component.setPage(SettingsPageType.Account);
    expect(component.currentPageLabel()).toBe('My Account');
  });

  it('should return correct currentPageLabel for Security', () => {
    component.setPage(SettingsPageType.Security);
    expect(component.currentPageLabel()).toBe('Privacy & Security');
  });

  it('should return empty string if page label is not found', () => {
    // @ts-expect-error: force an invalid value into the signal for testing
    component.openPage.set(999);

    expect(component.currentPageLabel()).toBe('');
  });

  it('should call Location.back when goBack is invoked', () => {
    component.goBack();
    expect(locationMock.back).toHaveBeenCalledTimes(1);
  });
});
