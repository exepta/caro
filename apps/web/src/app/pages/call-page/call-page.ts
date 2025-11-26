import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
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
} from '../../services/call.service';
import { UserService } from '../../services/user.service';
import { UserSettingsResponse } from '../../api';

@Component({
  selector: 'app-call-page',
  standalone: true,
  imports: [],
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

  private callId: string | null = null;
  private peerId: string | null = null;
  private isCaller = false;

  // Unregister-Funktionen für Handler
  private unregisterOffer?: () => void;
  private unregisterAnswer?: () => void;
  private unregisterIce?: () => void;
  private unregisterHangup?: () => void;

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

    // User-Daten (nur UI)
    this.userService.currentUser().subscribe({
      next: (me) => this.localUser.set(me),
      error: (err) => console.error('Failed to load local user', err),
    });

    this.userService.getUserById(active.peerId).subscribe({
      next: (user) => this.remoteUser.set(user),
      error: (err) => console.error('Failed to load remote user', err),
    });

    // === Handler registrieren (für neue STOMP-Messages) ===
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

    // PeerConnection initialisieren
    this.initPeerConnection(this.isCaller, this.peerId).catch(err => {
      console.error('Error in initPeerConnection', err);
      this.error.set('Failed to setup WebRTC');
      this.connecting.set(false);
    });

    // === RACE-FIX: schon vorhandene Signale nachträglich verarbeiten ===
    const existingOffer = this.callService.incomingOffer();
    if (existingOffer && existingOffer.callId === this.callId) {
      console.log('[CallPage] late existing offer, handling now', existingOffer);
      void this.handleRemoteOffer(existingOffer);
    }

    const existingAnswer = this.callService.incomingAnswer();
    if (existingAnswer && existingAnswer.callId === this.callId) {
      console.log('[CallPage] late existing answer, handling now', existingAnswer);
      void this.handleRemoteAnswer(existingAnswer);
    }

    const existingIce = this.callService.incomingIce();
    if (existingIce && existingIce.callId === this.callId) {
      console.log('[CallPage] late existing ICE, queueing', existingIce);
      this.handleRemoteIce(existingIce);
    }
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
      console.log('[CallPage] ontrack, remote tracks:', event.streams[0].getTracks().length);
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });

      const el = this.remoteAudioRef?.nativeElement;
      if (el) {
        el.srcObject = this.remoteStream;
        el.volume = this.remoteVolume();
        el.play().catch(err => {
          console.warn('[CallPage] remote audio play() failed', err);
        });
      }

      this.connecting.set(false);
      this.isRemoteSpeaking.set(true);
    };

    this.pc = pc;

    // Mic holen
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch (err) {
      console.error('getUserMedia failed', err);
      this.error.set('Microphone access denied');
      this.connecting.set(false);
      return;
    }

    // Local Tracks
    this.localStream.getTracks().forEach(track => {
      console.log('[CallPage] addTrack local', track.kind);
      pc.addTrack(track, this.localStream!);
    });

    if (isCaller) {
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

  private async handleRemoteOffer(offer: WebRtcOffer) {
    // Defensive: falls PC (noch) nicht existiert, jetzt initialisieren
    if (!this.peerId) {
      console.error('[CallPage] handleRemoteOffer: missing peerId');
      return;
    }

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

      const desc = new RTCSessionDescription({
        type: 'offer',
        sdp: offer.sdp,
      });

      await this.pc.setRemoteDescription(desc);

      this.flushPendingIce();

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
    this.pendingIce.forEach(ice => this.addIceCandidate(ice));
    this.pendingIce = [];
  }

  private addIceCandidate(ice: WebRtcIceCandidate) {
    if (!this.pc) return;

    const candidate = new RTCIceCandidate({
      candidate: ice.candidate,
      sdpMid: ice.sdpMid ?? undefined,
      sdpMLineIndex: ice.sdpMLineIndex ?? undefined,
    });

    this.pc.addIceCandidate(candidate).catch(err => {
      console.error('Error adding ICE candidate', err);
    });
  }

  toggleMute() {
    const newMuted = !this.isMuted();
    this.isMuted.set(newMuted);

    const tracks = this.localStream?.getAudioTracks() ?? [];
    tracks.forEach(track => {
      track.enabled = !newMuted;
    });

    if (newMuted) {
      this.isLocalSpeaking.set(false);
    }
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

    this.pc?.getSenders().forEach(sender => sender.track?.stop());
    this.pc?.close();
    this.pc = null;

    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;

    this.remoteStream = new MediaStream();
    this.pendingIce = [];
    this.connecting.set(false);

    const el = this.remoteAudioRef?.nativeElement;
    if (el) {
      el.srcObject = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
