import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CallService,
  WebRtcIceCandidate,
  WebRtcOffer,
  WebRtcAnswer,
  CallHangupEvent,
} from '../../services/voice/call.service';
import { UserService } from '../../services/user/user.service';
import { UserSettingsResponse } from '../../api';
import { SideBar, SideBarSection } from '../components/side-bar/side-bar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faPhoneSlash,
  faVolumeOff,
  faVolumeXmark,
  faVolumeLow,
  faVolumeHigh,
  faWifi,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-call-page',
  standalone: true,
  imports: [SideBar, FaIconComponent],
  templateUrl: './call-page.html',
  styleUrl: './call-page.scss',
})
export class CallPage implements OnInit, OnDestroy {
  private readonly callService = inject(CallService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('remoteAudio', { static: false })
  remoteAudioRef?: ElementRef<HTMLAudioElement>;

  pc: RTCPeerConnection | null = null;
  localStream: MediaStream | null = null;
  remoteStream = new MediaStream();
  private pendingIce: WebRtcIceCandidate[] = [];

  connecting = signal(true);
  error = signal<string | null>(null);

  localUser = signal<UserSettingsResponse | null>(null);
  remoteUser = signal<UserSettingsResponse | null>(null);

  isLocalSpeaking = signal(false);
  isRemoteSpeaking = signal(false);
  isMuted = signal(false);
  remoteVolume = signal(1);

  showVolumeSlider = signal(false);

  private callId: string | null = null;
  private peerId: string | null = null;
  private isCaller = false;

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

  currentSection = signal<SideBarSection>('friends');

  volumeIcon = computed(() => {
    const v = this.remoteVolume();
    if (v === 0) return this.faVolumeXmark;
    if (v <= 0.33) return this.faVolumeOff;
    if (v <= 0.66) return this.faVolumeLow;
    return this.faVolumeHigh;
  });

  openSettings() {
    void this.router.navigateByUrl('/settings');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Missing call id');
      this.connecting.set(false);
      return;
    }
    this.callId = id;

    const active = this.callService.activeCall();
    if (!active || active.callId !== id) {
      this.error.set('No active call for this id');
      this.connecting.set(false);
      return;
    }

    this.peerId = active.peerId;
    this.isCaller = active.isCaller;

    this.userService.currentUser().subscribe({
      next: (me) => this.localUser.set(me),
      error: (err) => console.error('Failed to load local user', err),
    });

    this.userService.getUserById(active.peerId).subscribe({
      next: (user) => this.remoteUser.set(user),
      error: (err) => console.error('Failed to load remote user', err),
    });

    this.unregisterOffer = this.callService.registerOfferHandler((offer: WebRtcOffer) => {
      if (!this.callId || offer.callId !== this.callId) return;
      console.log('[CallPage] handler: offer', offer);
      void this.handleRemoteOffer(offer);
    });

    this.unregisterAnswer = this.callService.registerAnswerHandler((answer: WebRtcAnswer) => {
      if (!this.callId || answer.callId !== this.callId) return;
      console.log('[CallPage] handler: answer', answer);
      void this.handleRemoteAnswer(answer);
    });

    this.unregisterIce = this.callService.registerIceHandler((ice: WebRtcIceCandidate) => {
      if (!this.callId || ice.callId !== this.callId) return;
      console.log('[CallPage] handler: ice', ice);
      this.handleRemoteIce(ice);
    });

    this.unregisterHangup = this.callService.registerHangupHandler((evt: CallHangupEvent) => {
      if (!this.callId || evt.callId !== this.callId) return;
      console.log('[CallPage] handler: hangup', evt);
      this.cleanup();
      this.callService.activeCall.set(null);
      void this.router.navigate(['/']);
    });

    this.initPeerConnection(this.isCaller, this.peerId).catch((err) => {
      console.error('Error in initPeerConnection', err);
      this.error.set('Failed to setup WebRTC');
      this.connecting.set(false);
    });
  }

  onSectionChange(section: SideBarSection) {
    this.currentSection.set(section);
  }

  private async initPeerConnection(isCaller: boolean, peerId: string | null) {
    if (this.pc) {
      console.warn('[CallPage] pc already exists, skipping init');
      return;
    }

    if (!this.callId) {
      console.error('[CallPage] missing callId in initPeerConnection');
      return;
    }

    if (!peerId) {
      console.error('[CallPage] missing peerId in initPeerConnection');
      return;
    }

    console.log('[CallPage] initPeerConnection', { isCaller, peerId });

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      console.log('[CallPage] local ICE → peer', peerId);
      this.callService.sendIceCandidate(this.callId!, peerId, event.candidate);
    };

    pc.ontrack = (event) => {
      console.log(
        '[CallPage] ontrack, remote tracks:',
        event.streams[0].getTracks().length,
      );
      event.streams[0].getTracks().forEach((track) => {
        console.log(
          '[CallPage] remote track kind=' + track.kind + ' muted=' + track.muted,
          track.getSettings ? track.getSettings() : {},
        );
        this.remoteStream.addTrack(track);
        track.onunmute = () => {
          console.log('[CallPage] remote track onunmute fired');
          this.isRemoteSpeaking.set(true);
        };
      });

      const el = this.remoteAudioRef?.nativeElement;
      if (el) {
        el.srcObject = this.remoteStream;
        el.volume = this.remoteVolume();
        el.play().catch((err) => {
          console.warn('[CallPage] remote audio play() failed', err);
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
        console.error('getUserMedia failed (caller)', err);
        this.error.set('Microphone access denied');
        this.connecting.set(false);
        return;
      }

      this.setupLocalLevelMeter();

      console.log('[CallPage] creating offer as caller');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.callService.sendOffer(this.callId!, peerId, offer.sdp ?? '');
      this.connecting.set(true);
    } else {
      console.log('[CallPage] callee ready, waiting for offer');
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
      console.log('[CallPage] addTrack local', {
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
    this.remoteDataArray = new Uint8Array(this.remoteAnalyzer.frequencyBinCount);
    source.connect(this.remoteAnalyzer);

    this.startLevelLoop();
  }

  private startLevelLoop() {
    if (this.levelRafId !== null) return;

    const loop = () => {
      this.levelRafId = requestAnimationFrame(loop);

      if (this.localAnalyzer && this.localDataArray) {
        // TS2345 fix: force to the signature type
        this.localAnalyzer.getByteTimeDomainData(
          this.localDataArray as any,
        );
        const level = this.computeLevel(this.localDataArray);
        this.isLocalSpeaking.set(!this.isMuted() && level > 0.02);
      }

      if (this.remoteAnalyzer && this.remoteDataArray) {
        // TS2345 fix: force to the signature type
        this.remoteAnalyzer.getByteTimeDomainData(
          this.remoteDataArray as any,
        );
        const level = this.computeLevel(this.remoteDataArray);
        this.isRemoteSpeaking.set(level > 0.02);
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
      console.error('[CallPage] handleRemoteOffer: missing peerId');
      return;
    }

    if (this.offerHandled) {
      console.warn(
        '[CallPage] handleRemoteOffer: offer already handled, skipping',
      );
      return;
    }
    this.offerHandled = true;

    if (!this.pc) {
      console.warn('[CallPage] handleRemoteOffer: pc is null, init now');
      await this.initPeerConnection(false, this.peerId);
    }

    if (!this.pc) {
      console.error('[CallPage] handleRemoteOffer: pc still null after init');
      return;
    }

    try {
      console.log('[CallPage] handleRemoteOffer', offer);
      console.log(
        '[CallPage] handleRemoteOffer signalingState BEFORE =',
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
        console.error('getUserMedia failed (callee)', err);
        this.error.set('Microphone access denied');
        this.connecting.set(false);
        return;
      }

      this.setupLocalLevelMeter();
      this.setupRemoteLevelMeter();

      this.flushPendingIce();

      console.log(
        '[CallPage] handleRemoteOffer signalingState BEFORE createAnswer =',
        this.pc.signalingState,
      );

      if (this.pc.signalingState !== 'have-remote-offer') {
        console.warn(
          '[CallPage] handleRemoteOffer: unexpected signalingState before createAnswer:',
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
      console.error('[CallPage] handleRemoteOffer ERROR', e);
      this.error.set('Failed to handle remote offer');
      this.connecting.set(false);
    }
  }

  private async handleRemoteAnswer(answer: WebRtcAnswer & { callId?: string }) {
    if (!this.pc) {
      console.error('[CallPage] handleRemoteAnswer: pc is null (caller)');
      return;
    }

    const state = this.pc.signalingState;
    console.log('[CallPage] handleRemoteAnswer signalingState =', state);

    if (state !== 'have-local-offer') {
      console.warn('[CallPage] ignoring answer in unexpected state', state);
      return;
    }

    try {
      console.log('[CallPage] handleRemoteAnswer', answer);

      const desc = new RTCSessionDescription({
        type: 'answer',
        sdp: answer.sdp,
      });

      await this.pc.setRemoteDescription(desc);

      this.flushPendingIce();

      this.connecting.set(false);
    } catch (e) {
      console.error('[CallPage] handleRemoteAnswer ERROR', e);
      this.error.set('Failed to apply remote answer');
      this.connecting.set(false);
    }
  }

  private handleRemoteIce(ice: WebRtcIceCandidate) {
    if (!this.pc || !this.pc.remoteDescription) {
      console.log('[CallPage] queue ICE, pc or remoteDescription missing');
      this.pendingIce.push(ice);
      return;
    }

    this.addIceCandidate(ice);
  }

  private flushPendingIce() {
    if (!this.pc || !this.pc.remoteDescription) return;

    console.log('[CallPage] flushing', this.pendingIce.length, 'pending ICE');
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
      console.error('Error adding ICE candidate', err);
    });
  }

  toggleMute() {
    const newMuted = !this.isMuted();
    this.isMuted.set(newMuted);

    const tracks = this.localStream?.getAudioTracks() ?? [];
    console.log('[CallPage] toggleMute', {
      newMuted,
      trackCount: tracks.length,
    });

    tracks.forEach((track) => {
      track.enabled = !newMuted;
      console.log(
        '[CallPage] local track kind=' +
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

  toggleVolumeSlider() {
    this.showVolumeSlider.update((v) => !v);
  }

  onVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const value = Number(target.value);
    const clamped = Math.min(1, Math.max(0, value));

    this.remoteVolume.set(clamped);

    const el = this.remoteAudioRef?.nativeElement;
    if (el) {
      el.volume = clamped;
    }
  }

  hangup() {
    const active = this.callService.activeCall();
    const callId = active?.callId ?? this.callId;
    const peerId = active?.peerId ?? this.peerId;

    if (callId && peerId) {
      this.callService.sendHangup(callId, peerId);
    }

    this.cleanup();
    this.callService.activeCall.set(null);
    void this.router.navigate(['/']);
  }

  cleanup() {
    console.log('[CallPage] cleanup');

    this.unregisterOffer?.();
    this.unregisterAnswer?.();
    this.unregisterIce?.();
    this.unregisterHangup?.();

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

    const el = this.remoteAudioRef?.nativeElement;
    if (el) {
      el.srcObject = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  protected readonly faMicrophone = faMicrophone;
  protected readonly faMicrophoneSlash = faMicrophoneSlash;
  protected readonly faPhoneSlash = faPhoneSlash;
  protected readonly faVolumeOff = faVolumeOff;
  protected readonly faVolumeXmark = faVolumeXmark;
  protected readonly faVolumeLow = faVolumeLow;
  protected readonly faVolumeHigh = faVolumeHigh;
  protected readonly faWifi = faWifi;
}
