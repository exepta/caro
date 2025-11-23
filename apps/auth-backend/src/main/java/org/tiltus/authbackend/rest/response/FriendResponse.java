package org.tiltus.authbackend.rest.response;

import org.tiltus.authbackend.model.CaroUser;

import java.util.UUID;

public record FriendResponse(
        UUID id,
        String username,
        String email
) {
    public static FriendResponse fromUser(CaroUser user) {
        return new FriendResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}
