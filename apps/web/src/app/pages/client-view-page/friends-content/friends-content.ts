import {Component, inject, OnInit, signal} from '@angular/core';
import {faPlus, faUser} from '@fortawesome/free-solid-svg-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {FriendRequestVm, FriendVm} from '../../../services/friends.vm';
import {FriendService} from '../../../services/friend.service';
import {UserService} from '../../../services/user.service';
import {debounceTime, distinctUntilChanged, of, Subject} from 'rxjs';
import {UserSettingsResponse} from '../../../api';
import {switchMap} from 'rxjs/operators';
import {AllTab} from './tabs/all-tab/all-tab';
import {PendingTab} from './tabs/pending-tab/pending-tab';

@Component({
  selector: 'app-friends-content',
  imports: [
    FaIconComponent,
    AllTab,
    PendingTab
  ],
  templateUrl: './friends-content.html',
  styleUrl: './friends-content.scss',
})
export class FriendsContent implements OnInit {

  private readonly friendService = inject(FriendService);
  private readonly userService = inject(UserService);

  private searchInput$ = new Subject<string>();

  friends = signal<FriendVm[]>([]);
  outgoingRequests = signal<FriendRequestVm[]>([]);
  incomingRequests = signal<FriendRequestVm[]>([]);

  searchResults = signal<UserSettingsResponse[]>([]);
  isFriendAddOpen = false;

  activeTab = signal<'all' | 'pending'>('all');

  ngOnInit(): void {
    this.friendService.getFriends().subscribe({
      next: (friends) => this.friends.set(friends),
    });

    this.friendService.getOutgoingFriendRequests().subscribe({
      next: (reqs) => this.outgoingRequests.set(reqs),
    });

    this.friendService.getIncomingFriendRequests().subscribe({
      next: (reqs) => this.incomingRequests.set(reqs),
    });

    this.searchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          const q = term.trim();
          if (q.length < 2) {
            return of<UserSettingsResponse[]>([]);
          }
          return this.userService.searchUsersByUsername(q);
        }),
      )
      .subscribe((results) => this.searchResults.set(results));
  }

  setTab(tab: 'all' | 'pending') {
    this.activeTab.set(tab);
  }

  openFriendAdd() {
    this.isFriendAddOpen = true;
    this.searchResults.set([]);
  }

  closeFriendAdd() {
    this.isFriendAddOpen = false;
    this.searchResults.set([]);
  }

  onFriendSearchInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    this.searchInput$.next(target.value);
  }

  sendFriendRequest(user: UserSettingsResponse) {
    this.friendService.sendFriendRequest(user.id!).subscribe({
      next: () => {
        console.log('Friend request sent to', user.username);
      },
      error: (err) => {
        console.error('Failed to send friend request', err);
      },
    });
  }

  protected readonly faUser = faUser;
  protected readonly faPlus = faPlus;
}
