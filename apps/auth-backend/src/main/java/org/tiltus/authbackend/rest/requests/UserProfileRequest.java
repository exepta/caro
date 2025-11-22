package org.tiltus.authbackend.rest.requests;

public record UserProfileRequest(
        String displayName,
        String avatarUrl,
        String bannerUrl,
        String accentColor
) { }
