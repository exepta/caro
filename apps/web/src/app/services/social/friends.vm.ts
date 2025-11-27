export interface FriendVm {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  accentColor: string | null;
}

export interface FriendRequestVm {
  friendshipId: string;
  userId: string;
  username: string;
  email: string;
  direction: 'OUTGOING' | 'INCOMING';
  status: string;
  createdAt: string;

  displayName?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  accentColor?: string | null;
}
