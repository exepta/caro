import {Component, inject, Input, signal} from '@angular/core';
import {FriendRequestVm, FriendVm} from '../../../../../services/social/friends.vm';
import {DatePipe, UpperCasePipe} from '@angular/common';
import {FriendService} from '../../../../../services/social/friend.service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faBan, faCheck, faXmark} from '@fortawesome/free-solid-svg-icons';
import {switchMap} from 'rxjs/operators';
import {TooltipComponent} from '../../../../components/tooltip/tooltip.component';

@Component({
  selector: 'app-pending-tab',
  imports: [
    DatePipe,
    FaIconComponent,
    UpperCasePipe,
    TooltipComponent
  ],
  templateUrl: './pending-tab.html',
  styleUrls: ['./pending-tab.scss', '../../../../../shared/styles/friends-list.scss']
})
export class PendingTab {
  private readonly friendService = inject(FriendService);

  @Input({ required: true }) outgoingRequests = signal<FriendRequestVm[]>([]);
  @Input({ required: true }) incomingRequests = signal<FriendRequestVm[]>([]);
  @Input({ required: true }) friends = signal<FriendVm[]>([]);

  acceptRequest(req: FriendRequestVm) {
    this.friendService.acceptFriendRequest(req.friendshipId)
      .pipe(
        switchMap(() => this.friendService.getFriends()),
      )
      .subscribe({
        next: (friends) => {
          this.incomingRequests.update(list =>
            list.filter(r => r.friendshipId !== req.friendshipId),
          );
          this.friends.set(friends);
        },
        error: (err) => {
          console.error('Failed to accept friend request', err);
        },
      });
  }

  declineRequest(req: FriendRequestVm) {
    this.friendService.declineFriendRequest(req.friendshipId).subscribe({
      next: () => {
        this.incomingRequests.update(list =>
          list.filter(r => r.friendshipId !== req.friendshipId),
        );
      },
      error: (err) => {
        console.error('Failed to decline friend request', err);
      },
    });
  }

  cancelRequest(req: FriendRequestVm) {
    this.friendService.cancelFriendRequest(req.friendshipId)
      .pipe(
        switchMap(() => this.friendService.getOutgoingFriendRequests()),
      )
      .subscribe({
        next: (reqs) => this.outgoingRequests.set(reqs),
        error: (err) => {
          console.error('Failed to cancel friend request', err);
        },
      });
  }

  blockRequest(req: FriendRequestVm) {
    console.log('Block not implemented yet for', req);
  }

  protected readonly faCheck = faCheck;
  protected readonly faXmark = faXmark;
  protected readonly faBan = faBan;
}
