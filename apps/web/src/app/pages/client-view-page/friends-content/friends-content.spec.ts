import { TestBed, ComponentFixture } from '@angular/core/testing';
import {of, throwError} from 'rxjs';
import { FriendsContent } from './friends-content';
import { FriendService } from '../../../services/social/friend.service';
import { UserService } from '../../../services/user/user.service';
import { FriendRequestVm, FriendVm } from '../../../services/social/friends.vm';
import { UserSettingsResponse } from '../../../api';

describe('FriendsContent', () => {
  let fixture: ComponentFixture<FriendsContent>;
  let component: FriendsContent;

  let friendServiceMock: {
    getFriends: jest.Mock;
    getOutgoingFriendRequests: jest.Mock;
    getIncomingFriendRequests: jest.Mock;
    sendFriendRequest: jest.Mock;
    cancelFriendRequest: jest.Mock;
    acceptFriendRequest: jest.Mock;
  };

  let userServiceMock: {
    currentUser: jest.Mock;
    searchUsersByUsername: jest.Mock;
  };

  beforeEach(async () => {
    jest.useFakeTimers();

    friendServiceMock = {
      getFriends: jest.fn(),
      getOutgoingFriendRequests: jest.fn(),
      getIncomingFriendRequests: jest.fn(),
      sendFriendRequest: jest.fn(),
      cancelFriendRequest: jest.fn(),
      acceptFriendRequest: jest.fn(),
    };

    userServiceMock = {
      currentUser: jest.fn(),
      searchUsersByUsername: jest.fn(),
    };

    userServiceMock.currentUser.mockReturnValue(of({ id: 'me' }));
    friendServiceMock.getFriends.mockReturnValue(of([]));
    friendServiceMock.getOutgoingFriendRequests.mockReturnValue(of([]));
    friendServiceMock.getIncomingFriendRequests.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FriendsContent],
      providers: [
        { provide: FriendService, useValue: friendServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    })
      .overrideTemplate(FriendsContent, '')
      .compileComponents();

    fixture = TestBed.createComponent(FriendsContent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnInit should load initial data into signals', () => {
    const friends: FriendVm[] = [
      { id: 'f1', username: 'friend1', displayName: 'Friend 1', avatarUrl: null, bannerUrl: null, accentColor: null },
    ];
    const outgoing: FriendRequestVm[] = [
      {
        friendshipId: 'o1', userId: 'u1', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ];
    const incoming: FriendRequestVm[] = [
      {
        friendshipId: 'i1', userId: 'u2', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ];

    friendServiceMock.getFriends.mockReturnValue(of(friends));
    friendServiceMock.getOutgoingFriendRequests.mockReturnValue(of(outgoing));
    friendServiceMock.getIncomingFriendRequests.mockReturnValue(of(incoming));
    userServiceMock.currentUser.mockReturnValue(of({ id: 'me' }));

    fixture.detectChanges();

    expect(component.currentUserId()).toBe('me');
    expect(component.friends()).toEqual(friends);
    expect(component.outgoingRequests()).toEqual(outgoing);
    expect(component.incomingRequests()).toEqual(incoming);
  });

  it('onFriendSearchInput should query backend after debounce and filter results', () => {
    const friends: FriendVm[] = [
      { id: 'friend1', username: 'friend1', displayName: 'Friend 1', avatarUrl: null, bannerUrl: null, accentColor: null },
    ];
    friendServiceMock.getFriends.mockReturnValue(of(friends));
    userServiceMock.currentUser.mockReturnValue(of({ id: 'me' }));

    const backendResults: UserSettingsResponse[] = [
      { id: 'me', username: 'me' } as UserSettingsResponse,
      { id: 'friend1', username: 'friend1' } as UserSettingsResponse,
      {
        id: 'other',
        username: 'other',
        profile: { displayName: 'Other User' } as any,
      } as UserSettingsResponse,
    ];

    userServiceMock.searchUsersByUsername.mockReturnValue(of(backendResults));

    fixture.detectChanges(); // ngOnInit

    const event = { target: { value: 'ot' } } as unknown as Event;
    component.onFriendSearchInput(event);

    jest.advanceTimersByTime(300);

    expect(userServiceMock.searchUsersByUsername).toHaveBeenCalledWith('ot');

    const results = component.searchResults();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('other');
  });

  it('openFriendAdd / closeFriendAdd should toggle modal and clear search results', () => {
    component.searchResults.set([{ id: 'u1' } as UserSettingsResponse]);

    component.openFriendAdd();
    expect(component.isFriendAddOpen).toBe(true);
    expect(component.searchResults()).toEqual([]);

    component.searchResults.set([{ id: 'u2' } as UserSettingsResponse]);

    component.closeFriendAdd();
    expect(component.isFriendAddOpen).toBe(false);
    expect(component.searchResults()).toEqual([]);
  });

  it('onFriendSearchInput should not call search when query is shorter than 2 chars', () => {
    fixture.detectChanges();

    component.searchResults.set([
      { id: 'old' } as UserSettingsResponse,
    ]);

    const event = { target: { value: 'a' } } as unknown as Event;
    component.onFriendSearchInput(event);

    jest.advanceTimersByTime(300);

    expect(userServiceMock.searchUsersByUsername).not.toHaveBeenCalled();
    expect(component.searchResults()).toEqual([]);
  });

  it('onFriendSearchInput should safely handle event without target', () => {
    fixture.detectChanges();

    const event = {} as Event;
    expect(() => component.onFriendSearchInput(event)).not.toThrow();
  });

  it('onToggleFriendRequest should accept incoming pending request and update state', () => {
    const user: UserSettingsResponse = {
      id: 'target',
      username: 'targetUser',
      profile: {
        displayName: 'Target User',
        avatarUrl: 'avatar',
        bannerUrl: 'banner',
        accentColor: '#123456',
      } as any,
    };

    component.incomingRequests.set([
      {
        friendshipId: 'fs1', userId: 'target', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ]);
    component.friends.set([]);
    component.searchResults.set([user]);

    friendServiceMock.acceptFriendRequest.mockReturnValue(of(void 0));

    component.onToggleFriendRequest(user);

    expect(friendServiceMock.acceptFriendRequest).toHaveBeenCalledWith('fs1');
    expect(component.incomingRequests()).toHaveLength(0);

    const friends = component.friends();
    expect(friends).toHaveLength(1);
    expect(friends[0].id).toBe('target');
    expect(friends[0].username).toBe('targetUser');

    expect(component.searchResults()).toHaveLength(0);
  });

  it('isOutgoingPending should return true only for matching pending request', () => {
    component.outgoingRequests.set([
      {
        friendshipId: 'fs1',
        userId: 'u1',
        status: 'PENDING',
        username: '',
        email: '',
        direction: 'OUTGOING',
        createdAt: '',
      },
      {
        friendshipId: 'fs2',
        userId: 'u2',
        status: 'ACCEPTED',
        username: '',
        email: '',
        direction: 'OUTGOING',
        createdAt: '',
      },
    ]);

    expect(
      component.isOutgoingPending({ id: undefined } as unknown as UserSettingsResponse),
    ).toBe(false);

    // Pending
    expect(
      component.isOutgoingPending({ id: 'u1' } as UserSettingsResponse),
    ).toBe(true);

    expect(
      component.isOutgoingPending({ id: 'u2' } as UserSettingsResponse),
    ).toBe(false);

    expect(
      component.isOutgoingPending({ id: 'u3' } as UserSettingsResponse),
    ).toBe(false);
  });

  it('hasIncomingPending should return true only for matching pending request', () => {
    component.incomingRequests.set([
      {
        friendshipId: 'fs1',
        userId: 'u1',
        status: 'PENDING',
        username: '',
        email: '',
        direction: 'INCOMING',
        createdAt: '',
      },
      {
        friendshipId: 'fs2',
        userId: 'u2',
        status: 'DECLINED',
        username: '',
        email: '',
        direction: 'INCOMING',
        createdAt: '',
      },
    ]);

    expect(
      component.hasIncomingPending({ id: undefined } as unknown as UserSettingsResponse),
    ).toBe(false);

    expect(
      component.hasIncomingPending({ id: 'u1' } as UserSettingsResponse),
    ).toBe(true);

    expect(
      component.hasIncomingPending({ id: 'u2' } as UserSettingsResponse),
    ).toBe(false);

    expect(
      component.hasIncomingPending({ id: 'u3' } as UserSettingsResponse),
    ).toBe(false);
  });

  it('onToggleFriendRequest should send new request when none exists', () => {
    const user: UserSettingsResponse = {
      id: 'target',
      username: 'targetUser',
    } as any;

    component.outgoingRequests.set([]);
    component.incomingRequests.set([]);

    friendServiceMock.sendFriendRequest.mockReturnValue(of(void 0));

    const updatedOutgoing: FriendRequestVm[] = [
      {
        friendshipId: 'fs2', userId: 'target', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ];
    friendServiceMock.getOutgoingFriendRequests.mockReturnValue(of(updatedOutgoing));

    component.onToggleFriendRequest(user);

    expect(friendServiceMock.sendFriendRequest).toHaveBeenCalledWith('target');
    expect(friendServiceMock.getOutgoingFriendRequests).toHaveBeenCalled();
    expect(component.outgoingRequests()).toEqual(updatedOutgoing);
  });

  it('onToggleFriendRequest should cancel existing outgoing request', () => {
    const user: UserSettingsResponse = {
      id: 'target',
      username: 'targetUser',
    } as any;

    const existing: FriendRequestVm[] = [
      {
        friendshipId: 'fs2', userId: 'target', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ];
    component.outgoingRequests.set(existing);
    component.incomingRequests.set([]);

    friendServiceMock.cancelFriendRequest.mockReturnValue(of(void 0));

    const updatedOutgoing: FriendRequestVm[] = [];
    friendServiceMock.getOutgoingFriendRequests.mockReturnValue(of(updatedOutgoing));

    component.onToggleFriendRequest(user);

    expect(friendServiceMock.cancelFriendRequest).toHaveBeenCalledWith('fs2');
    expect(friendServiceMock.getOutgoingFriendRequests).toHaveBeenCalled();
    expect(component.outgoingRequests()).toEqual(updatedOutgoing);
  });

  it('setTab should update activeTab signal', () => {
    expect(component.activeTab()).toBe('all');
    component.setTab('pending');
    expect(component.activeTab()).toBe('pending');
    component.setTab('all');
    expect(component.activeTab()).toBe('all');
  });

  it('onToggleFriendRequest should return early when user has no id', () => {
    const user = { id: undefined } as unknown as UserSettingsResponse;

    component.onToggleFriendRequest(user);

    expect(friendServiceMock.acceptFriendRequest).not.toHaveBeenCalled();
    expect(friendServiceMock.sendFriendRequest).not.toHaveBeenCalled();
    expect(friendServiceMock.cancelFriendRequest).not.toHaveBeenCalled();
  });

  it('onToggleFriendRequest should log error when accepting incoming request fails', () => {
    const user: UserSettingsResponse = {
      id: 'target',
      username: 'targetUser',
    } as any;

    component.incomingRequests.set([
      {
        friendshipId: 'fs1',
        userId: 'target',
        status: 'PENDING',
        username: '',
        email: '',
        direction: 'INCOMING',
        createdAt: '',
      },
    ]);

    const error = new Error('accept failed');
    friendServiceMock.acceptFriendRequest.mockReturnValue(
      throwError(() => error),
    );

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    component.onToggleFriendRequest(user);

    expect(friendServiceMock.acceptFriendRequest).toHaveBeenCalledWith('fs1');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to accept friend request from search',
      error,
    );

    consoleSpy.mockRestore();
  });

  it('onToggleFriendRequest should log error when sending new friend request fails', () => {
    const user: UserSettingsResponse = {
      id: 'target',
      username: 'targetUser',
    } as any;

    component.outgoingRequests.set([]);
    component.incomingRequests.set([]);

    const error = new Error('send failed');
    friendServiceMock.sendFriendRequest.mockReturnValue(
      throwError(() => error),
    );

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    component.onToggleFriendRequest(user);

    expect(friendServiceMock.sendFriendRequest).toHaveBeenCalledWith('target');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to send friend request',
      error,
    );

    consoleSpy.mockRestore();
  });

  it('onToggleFriendRequest should log error when cancelling friend request fails', () => {
    const user: UserSettingsResponse = {
      id: 'target',
      username: 'targetUser',
    } as any;

    component.outgoingRequests.set([
      {
        friendshipId: 'fs2',
        userId: 'target',
        status: 'PENDING',
        username: '',
        email: '',
        direction: 'OUTGOING',
        createdAt: '',
      },
    ]);
    component.incomingRequests.set([]);

    const error = new Error('cancel failed');
    friendServiceMock.cancelFriendRequest.mockReturnValue(
      throwError(() => error),
    );

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    component.onToggleFriendRequest(user);

    expect(friendServiceMock.cancelFriendRequest).toHaveBeenCalledWith('fs2');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to cancel friend request',
      error,
    );

    consoleSpy.mockRestore();
  });
});
