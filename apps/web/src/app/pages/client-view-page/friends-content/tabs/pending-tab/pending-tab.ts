import {Component, inject, Input, signal} from '@angular/core';
import {FriendRequestVm} from '../../../../../services/friends.vm';
import {DatePipe, UpperCasePipe} from '@angular/common';
import {FriendService} from '../../../../../services/friend.service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faCheck, faXmark} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-pending-tab',
  imports: [
    UpperCasePipe,
    DatePipe,
    FaIconComponent
  ],
  templateUrl: './pending-tab.html',
  styleUrls: ['./pending-tab.scss', '../../../../../shared/styles/friends-list.scss']
})
export class PendingTab {
  private readonly friendService = inject(FriendService);

  @Input({ required: true }) outgoingRequests = signal<FriendRequestVm[]>([]);
  @Input({ required: true }) incomingRequests = signal<FriendRequestVm[]>([]);


  acceptRequest(req: FriendRequestVm) {
    this.friendService.acceptFriendRequest(req.friendshipId).subscribe(() => {
      this.incomingRequests.update(list => list.filter(r => r.friendshipId !== req.friendshipId));
    });
  }

  declineRequest(req: FriendRequestVm) {
    console.log("Decline not implemented yet");
  }

  protected readonly faCheck = faCheck;
  protected readonly faXmark = faXmark;
}
