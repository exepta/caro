import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SideBar } from './side-bar';
import { UserSettingsService } from '../../../services/user-settings.service';

describe('SideBar', () => {
  let fixture: ComponentFixture<SideBar>;
  let component: SideBar;

  const avatarSignal = signal<string | null>('https://example.com/avatar.png');
  const displayNameSignal = signal<string | null>('Exepta');

  const userSettingsServiceMock: Partial<UserSettingsService> = {
    avatarUrl: avatarSignal as any,
    displayName: displayNameSignal as any,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideBar],
      providers: [
        {
          provide: UserSettingsService,
          useValue: userSettingsServiceMock as UserSettingsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SideBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose avatarUrl and displayName from UserSettingsService signals', () => {
    expect(component.avatarUrl()).toBe('https://example.com/avatar.png');
    expect(component.displayName()).toBe('Exepta');

    avatarSignal.set('https://example.com/other.png');
    displayNameSignal.set('Other User');

    expect(component.avatarUrl()).toBe('https://example.com/other.png');
    expect(component.displayName()).toBe('Other User');
  });

  it('onSettingsClick should emit settingsClick event', () => {
    const spy = jest.fn();
    component.settingsClick.subscribe(spy);

    component.onSettingsClick();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
