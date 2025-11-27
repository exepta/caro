import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CallService,
  WebRtcIceCandidate,
  WebRtcOffer,
  WebRtcAnswer,
  CallHangupEvent,
} from './call.service';

@Injectable({ providedIn: 'root' })
export class P2pService implements OnDestroy {
  private readonly callService = inject(CallService);
  private readonly router = inject(Router);

  pc: RTCPeerConnection | null = null;
  localStream: MediaStream | null = null;
  remoteStream = new MediaStream();
  private pendingIce: WebRtcIceCandidate[] = [];

  connecting = signal(true);
  error = signal<string | null>(null);

  isLocalSpeaking = signal(false);
  isRemoteSpeaking = signal(false);
  isMuted = signal(false);
  remoteVolume = signal(1);

  showVolumeSlider = signal(false);

  private callId: string | null = null;
  private peerId: string | null = null;

  private unregisterOffer?: () => void;
  private unregisterAnswer?: () => void;
  private unregisterIce?: () => void;
  private unregisterHangup?: () => void;

  private offerHandled = false;

  private audioCtx: AudioContext | null = null;
  private localAnalyzer: AnalyserNode | null = null;
  private remoteAnalyzer: AnalyserNode | null = null;
  private localDataArray?: Uint8Array;
  private remoteDataArray?: Uint8Array;
  private levelRafId: number | null = null;

  private remoteAudioEl?: HTMLAudioElement;

  init(
    callId: string,
    peerId: string,
    isCaller: boolean,
    remoteAudioEl: HTMLAudioElement,
  ): void {
    this.cleanup();

    this.callId = callId;
    this.peerId = peerId;
    this.remoteAudioEl = remoteAudioEl;

    this.connecting.set(true);
    this.error.set(null);
    this.isLocalSpeaking.set(false);
    this.isRemoteSpeaking.set(false);
    this.isMuted.set(false);
    this.remoteVolume.set(1);
    this.showVolumeSlider.set(false);

    this.registerSignalingHandlers();

    this.initPeerConnection(isCaller, peerId).catch((err) => {
      console.error('[P2pService] Error in initPeerConnection', err);
      this.error.set('Failed to setup WebRTC');
      this.connecting.set(false);
    });
  }

  toggleMute(): void {
    const newMuted = !this.isMuted();
    this.isMuted.set(newMuted);

    const tracks = this.localStream?.getAudioTracks() ?? [];
    console.log('[P2pService] toggleMute', {
      newMuted,
      trackCount: tracks.length,
    });

    tracks.forEach((track) => {
      track.enabled = !newMuted;
      console.log(
        '[P2pService] local track kind=' +
        track.kind +
        ' enabled=' +
        track.enabled +
        ' muted=' +
        track.muted,
        track.getSettings ? track.getSettings() : {},
      );
    });

    if (newMuted) {
      this.isLocalSpeaking.set(false);
    }
  }

  toggleVolumeSlider(): void {
    this.showVolumeSlider.update((v) => !v);
  }

  onVolumeChange(value: number): void {
    const clamped = Math.min(1, Math.max(0, value));
    this.remoteVolume.set(clamped);

    if (this.remoteAudioEl) {
      this.remoteAudioEl.volume = clamped;
    }
  }

  hangup(): void {
    const callId = this.callId;
    const peerId = this.peerId;

    if (callId && peerId) {
      this.callService.sendHangup(callId, peerId);
    }

    this.cleanup();
    this.callService.activeCall.set(null);
    void this.router.navigate(['/']);
  }

  // ---------------------------------------------------

  private registerSignalingHandlers(): void {
    this.unregisterOffer = this.callService.registerOfferHandler(
      (offer: WebRtcOffer) => {
        if (!this.callId || offer.callId !== this.callId) return;
        console.log('[P2pService] handler: offer', offer);
        void this.handleRemoteOffer(offer);
      },
    );

    this.unregisterAnswer = this.callService.registerAnswerHandler(
      (answer: WebRtcAnswer) => {
        if (!this.callId || answer.callId !== this.callId) return;
        console.log('[P2pService] handler: answer', answer);
        void this.handleRemoteAnswer(answer);
      },
    );

    this.unregisterIce = this.callService.registerIceHandler(
      (ice: WebRtcIceCandidate) => {
        if (!this.callId || ice.callId !== this.callId) return;
        console.log('[P2pService] handler: ice', ice);
        this.handleRemoteIce(ice);
      },
    );

    this.unregisterHangup = this.callService.registerHangupHandler(
      (evt: CallHangupEvent) => {
        if (!this.callId || evt.callId !== this.callId) return;
        console.log('[P2pService] handler: hangup', evt);
        this.cleanup();
        this.callService.activeCall.set(null);
        void this.router.navigate(['/']);
      },
    );
  }

  private async initPeerConnection(isCaller: boolean, peerId: string | null) {
    if (this.pc) {
      console.warn('[P2pService] pc already exists, skipping init');
      return;
    }

    if (!this.callId) {
      console.error('[P2pService] missing callId in initPeerConnection');
      return;
    }

    if (!peerId) {
      console.error('[P2pService] missing peerId in initPeerConnection');
      return;
    }

    console.log('[P2pService] initPeerConnection', { isCaller, peerId });

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      console.log('[P2pService] local ICE → peer', peerId);
      this.callService.sendIceCandidate(this.callId!, peerId, event.candidate);
    };

    pc.ontrack = (event) => {
      console.log(
        '[P2pService] ontrack, remote tracks:',
        event.streams[0].getTracks().length,
      );
      event.streams[0].getTracks().forEach((track) => {
        console.log(
          '[P2pService] remote track kind=' +
          track.kind +
          ' muted=' +
          track.muted,
          track.getSettings ? track.getSettings() : {},
        );
        this.remoteStream.addTrack(track);
        track.onunmute = () => {
          console.log('[P2pService] remote track onunmute fired');
          this.isRemoteSpeaking.set(true);
        };
      });

      if (this.remoteAudioEl) {
        this.remoteAudioEl.srcObject = this.remoteStream;
        this.remoteAudioEl.volume = this.remoteVolume();
        this.remoteAudioEl.play().catch((err) => {
          console.warn('[P2pService] remote audio play() failed', err);
        });
      }

      this.setupRemoteLevelMeter();

      this.connecting.set(false);
    };

    this.pc = pc;

    if (isCaller) {
      try {
        await this.ensureLocalStream(pc);
      } catch (err) {
        console.error('[P2pService] getUserMedia failed (caller)', err);
        this.error.set('Microphone access denied');
        this.connecting.set(false);
        return;
      }

      this.setupLocalLevelMeter();

      console.log('[P2pService] creating offer as caller');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.callService.sendOffer(this.callId!, peerId, offer.sdp ?? '');
      this.connecting.set(true);
    } else {
      console.log('[P2pService] callee ready, waiting for offer');
      this.connecting.set(true);
    }
  }

  private async ensureLocalStream(pc: RTCPeerConnection) {
    if (!this.localStream) {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }

    const existingTrackIds = new Set(
      pc
        .getSenders()
        .map((s) => s.track)
        .filter((t): t is MediaStreamTrack => !!t)
        .map((t) => t.id),
    );

    this.localStream.getAudioTracks().forEach((track, idx) => {
      if (existingTrackIds.has(track.id)) {
        return;
      }
      console.log('[P2pService] addTrack local', {
        idx,
        enabled: track.enabled,
        muted: track.muted,
        settings: track.getSettings ? track.getSettings() : {},
      });
      pc.addTrack(track, this.localStream!);
    });
  }

  private ensureAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }

  private setupLocalLevelMeter() {
    if (!this.localStream) return;
    if (this.localAnalyzer) return;

    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const source = this.audioCtx.createMediaStreamSource(this.localStream);
    this.localAnalyzer = this.audioCtx.createAnalyser();
    this.localAnalyzer.fftSize = 256;
    this.localDataArray = new Uint8Array(this.localAnalyzer.frequencyBinCount);
    source.connect(this.localAnalyzer);

    this.startLevelLoop();
  }

  private setupRemoteLevelMeter() {
    if (!this.remoteStream) return;
    if (this.remoteAnalyzer) return;

    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const source = this.audioCtx.createMediaStreamSource(this.remoteStream);
    this.remoteAnalyzer = this.audioCtx.createAnalyser();
    this.remoteAnalyzer.fftSize = 256;
    this.remoteDataArray = new Uint8Array(
      this.remoteAnalyzer.frequencyBinCount,
    );
    source.connect(this.remoteAnalyzer);

    this.startLevelLoop();
  }

  private startLevelLoop() {
    if (this.levelRafId !== null) return;

    const loop = () => {
      this.levelRafId = requestAnimationFrame(loop);

      if (this.localAnalyzer && this.localDataArray) {
        this.localAnalyzer.getByteTimeDomainData(
          this.localDataArray as any,
        );
        const level = this.computeLevel(this.localDataArray);
        this.isLocalSpeaking.set(!this.isMuted() && level > 0.01);
      }

      if (this.remoteAnalyzer && this.remoteDataArray) {
        this.remoteAnalyzer.getByteTimeDomainData(
          this.remoteDataArray as any,
        );
        const level = this.computeLevel(this.remoteDataArray);
        this.isRemoteSpeaking.set(level > 0.01);
      }
    };

    this.levelRafId = requestAnimationFrame(loop);
  }

  private stopLevelLoop() {
    if (this.levelRafId !== null) {
      cancelAnimationFrame(this.levelRafId);
      this.levelRafId = null;
    }
  }

  private computeLevel(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  }

  private async handleRemoteOffer(offer: WebRtcOffer) {
    if (!this.peerId) {
      console.error('[P2pService] handleRemoteOffer: missing peerId');
      return;
    }

    if (this.offerHandled) {
      console.warn(
        '[P2pService] handleRemoteOffer: offer already handled, skipping',
      );
      return;
    }
    this.offerHandled = true;

    if (!this.pc) {
      console.warn('[P2pService] handleRemoteOffer: pc is null, init now');
      await this.initPeerConnection(false, this.peerId);
    }

    if (!this.pc) {
      console.error('[P2pService] handleRemoteOffer: pc still null after init');
      return;
    }

    try {
      console.log('[P2pService] handleRemoteOffer', offer);
      console.log(
        '[P2pService] handleRemoteOffer signalingState BEFORE =',
        this.pc.signalingState,
      );

      const desc = new RTCSessionDescription({
        type: 'offer',
        sdp: offer.sdp,
      });

      await this.pc.setRemoteDescription(desc);

      try {
        await this.ensureLocalStream(this.pc);
      } catch (err) {
        console.error('[P2pService] getUserMedia failed (callee)', err);
        this.error.set('Microphone access denied');
        this.connecting.set(false);
        return;
      }

      this.setupLocalLevelMeter();
      this.setupRemoteLevelMeter();

      this.flushPendingIce();

      console.log(
        '[P2pService] handleRemoteOffer signalingState BEFORE createAnswer =',
        this.pc.signalingState,
      );

      if (this.pc.signalingState !== 'have-remote-offer') {
        console.warn(
          '[P2pService] handleRemoteOffer: unexpected signalingState before createAnswer:',
          this.pc.signalingState,
        );
        return;
      }

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.callService.sendAnswer(
        offer.callId,
        offer.fromUserId,
        answer.sdp ?? '',
      );

      this.connecting.set(false);
    } catch (e) {
      console.error('[P2pService] handleRemoteOffer ERROR', e);
      this.error.set('Failed to handle remote offer');
      this.connecting.set(false);
    }
  }

  private async handleRemoteAnswer(answer: WebRtcAnswer & { callId?: string }) {
    if (!this.pc) {
      console.error('[P2pService] handleRemoteAnswer: pc is null (caller)');
      return;
    }

    const state = this.pc.signalingState;
    console.log('[P2pService] handleRemoteAnswer signalingState =', state);

    if (state !== 'have-local-offer') {
      console.warn('[P2pService] ignoring answer in unexpected state', state);
      return;
    }

    try {
      console.log('[P2pService] handleRemoteAnswer', answer);

      const desc = new RTCSessionDescription({
        type: 'answer',
        sdp: answer.sdp,
      });

      await this.pc.setRemoteDescription(desc);

      this.flushPendingIce();

      this.connecting.set(false);
    } catch (e) {
      console.error('[P2pService] handleRemoteAnswer ERROR', e);
      this.error.set('Failed to apply remote answer');
      this.connecting.set(false);
    }
  }

  private handleRemoteIce(ice: WebRtcIceCandidate) {
    if (!this.pc || !this.pc.remoteDescription) {
      console.log('[P2pService] queue ICE, pc or remoteDescription missing');
      this.pendingIce.push(ice);
      return;
    }

    this.addIceCandidate(ice);
  }

  private flushPendingIce() {
    if (!this.pc || !this.pc.remoteDescription) return;

    console.log('[P2pService] flushing', this.pendingIce.length, 'pending ICE');
    this.pendingIce.forEach((ice) => this.addIceCandidate(ice));
    this.pendingIce = [];
  }

  private addIceCandidate(ice: WebRtcIceCandidate) {
    if (!this.pc) return;
    if (!ice.candidate) return;

    const candidate = new RTCIceCandidate({
      candidate: ice.candidate,
      sdpMid: ice.sdpMid ?? undefined,
      sdpMLineIndex: ice.sdpMLineIndex ?? undefined,
    });

    this.pc.addIceCandidate(candidate).catch((err) => {
      console.error('[P2pService] Error adding ICE candidate', err);
    });
  }

  cleanup() {
    console.log('[P2pService] cleanup');

    this.unregisterOffer?.();
    this.unregisterAnswer?.();
    this.unregisterIce?.();
    this.unregisterHangup?.();
    this.unregisterOffer = undefined;
    this.unregisterAnswer = undefined;
    this.unregisterIce = undefined;
    this.unregisterHangup = undefined;

    this.pc?.getSenders().forEach((sender) => sender.track?.stop());
    this.pc?.close();
    this.pc = null;

    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;

    this.remoteStream = new MediaStream();
    this.pendingIce = [];
    this.offerHandled = false;
    this.connecting.set(false);

    this.stopLevelLoop();
    this.localAnalyzer = null;
    this.remoteAnalyzer = null;
    this.localDataArray = undefined;
    this.remoteDataArray = undefined;

    if (this.audioCtx) {
      void this.audioCtx.close();
      this.audioCtx = null;
    }

    if (this.remoteAudioEl) {
      this.remoteAudioEl.srcObject = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
