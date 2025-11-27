import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { CallService } from '../../services/voice/call.service';
import { UserService } from '../../services/user/user.service';
import { UserSettingsResponse } from '../../api';
import { SideBar, SideBarSection } from '../components/side-bar/side-bar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {P2pService} from '../../services/voice/p2p.service';

@Component({
  selector: 'app-call-page',
  standalone: true,
  imports: [SideBar, FaIconComponent],
  templateUrl: './call-page.html',
  styleUrl: './call-page.scss',
})
export class CallPage implements OnInit, OnDestroy, AfterViewInit {
  private readonly p2p = inject(P2pService);
  private readonly callService = inject(CallService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('remoteAudio', { static: false })
  remoteAudioRef?: ElementRef<HTMLAudioElement>;

  localUser = signal<UserSettingsResponse | null>(null);
  remoteUser = signal<UserSettingsResponse | null>(null);

  currentSection = signal<SideBarSection>('friends');

  connecting = this.p2p.connecting;
  error = this.p2p.error;
  isLocalSpeaking = this.p2p.isLocalSpeaking;
  isRemoteSpeaking = this.p2p.isRemoteSpeaking;
  isMuted = this.p2p.isMuted;
  remoteVolume = this.p2p.remoteVolume;
  showVolumeSlider = this.p2p.showVolumeSlider;

  private callId: string | null = null;
  private peerId: string | null = null;
  private isCaller = false;

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
  }

  ngAfterViewInit(): void {
    if (!this.callId || !this.peerId || this.remoteAudioRef == null) {
      return;
    }

    this.p2p.init(
      this.callId,
      this.peerId,
      this.isCaller,
      this.remoteAudioRef.nativeElement,
    );
  }

  onSectionChange(section: SideBarSection) {
    this.currentSection.set(section);
  }

  toggleMute() {
    this.p2p.toggleMute();
  }

  toggleVolumeSlider() {
    this.p2p.toggleVolumeSlider();
  }

  onVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const value = Number(target.value);
    this.p2p.onVolumeChange(value);
  }

  hangup() {
    this.p2p.hangup();
  }

  ngOnDestroy(): void {
    this.p2p.cleanup();
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
