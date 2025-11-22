package org.tiltus.authbackend.rest.response;

import org.tiltus.authbackend.model.CaroUser;

import java.time.Instant;
import java.util.UUID;

public record UserSettingsResponse(
        UUID id,
        String username,
        String email,
        String tagId,
        String firstName,
        String lastName,
        Instant createdAt,
        Instant updatedAt,
        UserProfileResponse profile
) {

    public static UserSettingsResponse from(CaroUser user) {
        return new UserSettingsResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getTagId(),
                user.getFirstName(),
                user.getLastName(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                UserProfileResponse.from(user.getProfile())
        );
    }

}
