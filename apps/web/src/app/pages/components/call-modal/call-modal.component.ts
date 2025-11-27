import {
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CallInvite, CallService, CallHangupEvent } from '../../../services/voice/call.service';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
import { UserSettingsResponse } from '../../../api';
import { UserService } from '../../../services/user/user.service';
import { AudioService } from '../../../services/voice/audio.service';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './call-modal.component.html',
  styleUrl: './call-modal.component.scss',
})
export class CallModalComponent implements OnDestroy {
  private readonly callService = inject(CallService);
  private readonly userService = inject(UserService);
  private readonly audioService = inject(AudioService);
  private readonly router = inject(Router);

  call = this.callService.callInvite;

  caller = signal<UserSettingsResponse | null>(null);
  callerLoading = signal(false);
  callerError = signal<string | null>(null);

  private readonly unregisterHangup?: () => void;

  constructor() {
    effect(() => {
      const callObject = this.call();

      if (!callObject) {
        this.audioService.stop('ringtone');
        this.caller.set(null);
        this.callerError.set(null);
        this.callerLoading.set(false);
        return;
      }

      this.audioService.playLoop('ringtone', 'audio/ringtone.mp3', {
        volume: 0.5,
      });

      this.callerLoading.set(true);
      this.callerError.set(null);

      this.userService.getUserById(callObject.fromUserId).subscribe({
        next: (user) => {
          this.caller.set(user);
          this.callerLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load caller user', err);
          this.caller.set(null);
          this.callerLoading.set(false);
          this.callerError.set('Could not load caller');
        },
      });
    });

    this.unregisterHangup = this.callService.registerHangupHandler(
      (evt: CallHangupEvent) => {
        const current = this.call();
        if (!current) return;

        if (evt.callId !== current.callId) {
          return;
        }

        console.log('[CallModal] received hangup for current invite, closing');
        this.audioService.stop('ringtone');
        this.callService.closeModal();
      },
    );
  }

  accept(callInvite: CallInvite) {
    this.audioService.stop('ringtone');

    this.callService.setActiveCallAsCallee(
      callInvite.callId,
      callInvite.fromUserId,
    );

    this.callService.acceptCall(callInvite.callId, callInvite.fromUserId);

    this.callService.closeModal();
    void this.router.navigate(['/call', callInvite.callId]);
  }

  reject(callInvite: CallInvite) {
    this.audioService.stop('ringtone');

    this.callService.sendHangup(callInvite.callId, callInvite.fromUserId);
    this.callService.rejectCall(callInvite.callId, callInvite.fromUserId);

    this.callService.closeModal();
  }

  ngOnDestroy(): void {
    this.unregisterHangup?.();
  }

  protected readonly faPhone = faPhone;
  protected readonly faXmark = faXmark;
}
