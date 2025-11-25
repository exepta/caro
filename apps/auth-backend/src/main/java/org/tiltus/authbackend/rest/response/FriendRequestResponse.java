package org.tiltus.authbackend.rest.response;

import org.tiltus.authbackend.enums.FriendshipStatus;
import org.tiltus.authbackend.model.CaroFriendship;
import org.tiltus.authbackend.model.CaroUser;

import java.time.Instant;
import java.util.UUID;

public record FriendRequestResponse(
        UUID friendshipId,
        UUID userId,
        String username,
        String email,
        FriendshipStatus status,
        Direction direction,
        Instant createdAt
) {

    public enum Direction {
        OUTGOING,
        INCOMING
    }

    public static FriendRequestResponse outgoing(CaroFriendship friendship, CaroUser addressee) {
        return new FriendRequestResponse(
                friendship.getId(),
                addressee.getId(),
                addressee.getUsername(),
                addressee.getEmail(),
                friendship.getStatus(),
                Direction.OUTGOING,
                friendship.getCreatedAt()
        );
    }

    public static FriendRequestResponse incoming(CaroFriendship friendship, CaroUser requester) {
        return new FriendRequestResponse(
                friendship.getId(),
                requester.getId(),
                requester.getUsername(),
                requester.getEmail(),
                friendship.getStatus(),
                Direction.INCOMING,
                friendship.getCreatedAt()
        );
    }
}
