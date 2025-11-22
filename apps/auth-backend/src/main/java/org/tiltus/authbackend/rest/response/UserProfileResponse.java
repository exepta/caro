package org.tiltus.authbackend.rest.response;

import org.tiltus.authbackend.model.CaroUserProfile;

public record UserProfileResponse(
        String displayName,
        String avatarUrl,
        String bannerUrl,
        String accentColor
) {

    public static UserProfileResponse from(CaroUserProfile profile) {
        return new UserProfileResponse(
                profile.getDisplayName(),
                profile.getAvatarUrl(),
                profile.getBannerUrl(),
                profile.getAccentColor()
        );
    }
}
