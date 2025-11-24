import {Component, EventEmitter, Input, Output, signal} from '@angular/core';
import {FriendVm} from '../../../../../services/friends.vm';

@Component({
  selector: 'app-all-tab',
  imports: [],
  templateUrl: './all-tab.html',
  styleUrls: ['./all-tab.scss', '../../../../../shared/styles/friends-list.scss']
})
export class AllTab {

  @Input({ required: true }) friends = signal<FriendVm[]>([]);

  @Output()
  friendAddClick = new EventEmitter<void>();

  onFriendAddClick() {
    this.friendAddClick.emit();
  }
}
