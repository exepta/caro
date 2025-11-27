import { Component, inject, OnInit, signal } from '@angular/core';
import { faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FriendRequestVm, FriendVm } from '../../../services/social/friends.vm';
import { FriendService } from '../../../services/social/friend.service';
import { UserService } from '../../../services/user/user.service';
import { debounceTime, distinctUntilChanged, of, Subject } from 'rxjs';
import { UserSettingsResponse } from '../../../api';
import { switchMap } from 'rxjs/operators';
import { AllTab } from './tabs/all-tab/all-tab';
import { PendingTab } from './tabs/pending-tab/pending-tab';
import { NgClass } from '@angular/common';
import {CallService} from '../../../services/voice/call.service';
import {Router} from '@angular/router';
import {Modal} from '../../components/modal/modal';

@Component({
  selector: 'app-friends-content',
  imports: [
    FaIconComponent,
    AllTab,
    PendingTab,
    NgClass,
    Modal
  ],
  templateUrl: './friends-content.html',
  styleUrl: './friends-content.scss',
})
export class FriendsContent implements OnInit {

  private readonly friendService = inject(FriendService);
  private readonly userService = inject(UserService);
  private readonly callService = inject(CallService);
  private readonly router = inject(Router);

  private searchInput$ = new Subject<string>();

  friends = signal<FriendVm[]>([]);
  outgoingRequests = signal<FriendRequestVm[]>([]);
  incomingRequests = signal<FriendRequestVm[]>([]);

  searchResults = signal<UserSettingsResponse[]>([]);
  isFriendAddOpen = false;

  activeTab = signal<'all' | 'pending'>('all');
  currentUserId = signal<string | null>(null);

  ngOnInit(): void {
    this.userService.currentUser().subscribe({
      next: (me) => this.currentUserId.set(me.id ?? null),
    });

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
      .subscribe((results) => {
        const me = this.currentUserId();
        const friendIds = new Set(this.friends().map((f) => f.id));

        const filtered = results.filter((user) => {
          const id = user.id;
          if (!id) return false;

          if (me && id === me) return false;

          return !friendIds.has(id);
        });

        this.searchResults.set(filtered);
      });
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

  isOutgoingPending(user: UserSettingsResponse): boolean {
    const id = user.id;
    if (!id) return false;

    return this.outgoingRequests().some(
      (req) => req.userId === id && req.status === 'PENDING',
    );
  }

  hasIncomingPending(user: UserSettingsResponse): boolean {
    const id = user.id;
    if (!id) return false;

    return this.incomingRequests().some(
      (req) => req.userId === id && req.status === 'PENDING',
    );
  }

  onToggleFriendRequest(user: UserSettingsResponse) {
    const userId = user.id;
    if (!userId) {
      return;
    }

    const incoming = this.incomingRequests().find(
      (req) => req.userId === userId && req.status === 'PENDING',
    );

    if (incoming) {
      // Accept existing incoming request instead of sending a new one
      this.friendService.acceptFriendRequest(incoming.friendshipId).subscribe({
        next: () => {
          this.incomingRequests.update(list =>
            list.filter(r => r.friendshipId !== incoming.friendshipId),
          );

          this.friends.update(list => [
            ...list,
            {
              id: user.id!,
              username: user.username ?? '',
              displayName: user.profile?.displayName ?? user.username ?? '',
              avatarUrl: user.profile?.avatarUrl ?? null,
              bannerUrl: user.profile?.bannerUrl ?? null,
              accentColor: user.profile?.accentColor ?? null,
            },
          ]);

          this.searchResults.update(list => list.filter(u => u.id !== userId));
        },
        error: (err) => {
          console.error('Failed to accept friend request from search', err);
        },
      });

      return;
    }

    const existing = this.outgoingRequests().find(
      (req) => req.userId === userId && req.status === 'PENDING',
    );

    if (!existing) {
      this.friendService
        .sendFriendRequest(userId)
        .pipe(
          switchMap(() => this.friendService.getOutgoingFriendRequests()),
        )
        .subscribe({
          next: (reqs) => this.outgoingRequests.set(reqs),
          error: (err) => {
            console.error('Failed to send friend request', err);
          },
        });
    } else {
      this.friendService
        .cancelFriendRequest(existing.friendshipId)
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
  }

  startCall(friend: FriendVm) {
    const callId = crypto.randomUUID();
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return;

    this.callService.callUser(friend.id, callId, currentUser.id ?? '', currentUser.username!);

    console.log('Started call with', friend.username, 'as', callId);
    void this.router.navigate(['/call', callId]);
  }

  protected readonly faUser = faUser;
  protected readonly faPlus = faPlus;
}
