// src/app/pages/call-page/call-page.spec.ts
import { TestBed } from '@angular/core/testing';
import { CallPage } from './call-page';
import { ActivatedRoute, Router } from '@angular/router';
import { ElementRef, signal } from '@angular/core';
import { of } from 'rxjs';

import { P2pService } from '../../services/voice/p2p.service';
import { CallService } from '../../services/voice/call.service';
import { UserService } from '../../services/user/user.service';
import { UserSettingsService } from '../../services/user/user-settings.service';
import { UserSettingsResponse } from '../../api';
import { SideBarSection } from '../components/side-bar/side-bar';

// --- MediaStream Mock, falls Node-Umgebung kein MediaStream hat ---
class MockMediaStream {
  private tracks: any[];

  constructor(tracks: any[] = []) {
    this.tracks = tracks;
  }

  addTrack(track: any) {
    this.tracks.push(track);
  }

  getTracks() {
    return this.tracks;
  }

  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio');
  }
}

if (!(globalThis as any).MediaStream) {
  (globalThis as any).MediaStream = MockMediaStream as any;
}

describe('CallPage', () => {
  let fixture: any;
  let component: CallPage;

  const createUser = (id: string, username: string): UserSettingsResponse =>
    ({
      id,
      username,
      profile: {
        displayName: username,
      },
    } as unknown as UserSettingsResponse);

  const createP2pMock = (): P2pService => {
    const mock = {
      connecting: signal(true),
      error: signal<string | null>(null),
      isLocalSpeaking: signal(false),
      isRemoteSpeaking: signal(false),
      isMuted: signal(false),
      remoteVolume: signal(1),
      showVolumeSlider: signal(false),

      init: jest.fn(),
      toggleMute: jest.fn(),
      toggleVolumeSlider: jest.fn(),
      onVolumeChange: jest.fn(),
      hangup: jest.fn(),
      cleanup: jest.fn(),
    };

    return mock as unknown as P2pService;
  };

  const createCallServiceMock = (active: any | null): CallService => {
    const activeSignal = signal<any | null>(active);

    const mock: Partial<CallService> = {
      activeCall: activeSignal, // Signal ist callable: activeCall()
    };

    return mock as CallService;
  };

  const createUserServiceMock = (): UserService => {
    const mock: Partial<UserService> = {
      currentUser: () => of(createUser('me', 'me-user')),
      getUserById: () => of(createUser('peer-1', 'peer-user')),
    };

    return mock as UserService;
  };

  const createUserSettingsServiceMock = (): UserSettingsService => {
    const mock: Partial<UserSettingsService> = {
      avatarUrl: signal<string | null>(null),
      displayName: signal<string | null>('Test User'),
    };

    return mock as UserSettingsService;
  };

  const createActivatedRouteMock = (id: string | null) => ({
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'id' ? id : null),
      },
    },
  });

  const createRouterMock = () =>
    ({
      navigateByUrl: jest.fn().mockResolvedValue(true),
    }) as unknown as Router;

  const setup = (options: {
    routeId: string | null;
    activeCall: any | null;
  }) => {
    const p2pMock = createP2pMock();
    const callServiceMock = createCallServiceMock(options.activeCall);
    const userServiceMock = createUserServiceMock();
    const userSettingsServiceMock = createUserSettingsServiceMock();
    const activatedRouteMock = createActivatedRouteMock(options.routeId);
    const routerMock = createRouterMock();

    TestBed.configureTestingModule({
      imports: [CallPage],
      providers: [
        { provide: P2pService, useValue: p2pMock },
        { provide: CallService, useValue: callServiceMock },
        { provide: UserService, useValue: userServiceMock },
        // WICHTIG: SideBar holt sich UserSettingsService -> wir überschreiben ihn hier
        { provide: UserSettingsService, useValue: userSettingsServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    fixture = TestBed.createComponent(CallPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggert ngOnInit + Template

    return {
      p2pMock,
      callServiceMock,
      userServiceMock,
      userSettingsServiceMock,
      activatedRouteMock,
      routerMock,
    };
  };

  it('should create with valid call id and active call', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    expect(component).toBeTruthy();
    expect(p2pMock.error()).toBeNull();
    expect(p2pMock.connecting()).toBe(true);
    expect(component.localUser()).not.toBeNull();
    expect(component.remoteUser()).not.toBeNull();
  });

  it('ngOnInit should set error and stop connecting when call id is missing', () => {
    const { p2pMock } = setup({
      routeId: null,
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    expect(p2pMock.error()).toBe('Missing call id');
    expect(p2pMock.connecting()).toBe(false);
  });

  it('ngOnInit should set error when no active call for this id', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: null,
    });

    expect(p2pMock.error()).toBe('No active call for this id');
    expect(p2pMock.connecting()).toBe(false);
  });

  it('ngAfterViewInit should call p2p.init when call is valid and audio ref exists', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    // Sicherstellen, dass ein Audio-Element da ist
    if (!component.remoteAudioRef) {
      const audio = document.createElement('audio');
      component.remoteAudioRef = new ElementRef<HTMLAudioElement>(audio);
    }

    // Angular hat ngAfterViewInit schon einmal aufgerufen -> Call-History leeren
    (p2pMock.init as jest.Mock).mockClear();

    // expliziter Aufruf, den wir testen wollen
    component.ngAfterViewInit();

    expect(p2pMock.init).toHaveBeenCalledTimes(1);
    const args = (p2pMock.init as jest.Mock).mock.calls[0];
    expect(args[0]).toBe('123');
    expect(args[1]).toBe('peer-1');
    expect(args[2]).toBe(true);
    expect(args[3]).toBe(
      (component.remoteAudioRef as ElementRef<HTMLAudioElement>).nativeElement,
    );
  });

  it('onSectionChange should update currentSection', () => {
    setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    const newSection: SideBarSection = 'friends';
    component.onSectionChange(newSection);

    expect(component.currentSection()).toBe(newSection);
  });

  it('openSettings should navigate to /settings', async () => {
    const { routerMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    await component.openSettings();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/settings');
  });

  it('toggleMute should delegate to p2p.toggleMute', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    component.toggleMute();
    expect(p2pMock.toggleMute).toHaveBeenCalled();
  });

  it('toggleVolumeSlider should delegate to p2p.toggleVolumeSlider', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    component.toggleVolumeSlider();
    expect(p2pMock.toggleVolumeSlider).toHaveBeenCalled();
  });

  it('onVolumeChange should parse value and call p2p.onVolumeChange', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    const input = document.createElement('input');
    input.value = '0.5';

    const event = { target: input } as unknown as Event;

    component.onVolumeChange(event);

    expect(p2pMock.onVolumeChange).toHaveBeenCalledWith(0.5);
  });

  it('hangup should call p2p.hangup', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    component.hangup();
    expect(p2pMock.hangup).toHaveBeenCalled();
  });

  it('ngOnDestroy should call p2p.cleanup', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    component.ngOnDestroy();
    expect(p2pMock.cleanup).toHaveBeenCalled();
  });

  it('volumeIcon computed should react to remoteVolume changes', () => {
    const { p2pMock } = setup({
      routeId: '123',
      activeCall: {
        callId: '123',
        peerId: 'peer-1',
        isCaller: true,
      },
    });

    const iconHigh = component.volumeIcon();

    p2pMock.remoteVolume.set(0);
    const iconMute = component.volumeIcon();
    expect(iconMute).not.toBe(iconHigh);

    p2pMock.remoteVolume.set(0.3);
    const iconLow1 = component.volumeIcon();

    p2pMock.remoteVolume.set(0.5);
    const iconLow2 = component.volumeIcon();

    expect(iconLow2).not.toBe(iconMute);
    expect(iconLow1).not.toBe(iconHigh);
  });
});
