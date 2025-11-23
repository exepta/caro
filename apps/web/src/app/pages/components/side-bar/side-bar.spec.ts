import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SideBar, SideBarSection } from './side-bar';
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
  });

  it('should create', () => {
    component.activeSection = 'friends';
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should expose avatarUrl and displayName from UserSettingsService signals', () => {
    component.activeSection = 'friends';
    fixture.detectChanges();

    expect(component.avatarUrl()).toBe('https://example.com/avatar.png');
    expect(component.displayName()).toBe('Exepta');

    avatarSignal.set('https://example.com/other.png');
    displayNameSignal.set('Other User');

    expect(component.avatarUrl()).toBe('https://example.com/other.png');
    expect(component.displayName()).toBe('Other User');
  });

  it('onSettingsClick should emit settingsClick event', () => {
    component.activeSection = 'friends';
    fixture.detectChanges();

    const spy = jest.fn();
    component.settingsClick.subscribe(spy);

    component.onSettingsClick();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onSelectSection should emit sectionChange event with correct section', () => {
    component.activeSection = 'friends';
    fixture.detectChanges();

    const spy = jest.fn();
    component.sectionChange.subscribe(spy);

    const section: SideBarSection = 'groups';
    component.onSelectSection(section);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('groups');
  });

  it('should apply nav-active class to Friends when activeSection is friends', () => {
    component.activeSection = 'friends';
    fixture.detectChanges();

    const entries: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.nav-entry')
    );

    expect(entries.length).toBe(3);

    const [friendsEl, groupsEl, serversEl] = entries;

    expect(friendsEl.classList.contains('nav-active')).toBe(true);
    expect(groupsEl.classList.contains('nav-active')).toBe(false);
    expect(serversEl.classList.contains('nav-active')).toBe(false);
  });

  it('should apply nav-active class to Groups when activeSection is groups', () => {
    component.activeSection = 'groups';
    fixture.detectChanges();

    const entries: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.nav-entry')
    );

    const [friendsEl, groupsEl, serversEl] = entries;

    expect(friendsEl.classList.contains('nav-active')).toBe(false);
    expect(groupsEl.classList.contains('nav-active')).toBe(true);
    expect(serversEl.classList.contains('nav-active')).toBe(false);
  });

  it('should apply nav-active class to Servers when activeSection is servers', () => {
    component.activeSection = 'servers';
    fixture.detectChanges();

    const entries: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.nav-entry')
    );

    const [friendsEl, groupsEl, serversEl] = entries;

    expect(friendsEl.classList.contains('nav-active')).toBe(false);
    expect(groupsEl.classList.contains('nav-active')).toBe(false);
    expect(serversEl.classList.contains('nav-active')).toBe(true);
  });
});
