import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { FriendVm, FriendRequestVm } from './friends.vm';

import {
  FriendResponse,
  FriendRequestResponse,
  FriendsInternalService,
  UserInternalService,
  UserSettingsResponse,
} from '../api';

@Injectable({ providedIn: 'root' })
export class FriendService {
  constructor(
    private readonly friendApi: FriendsInternalService,
    private readonly userApi: UserInternalService,
  ) {}

  getFriends(): Observable<FriendVm[]> {
    return this.friendApi.getFriends().pipe(
      switchMap((friends: FriendResponse[] | null | undefined) => {
        if (!friends || friends.length === 0) {
          return of<FriendVm[]>([]);
        }

        const calls = friends.map((f) => {
          const id = f.id!;
          return this.userApi.getUserById(id).pipe(
            map((user: UserSettingsResponse) => this.mapToVm(f, user)),
          );
        });

        return forkJoin(calls);
      }),
    );
  }

  getOutgoingFriendRequests(): Observable<FriendRequestVm[]> {
    return this.friendApi.getOutgoingFriendRequests().pipe(
      switchMap((requests: FriendRequestResponse[] | null | undefined) => {
        if (!requests || requests.length === 0) {
          return of<FriendRequestVm[]>([]);
        }

        const calls = requests.map((req) => {
          const userId = req.userId!;
          return this.userApi.getUserById(userId).pipe(
            map((user: UserSettingsResponse) => this.mapRequestToVm(req, user)),
          );
        });

        return forkJoin(calls);
      }),
    );
  }

  getIncomingFriendRequests(): Observable<FriendRequestVm[]> {
    return this.friendApi.getIncomingFriendRequests().pipe(
      switchMap((requests: FriendRequestResponse[] | null | undefined) => {
        if (!requests || requests.length === 0) {
          return of<FriendRequestVm[]>([]);
        }

        const calls = requests.map((req) => {
          const userId = req.userId!;
          return this.userApi.getUserById(userId).pipe(
            map((user: UserSettingsResponse) => this.mapRequestToVm(req, user)),
          );
        });

        return forkJoin(calls);
      }),
    );
  }

  // -----------------------
  // Actions
  // -----------------------

  sendFriendRequest(targetUserId: string): Observable<void> {
    return this.friendApi.sendFriendRequest({ targetUserId }) as unknown as Observable<void>;
  }

  acceptFriendRequest(friendshipId: string): Observable<void> {
    return this.friendApi.acceptFriendRequest(friendshipId) as unknown as Observable<void>;
  }

  unfriend(friendId: string): Observable<void> {
    return this.friendApi.unfriend(friendId) as unknown as Observable<void>;
  }

  // -----------------------
  // Mapper
  // -----------------------

  private mapToVm(friend: FriendResponse, user: UserSettingsResponse): FriendVm {
    const profile = user.profile ?? {};

    return {
      id: friend.id!,
      username: friend.username ?? user.username ?? '',
      displayName: profile.displayName ?? user.username ?? '',
      avatarUrl: profile.avatarUrl ?? null,
      bannerUrl: profile.bannerUrl ?? null,
      accentColor: profile.accentColor ?? null,
    };
  }

  private mapRequestToVm(
    r: FriendRequestResponse,
    user: UserSettingsResponse,
  ): FriendRequestVm {
    const profile = user.profile ?? {};

    return {
      friendshipId: r.friendshipId!,
      userId: r.userId!,
      username: r.username ?? user.username ?? '',
      email: r.email ?? user.email ?? '',
      direction: r.direction as FriendRequestVm['direction'], // "OUTGOING" | "INCOMING"
      status: r.status ?? 'PENDING',
      createdAt: r.createdAt!,

      displayName: profile.displayName ?? user.username ?? '',
      avatarUrl: profile.avatarUrl ?? null,
      bannerUrl: profile.bannerUrl ?? null,
      accentColor: profile.accentColor ?? null,
    };
  }
}
