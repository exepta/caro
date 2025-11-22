package org.tiltus.authbackend.rest.requests;

public record UserSettingsRequest(
        String username,
        String email,
        String firstName,
        String lastName,
        UserProfileRequest profile
) { }
