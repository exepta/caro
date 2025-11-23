package org.tiltus.authbackend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.tiltus.authbackend.enums.FriendshipStatus;
import org.tiltus.authbackend.model.CaroFriendship;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.repositories.CaroFriendshipRepository;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.response.FriendResponse;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class CaroFriendshipService {

    private static final int DEFAULT_MAX_PENDING_REQUESTS = 100;

    private final CaroFriendshipRepository friendshipRepository;
    private final CaroUserRepository userRepository;

    public void sendRequest(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot send a friend request to yourself.");
        }

        CaroUser requester = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User does not exist!"));
        CaroUser addressee = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user does not exist!"));

        long pendingCount = friendshipRepository.countByAddressee_IdAndStatus(
                targetUserId,
                FriendshipStatus.PENDING
        );

        if (pendingCount >= DEFAULT_MAX_PENDING_REQUESTS) {
            throw new IllegalStateException("The target user has too many pending friend requests.");
        }

        var existingOpt = friendshipRepository.findBetween(currentUserId, targetUserId);

        if (existingOpt.isPresent()) {
            CaroFriendship existing = existingOpt.get();
            switch (existing.getStatus()) {
                case ACCEPTED -> throw new IllegalStateException("You are already friends with this user.");
                case PENDING -> {
                    throw new IllegalStateException("A friend request is already pending between you and this user.");
                }
                case BLOCKED -> throw new IllegalStateException("You cannot send a friend request to a user you have blocked or who has blocked you.");
                case DECLINED -> {
                    throw new IllegalStateException("A previous friend request was declined. You cannot send another request at this time.");
                }
            }
        }

        CaroFriendship friendship = new CaroFriendship();
        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setStatus(FriendshipStatus.PENDING);

        friendshipRepository.save(friendship);
    }

    public void acceptRequest(UUID currentUserId, UUID friendshipId) {
        CaroFriendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friendship does not exist!"));

        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new IllegalStateException("You cannot accept a friend request from someone else.");
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Only pending friend requests can be accepted.");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
    }

    public void unfriend(UUID currentUserId, UUID friendId) {
        var friendshipOpt = friendshipRepository.findBetween(currentUserId, friendId);

        if (friendshipOpt.isEmpty()) {
            throw new IllegalArgumentException("No friendship found for user " + currentUserId + " and " + friendId + ".");
        }

        CaroFriendship friendship = friendshipOpt.get();

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new IllegalStateException("You can only unfriend users you are currently friends with.");
        }

        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getFriends(UUID userId) {
        List<CaroFriendship> friendships = friendshipRepository.findAcceptedForUser(userId);

        return friendships.stream()
                .map(f -> {
                    var requesterId = f.getRequester().getId();
                    var friendUser = requesterId.equals(userId)
                            ? f.getAddressee()
                            : f.getRequester();

                    return FriendResponse.fromUser(friendUser);
                })
                .toList();
    }
}
