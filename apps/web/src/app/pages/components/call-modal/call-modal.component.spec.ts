// src/app/pages/components/call-modal/call-modal.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { CallModalComponent } from './call-modal.component';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import {
  CallInvite,
  CallService,
  CallHangupEvent,
} from '../../../services/voice/call.service';
import { UserService } from '../../../services/user/user.service';
import { AudioService } from '../../../services/voice/audio.service';
import { UserSettingsResponse } from '../../../api';

// Hilfsfunktion für einen Dummy-User
const createUser = (id: string, username: string): UserSettingsResponse =>
  ({
    id,
    username,
    profile: {
      displayName: username,
    },
  } as unknown as UserSettingsResponse);

// Hilfsfunktion für ein Dummy-CallInvite
const createInvite = (): CallInvite =>
  ({
    callId: 'call-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
  } as CallInvite);

describe('CallModalComponent', () => {
  let component: CallModalComponent;

  const createCallServiceMock = (initialInvite: CallInvite | null) => {
    const callInviteSignal = signal<CallInvite | null>(initialInvite);

    const unregisterSpy = jest.fn();
    let hangupHandler: ((evt: CallHangupEvent) => void) | null = null;

    const mock: Partial<CallService> & {
      _emitHangup: (evt: CallHangupEvent) => void;
      _unregisterSpy: jest.Mock;
    } = {
      callInvite: callInviteSignal,

      registerHangupHandler: jest.fn((handler: (evt: CallHangupEvent) => void) => {
        hangupHandler = handler;
        return unregisterSpy;
      }),

      setActiveCallAsCallee: jest.fn(),
      acceptCall: jest.fn(),
      closeModal: jest.fn(),
      sendHangup: jest.fn(),
      rejectCall: jest.fn(),

      _emitHangup: (evt: CallHangupEvent) => {
        if (hangupHandler) {
          hangupHandler(evt);
        }
      },
      _unregisterSpy: unregisterSpy,
    };

    return mock as unknown as CallService & {
      _emitHangup: (evt: CallHangupEvent) => void;
      _unregisterSpy: jest.Mock;
    };
  };

  const createUserServiceMock = () => {
    const mock: Partial<UserService> = {
      getUserById: jest.fn((id: string) => of(createUser(id, `user-${id}`))),
    };

    return mock as UserService;
  };

  const createAudioServiceMock = () => {
    const mock: Partial<AudioService> = {
      playLoop: jest.fn(),
      stop: jest.fn(),
    };

    return mock as AudioService;
  };

  const createRouterMock = () =>
    ({
      navigate: jest.fn().mockResolvedValue(true),
    }) as unknown as Router;

  const setup = (options?: { initialInvite?: CallInvite | null }) => {
    const callServiceMock = createCallServiceMock(
      options?.initialInvite ?? null,
    );
    const userServiceMock = createUserServiceMock();
    const audioServiceMock = createAudioServiceMock();
    const routerMock = createRouterMock();

    TestBed.configureTestingModule({
      imports: [CallModalComponent],
      providers: [
        { provide: CallService, useValue: callServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: AudioService, useValue: audioServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(CallModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    return {
      fixture,
      callServiceMock,
      userServiceMock,
      audioServiceMock,
      routerMock,
    };
  };

  it('should create', () => {
    const { fixture } = setup({ initialInvite: null });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should stop ringtone and reset state when there is no call invite', () => {
    const { audioServiceMock } = setup({ initialInvite: null });

    expect(audioServiceMock.stop).toHaveBeenCalledWith('ringtone');
    expect(component.caller()).toBeNull();
    expect(component.callerError()).toBeNull();
    expect(component.callerLoading()).toBe(false);
  });

  it('should start ringtone and load caller when call invite is present', () => {
    const invite = createInvite();

    const { audioServiceMock, userServiceMock } = setup({
      initialInvite: invite,
    });

    expect(audioServiceMock.playLoop).toHaveBeenCalledWith(
      'ringtone',
      'audio/ringtone.mp3',
      { volume: 0.5 },
    );
    expect(userServiceMock.getUserById).toHaveBeenCalledWith(invite.fromUserId);

    // of(..) ist sync, daher ist der User direkt gesetzt
    expect(component.caller()).not.toBeNull();
    expect(component.callerLoading()).toBe(false);
    expect(component.callerError()).toBeNull();
  });

  it('should handle hangup event for current invite and close modal', () => {
    const invite = createInvite();

    const { callServiceMock, audioServiceMock } = setup({
      initialInvite: invite,
    });

    // passenden Hangup auslösen
    (callServiceMock as any)._emitHangup({
      callId: invite.callId,
      fromUserId: invite.fromUserId,
      toUserId: invite.toUserId,
    } as CallHangupEvent);

    expect(audioServiceMock.stop).toHaveBeenCalledWith('ringtone');
    expect(callServiceMock.closeModal).toHaveBeenCalled();
  });

  it('should ignore hangup events for other calls', () => {
    const invite = createInvite();

    const { callServiceMock, audioServiceMock } = setup({
      initialInvite: invite,
    });

    (audioServiceMock.stop as jest.Mock).mockClear();
    (callServiceMock.closeModal as jest.Mock).mockClear();

    // Hangup mit anderem callId
    (callServiceMock as any)._emitHangup({
      callId: 'other-call',
      fromUserId: invite.fromUserId,
      toUserId: invite.toUserId,
    } as CallHangupEvent);

    expect(audioServiceMock.stop).not.toHaveBeenCalledWith('ringtone');
    expect(callServiceMock.closeModal).not.toHaveBeenCalled();
  });

  it('accept should stop ringtone, set active call, accept, close modal and navigate', async () => {
    const invite = createInvite();

    const { callServiceMock, audioServiceMock, routerMock } = setup({
      initialInvite: invite,
    });

    (audioServiceMock.stop as jest.Mock).mockClear();
    (callServiceMock.setActiveCallAsCallee as jest.Mock).mockClear();
    (callServiceMock.acceptCall as jest.Mock).mockClear();
    (callServiceMock.closeModal as jest.Mock).mockClear();
    (routerMock.navigate as jest.Mock).mockClear();

    component.accept(invite);

    expect(audioServiceMock.stop).toHaveBeenCalledWith('ringtone');
    expect(callServiceMock.setActiveCallAsCallee).toHaveBeenCalledWith(
      invite.callId,
      invite.fromUserId,
    );
    expect(callServiceMock.acceptCall).toHaveBeenCalledWith(
      invite.callId,
      invite.fromUserId,
    );
    expect(callServiceMock.closeModal).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/call',
      invite.callId,
    ]);
  });

  it('reject should stop ringtone, send hangup, reject and close modal', () => {
    const invite = createInvite();

    const { callServiceMock, audioServiceMock } = setup({
      initialInvite: invite,
    });

    (audioServiceMock.stop as jest.Mock).mockClear();
    (callServiceMock.sendHangup as jest.Mock).mockClear();
    (callServiceMock.rejectCall as jest.Mock).mockClear();
    (callServiceMock.closeModal as jest.Mock).mockClear();

    component.reject(invite);

    expect(audioServiceMock.stop).toHaveBeenCalledWith('ringtone');
    expect(callServiceMock.sendHangup).toHaveBeenCalledWith(
      invite.callId,
      invite.fromUserId,
    );
    expect(callServiceMock.rejectCall).toHaveBeenCalledWith(
      invite.callId,
      invite.fromUserId,
    );
    expect(callServiceMock.closeModal).toHaveBeenCalled();
  });

  it('ngOnDestroy should call unregisterHangup handler', () => {
    const invite = createInvite();

    const { callServiceMock } = setup({
      initialInvite: invite,
    });

    const unregisterSpy = (callServiceMock as any)._unregisterSpy as jest.Mock;

    component.ngOnDestroy();

    expect(unregisterSpy).toHaveBeenCalled();
  });
});
