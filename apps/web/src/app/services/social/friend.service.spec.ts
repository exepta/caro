import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FriendService } from './friend.service';
import {
  FriendResponse,
  FriendRequestResponse,
  FriendsInternalService,
  UserInternalService,
  UserSettingsResponse,
} from '../../api';

describe('FriendService', () => {
  let service: FriendService;

  let friendsApiMock: {
    getFriends: jest.Mock;
    getOutgoingFriendRequests: jest.Mock;
    getIncomingFriendRequests: jest.Mock;
    sendFriendRequest: jest.Mock;
    cancelFriendRequest: jest.Mock;
    acceptFriendRequest: jest.Mock;
    declineFriendRequest: jest.Mock;
    unfriend: jest.Mock;
  };

  let userApiMock: {
    getUserById: jest.Mock;
  };

  beforeEach(() => {
    friendsApiMock = {
      getFriends: jest.fn(),
      getOutgoingFriendRequests: jest.fn(),
      getIncomingFriendRequests: jest.fn(),
      sendFriendRequest: jest.fn(),
      cancelFriendRequest: jest.fn(),
      acceptFriendRequest: jest.fn(),
      declineFriendRequest: jest.fn(),
      unfriend: jest.fn(),
    };

    userApiMock = {
      getUserById: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FriendService,
        { provide: FriendsInternalService, useValue: friendsApiMock },
        { provide: UserInternalService, useValue: userApiMock },
      ],
    });

    service = TestBed.inject(FriendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getFriends should map FriendResponse + UserSettingsResponse to FriendVm[]', (done) => {
    const friendResponses: FriendResponse[] = [
      { id: 'f1', username: 'friend1' } as FriendResponse,
      { id: 'f2', username: 'friend2' } as FriendResponse,
    ];

    const users: Record<string, UserSettingsResponse> = {
      f1: {
        id: 'f1',
        username: 'friend1',
        profile: {
          displayName: 'Friend One',
          avatarUrl: 'avatar1',
          bannerUrl: 'banner1',
          accentColor: '#111111',
        } as any,
      } as UserSettingsResponse,
      f2: {
        id: 'f2',
        username: 'friend2',
        profile: {} as any,
      } as UserSettingsResponse,
    };

    friendsApiMock.getFriends.mockReturnValue(of(friendResponses));
    userApiMock.getUserById.mockImplementation((id: string) => of(users[id]));

    service.getFriends().subscribe((result) => {
      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        id: 'f1',
        username: 'friend1',
        displayName: 'Friend One',
        avatarUrl: 'avatar1',
        bannerUrl: 'banner1',
        accentColor: '#111111',
      });

      expect(result[1]).toEqual({
        id: 'f2',
        username: 'friend2',
        displayName: 'friend2',
        avatarUrl: null,
        bannerUrl: null,
        accentColor: null,
      });

      done();
    });
  });

  it('getFriends should return empty array when API returns null or empty', (done) => {
    friendsApiMock.getFriends.mockReturnValue(of(null));

    service.getFriends().subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  it('getOutgoingFriendRequests should map responses to FriendRequestVm[]', (done) => {
    const reqResponses: FriendRequestResponse[] = [
      {
        friendshipId: 'fs1',
        userId: 'u1',
        username: 'user1',
        email: 'user1@example.com',
        direction: 'OUTGOING',
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
      } as FriendRequestResponse,
    ];

    const user: UserSettingsResponse = {
      id: 'u1',
      username: 'user1',
      email: 'user1@example.com',
      profile: {
        displayName: 'User One',
        avatarUrl: 'avatar',
        bannerUrl: 'banner',
        accentColor: '#abcdef',
      } as any,
    } as UserSettingsResponse;

    friendsApiMock.getOutgoingFriendRequests.mockReturnValue(of(reqResponses));
    userApiMock.getUserById.mockReturnValue(of(user));

    service.getOutgoingFriendRequests().subscribe((result) => {
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        friendshipId: 'fs1',
        userId: 'u1',
        username: 'user1',
        email: 'user1@example.com',
        direction: 'OUTGOING',
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        displayName: 'User One',
        avatarUrl: 'avatar',
        bannerUrl: 'banner',
        accentColor: '#abcdef',
      });
      done();
    });
  });

  it('getIncomingFriendRequests should return [] when API returns empty', (done) => {
    friendsApiMock.getIncomingFriendRequests.mockReturnValue(of([]));

    service.getIncomingFriendRequests().subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  it('sendFriendRequest should delegate to API', (done) => {
    friendsApiMock.sendFriendRequest.mockReturnValue(of(void 0));

    service.sendFriendRequest('target-id').subscribe(() => {
      expect(friendsApiMock.sendFriendRequest).toHaveBeenCalledWith({
        targetUserId: 'target-id',
      });
      done();
    });
  });

  it('cancelFriendRequest should delegate to API', (done) => {
    friendsApiMock.cancelFriendRequest.mockReturnValue(of(void 0));

    service.cancelFriendRequest('fs1').subscribe(() => {
      expect(friendsApiMock.cancelFriendRequest).toHaveBeenCalledWith('fs1');
      done();
    });
  });

  it('acceptFriendRequest should delegate to API', (done) => {
    friendsApiMock.acceptFriendRequest.mockReturnValue(of(void 0));

    service.acceptFriendRequest('fs1').subscribe(() => {
      expect(friendsApiMock.acceptFriendRequest).toHaveBeenCalledWith('fs1');
      done();
    });
  });

  it('declineFriendRequest should delegate to API', (done) => {
    friendsApiMock.declineFriendRequest.mockReturnValue(of(void 0));

    service.declineFriendRequest('fs1').subscribe(() => {
      expect(friendsApiMock.declineFriendRequest).toHaveBeenCalledWith('fs1');
      done();
    });
  });

  it('unfriend should delegate to API', (done) => {
    friendsApiMock.unfriend.mockReturnValue(of(void 0));

    service.unfriend('friend-id').subscribe(() => {
      expect(friendsApiMock.unfriend).toHaveBeenCalledWith('friend-id');
      done();
    });
  });

  it('getOutgoingFriendRequests should return empty array when API returns null', (done) => {
    friendsApiMock.getOutgoingFriendRequests.mockReturnValue(of(null));

    service.getOutgoingFriendRequests().subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  it('getIncomingFriendRequests should map responses to FriendRequestVm[]', (done) => {
    const reqResponses: FriendRequestResponse[] = [
      {
        friendshipId: 'fs1',
        userId: 'u1',
        username: 'user1',
        email: 'user1@example.com',
        direction: 'INCOMING',
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
      } as FriendRequestResponse,
    ];

    const user: UserSettingsResponse = {
      id: 'u1',
      username: 'user1',
      email: 'user1@example.com',
      profile: {
        displayName: 'User One',
        avatarUrl: 'avatar',
        bannerUrl: 'banner',
        accentColor: '#abcdef',
      } as any,
    } as UserSettingsResponse;

    friendsApiMock.getIncomingFriendRequests.mockReturnValue(of(reqResponses));
    userApiMock.getUserById.mockReturnValue(of(user));

    service.getIncomingFriendRequests().subscribe((result) => {
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        friendshipId: 'fs1',
        userId: 'u1',
        username: 'user1',
        email: 'user1@example.com',
        direction: 'INCOMING',
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        displayName: 'User One',
        avatarUrl: 'avatar',
        bannerUrl: 'banner',
        accentColor: '#abcdef',
      });
      done();
    });
  });
});
