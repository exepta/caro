import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PendingTab } from './pending-tab';
import { FriendService } from '../../../../../services/friend.service';
import { FriendRequestVm, FriendVm } from '../../../../../services/friends.vm';

describe('PendingTab', () => {
  let fixture: ComponentFixture<PendingTab>;
  let component: PendingTab;

  let friendServiceMock: {
    acceptFriendRequest: jest.Mock;
    declineFriendRequest: jest.Mock;
    cancelFriendRequest: jest.Mock;
    getFriends: jest.Mock;
    getOutgoingFriendRequests: jest.Mock;
  };

  beforeEach(async () => {
    friendServiceMock = {
      acceptFriendRequest: jest.fn(),
      declineFriendRequest: jest.fn(),
      cancelFriendRequest: jest.fn(),
      getFriends: jest.fn(),
      getOutgoingFriendRequests: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PendingTab],
      providers: [
        { provide: FriendService, useValue: friendServiceMock },
      ],
    })
      .overrideTemplate(PendingTab, '')
      .compileComponents();

    fixture = TestBed.createComponent(PendingTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('acceptRequest should call service, remove request from incoming and update friends', () => {
    const req: FriendRequestVm = {
      createdAt: '', direction: 'INCOMING', email: '', username: '',
      friendshipId: 'fs1',
      userId: 'u1',
      status: 'PENDING'
    };

    const initialIncoming: FriendRequestVm[] = [
      req,
      {
        friendshipId: 'fs2', userId: 'u2', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ];
    const updatedFriends: FriendVm[] = [
      {
        id: 'f1',
        username: 'friend1',
        displayName: 'Friend 1',
        avatarUrl: null,
        bannerUrl: null,
        accentColor: null,
      },
    ];

    component.incomingRequests.set(initialIncoming);
    component.friends.set([]);

    friendServiceMock.acceptFriendRequest.mockReturnValue(of(void 0));
    friendServiceMock.getFriends.mockReturnValue(of(updatedFriends));

    component.acceptRequest(req);

    expect(friendServiceMock.acceptFriendRequest).toHaveBeenCalledWith('fs1');
    expect(friendServiceMock.getFriends).toHaveBeenCalled();

    const incoming = component.incomingRequests();
    expect(incoming).toHaveLength(1);
    expect(incoming[0].friendshipId).toBe('fs2');

    expect(component.friends()).toEqual(updatedFriends);
  });

  it('declineRequest should call service and remove request from incoming', () => {
    const req: FriendRequestVm = {
      createdAt: '', direction: 'INCOMING', email: '', username: '',
      friendshipId: 'fs1',
      userId: 'u1',
      status: 'PENDING'
    };

    const initialIncoming: FriendRequestVm[] = [
      req,
      {
        friendshipId: 'fs2', userId: 'u2', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ];

    component.incomingRequests.set(initialIncoming);

    friendServiceMock.declineFriendRequest.mockReturnValue(of(void 0));

    component.declineRequest(req);

    expect(friendServiceMock.declineFriendRequest).toHaveBeenCalledWith('fs1');

    const incoming = component.incomingRequests();
    expect(incoming).toHaveLength(1);
    expect(incoming[0].friendshipId).toBe('fs2');
  });

  it('cancelRequest should call service and refresh outgoingRequests', () => {
    const req: FriendRequestVm = {
      createdAt: '', direction: 'INCOMING', email: '', username: '',
      friendshipId: 'fs1',
      userId: 'u1',
      status: 'PENDING'
    };

    const initialOutgoing: FriendRequestVm[] = [req];
    const updatedOutgoing: FriendRequestVm[] = [
      {
        friendshipId: 'fs2', userId: 'u2', status: 'PENDING',
        username: "",
        email: "",
        direction: "OUTGOING",
        createdAt: ""
      },
    ];

    component.outgoingRequests.set(initialOutgoing);

    friendServiceMock.cancelFriendRequest.mockReturnValue(of(void 0));
    friendServiceMock.getOutgoingFriendRequests.mockReturnValue(of(updatedOutgoing));

    component.cancelRequest(req);

    expect(friendServiceMock.cancelFriendRequest).toHaveBeenCalledWith('fs1');
    expect(friendServiceMock.getOutgoingFriendRequests).toHaveBeenCalled();
    expect(component.outgoingRequests()).toEqual(updatedOutgoing);
  });

  it('blockRequest should not throw (placeholder)', () => {
    const req: FriendRequestVm = {
      createdAt: '', direction: 'INCOMING', email: '', username: '',
      friendshipId: 'fs1',
      userId: 'u1',
      status: 'PENDING'
    };

    expect(() => component.blockRequest(req)).not.toThrow();
  });
});
