// src/app/services/voice/p2p.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { P2pService } from './p2p.service';
import { CallService, WebRtcIceCandidate } from './call.service';

// Helper to create a full WebRtcIceCandidate with required fields
const createIce = (
  overrides: Partial<WebRtcIceCandidate> = {},
): WebRtcIceCandidate => ({
  callId: 'call-1',
  fromUserId: 'peer-1',
  candidate: 'cand-1',
  sdpMid: '0',
  sdpMLineIndex: 0,
  ...overrides,
});

// Simple MediaStream mock for the Node/Jest environment
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

// Global setup for browser APIs used by P2pService
beforeAll(() => {
  if (!(globalThis as any).MediaStream) {
    (globalThis as any).MediaStream = MockMediaStream as any;
  }

  if (!(globalThis as any).RTCIceCandidate) {
    (globalThis as any).RTCIceCandidate = class {
      constructor(public init: any) {}
    } as any;
  }

  if (!(globalThis as any).cancelAnimationFrame) {
    (globalThis as any).cancelAnimationFrame = jest.fn();
  }
});

describe('P2pService (logic-focused tests)', () => {
  let service: P2pService;
  let callServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    // CallService stub
    callServiceMock = {
      activeCall: signal<any | null>({
        callId: 'call-1',
        peerId: 'peer-1',
        isCaller: true,
      }),
      sendHangup: jest.fn(),
      sendOffer: jest.fn(),
      sendAnswer: jest.fn(),
      sendIceCandidate: jest.fn(),
      registerOfferHandler: jest.fn(() => jest.fn()),
      registerAnswerHandler: jest.fn(() => jest.fn()),
      registerIceHandler: jest.fn(() => jest.fn()),
      registerHangupHandler: jest.fn(() => jest.fn()),
    };

    // Router stub
    routerMock = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        P2pService,
        { provide: CallService, useValue: callServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(P2pService);
  });

  // ----------------------------------------------------
  // toggleMute
  // ----------------------------------------------------

  it('toggleMute should toggle isMuted and enable/disable local audio tracks', () => {
    const track1 = {
      kind: 'audio',
      enabled: true,
      muted: false,
      getSettings: jest.fn().mockReturnValue({}),
      stop: jest.fn(),
    };
    const track2 = {
      kind: 'audio',
      enabled: true,
      muted: false,
      getSettings: jest.fn().mockReturnValue({}),
      stop: jest.fn(),
    };

    service.localStream = {
      getAudioTracks: () => [track1, track2],
      // Needed for cleanup() during Angular TestBed teardown
      getTracks: () => [track1, track2],
    } as any;

    // initially not muted
    expect(service.isMuted()).toBe(false);

    service.toggleMute();

    expect(service.isMuted()).toBe(true);
    expect(track1.enabled).toBe(false);
    expect(track2.enabled).toBe(false);
    expect(service.isLocalSpeaking()).toBe(false);

    service.toggleMute();

    expect(service.isMuted()).toBe(false);
    expect(track1.enabled).toBe(true);
    expect(track2.enabled).toBe(true);
  });

  it('toggleMute should not throw when localStream is null', () => {
    service.localStream = null;
    expect(() => service.toggleMute()).not.toThrow();
  });

  // ----------------------------------------------------
  // Volume / Slider
  // ----------------------------------------------------

  it('toggleVolumeSlider should toggle showVolumeSlider signal', () => {
    expect(service.showVolumeSlider()).toBe(false);
    service.toggleVolumeSlider();
    expect(service.showVolumeSlider()).toBe(true);
    service.toggleVolumeSlider();
    expect(service.showVolumeSlider()).toBe(false);
  });

  it('onVolumeChange should clamp value and set remoteAudioEl.volume', () => {
    const audio = document.createElement('audio');
    (service as any).remoteAudioEl = audio;

    service.onVolumeChange(2); // > 1 -> 1
    expect(service.remoteVolume()).toBe(1);
    expect(audio.volume).toBe(1);

    service.onVolumeChange(-1); // < 0 -> 0
    expect(service.remoteVolume()).toBe(0);
    expect(audio.volume).toBe(0);

    service.onVolumeChange(0.5);
    expect(service.remoteVolume()).toBe(0.5);
    expect(audio.volume).toBe(0.5);
  });

  it('onVolumeChange should not throw when remoteAudioEl is undefined', () => {
    (service as any).remoteAudioEl = undefined;
    expect(() => service.onVolumeChange(0.8)).not.toThrow();
    expect(service.remoteVolume()).toBe(0.8);
  });

  // ----------------------------------------------------
  // hangup
  // ----------------------------------------------------

  it('hangup should send hangup, run cleanup, clear activeCall and navigate to root', async () => {
    service['callId'] = 'call-1';
    service['peerId'] = 'peer-1';

    const cleanupSpy = jest.spyOn(service, 'cleanup');

    await service.hangup();

    expect(callServiceMock.sendHangup).toHaveBeenCalledWith('call-1', 'peer-1');
    expect(cleanupSpy).toHaveBeenCalled();
    expect(callServiceMock.activeCall()).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('hangup without callId/peerId should only cleanup and navigate', async () => {
    service['callId'] = null;
    service['peerId'] = null;

    const cleanupSpy = jest.spyOn(service, 'cleanup');

    await service.hangup();

    expect(callServiceMock.sendHangup).not.toHaveBeenCalled();
    expect(cleanupSpy).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  // ----------------------------------------------------
  // ICE queue / flush / add
  // ----------------------------------------------------

  it('handleRemoteIce should queue ICE if pc is null or remoteDescription is missing', () => {
    const ice = createIce();

    // Case 1: pc is null
    (service as any).pc = null;
    (service as any).handleRemoteIce(ice);
    expect(service['pendingIce']).toEqual([ice]);

    // Case 2: pc present, but remoteDescription is null
    (service as any).pendingIce = [];
    (service as any).pc = {
      remoteDescription: null,
      // needed for cleanup() at teardown
      getSenders: () => [],
      close: jest.fn(),
      addIceCandidate: jest.fn().mockResolvedValue(undefined),
    } as any;
    (service as any).handleRemoteIce(ice);
    expect(service['pendingIce']).toEqual([ice]);
  });

  it('flushPendingIce should call addIceCandidate for queued ICE when remoteDescription exists', () => {
    const ice = createIce();
    service['pendingIce'] = [ice];

    const addIceSpy = jest.spyOn<any, any>(service as any, 'addIceCandidate');
    (service as any).pc = {
      remoteDescription: {},
      // needed for cleanup() at teardown
      getSenders: () => [],
      close: jest.fn(),
      addIceCandidate: jest.fn().mockResolvedValue(undefined),
    } as any;

    (service as any).flushPendingIce();

    expect(addIceSpy).toHaveBeenCalledWith(ice);
    expect(service['pendingIce']).toEqual([]);
  });

  it('addIceCandidate should call pc.addIceCandidate only when candidate is present', () => {
    const addSpy = jest.fn().mockResolvedValue(undefined);
    (service as any).pc = {
      addIceCandidate: addSpy,
      // needed for cleanup() at teardown
      getSenders: () => [],
      close: jest.fn(),
    } as any;

    // valid candidate
    (service as any).addIceCandidate(
      createIce({ candidate: 'cand-1', sdpMid: '0', sdpMLineIndex: 0 }),
    );
    expect(addSpy).toHaveBeenCalledTimes(1);

    // candidate = null -> no additional call
    (service as any).addIceCandidate(createIce({ candidate: null as any }));
    expect(addSpy).toHaveBeenCalledTimes(1);
  });

  // ----------------------------------------------------
  // computeLevel
  // ----------------------------------------------------

  it('computeLevel should be smaller for silent data than for loud data', () => {
    const silent = new Uint8Array(8).fill(128); // center line
    const loud = new Uint8Array(8);
    for (let i = 0; i < loud.length; i++) {
      loud[i] = i % 2 === 0 ? 255 : 0;
    }

    const silentLevel = (service as any).computeLevel(silent);
    const loudLevel = (service as any).computeLevel(loud);

    expect(silentLevel).toBeCloseTo(0, 2);
    expect(loudLevel).toBeGreaterThan(silentLevel);
  });

  // ----------------------------------------------------
  // cleanup / ngOnDestroy
  // ----------------------------------------------------

  it('cleanup should call unregister handlers and free internal resources', () => {
    const unOffer = jest.fn();
    const unAnswer = jest.fn();
    const unIce = jest.fn();
    const unHangup = jest.fn();

    service['unregisterOffer'] = unOffer;
    service['unregisterAnswer'] = unAnswer;
    service['unregisterIce'] = unIce;
    service['unregisterHangup'] = unHangup;

    const stopTrack = jest.fn();
    const sender = { track: { stop: stopTrack } } as any;
    const pcMock = {
      getSenders: () => [sender],
      close: jest.fn(),
      addIceCandidate: jest.fn().mockResolvedValue(undefined),
    };

    service.pc = pcMock as any;
    const localTrack = { stop: jest.fn() };
    service.localStream = {
      getTracks: () => [localTrack],
      getAudioTracks: () => [],
    } as any;
    service.remoteStream = {} as any;
    service['pendingIce'] = [{ candidate: 'x' } as any];
    service['offerHandled'] = true;
    service['levelRafId'] = 123;
    service['localAnalyzer'] = {} as any;
    service['remoteAnalyzer'] = {} as any;
    service['localDataArray'] = new Uint8Array(4);
    service['remoteDataArray'] = new Uint8Array(4);
    service['audioCtx'] = {
      close: jest.fn(),
    } as any;
    const audio = document.createElement('audio');
    (audio as any).srcObject = {};
    service['remoteAudioEl'] = audio;

    const cancelRafSpy = jest
      .spyOn(globalThis, 'cancelAnimationFrame' as any)
      .mockImplementation(() => {});

    service.cleanup();

    expect(unOffer).toHaveBeenCalled();
    expect(unAnswer).toHaveBeenCalled();
    expect(unIce).toHaveBeenCalled();
    expect(unHangup).toHaveBeenCalled();

    expect(pcMock.close).toHaveBeenCalled();
    expect(service.pc).toBeNull();
    expect(service.localStream).toBeNull();
    expect(service.remoteStream).toBeInstanceOf(MediaStream);
    expect(service['pendingIce']).toEqual([]);
    expect(service['offerHandled']).toBe(false);
    expect(service.connecting()).toBe(false);
    expect(cancelRafSpy).toHaveBeenCalled();
    expect(service['localAnalyzer']).toBeNull();
    expect(service['remoteAnalyzer']).toBeNull();
    expect(service['localDataArray']).toBeUndefined();
    expect(service['remoteDataArray']).toBeUndefined();
    expect(service['audioCtx']).toBeNull();
    expect(service['remoteAudioEl']!.srcObject).toBeNull();
  });

  it('ngOnDestroy should call cleanup', () => {
    const spy = jest.spyOn(service, 'cleanup');
    service.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
