import {Component, EventEmitter, Input, Output, signal} from '@angular/core';
import {FriendVm} from '../../../../../services/friends.vm';
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {TooltipComponent} from "../../../../components/tooltip/tooltip.component";
import {faCheck, faComment, faEnvelope, faPhone} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-all-tab',
    imports: [
        FaIconComponent,
        TooltipComponent
    ],
  templateUrl: './all-tab.html',
  styleUrls: ['./all-tab.scss', '../../../../../shared/styles/friends-list.scss']
})
export class AllTab {

  @Input({ required: true }) friends = signal<FriendVm[]>([]);

  @Output()
  friendAddClick = new EventEmitter<void>();

  @Output()
  callFriendClick = new EventEmitter<FriendVm>();

  onFriendAddClick() {
    this.friendAddClick.emit();
  }

  onCall(friend: FriendVm) {
    this.callFriendClick.emit(friend);
  }

  protected readonly faPhone = faPhone;
  protected readonly faComment = faComment;
}
