package org.tiltus.authbackend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.CaroUserProfile;
import org.tiltus.authbackend.repositories.CaroProfileRepository;
import org.tiltus.authbackend.rest.requests.UserProfileRequest;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CaroProfileService {

    private final CaroProfileRepository profileRepository;
    private final CaroUserService userService;

    @Transactional(readOnly = true)
    public CaroUserProfile getCurrentCaroUserProfile(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(userId));
    }

    @Transactional
    public CaroUserProfile updateCurrentUserProfile(UUID userId, UserProfileRequest request) {
        CaroUser user = userService.getById(userId);

        CaroUserProfile profile = profileRepository.findById(userId)
                .orElseGet(() -> {
                    CaroUserProfile p = new CaroUserProfile();
                    p.setUser(user);
                    return p;
                });

        profile.setDisplayName(request.displayName());
        profile.setAvatarUrl(request.avatarUrl());
        profile.setBannerUrl(request.bannerUrl());
        profile.setAccentColor(request.accentColor());

        return profileRepository.save(profile);
    }

    private CaroUserProfile createDefaultProfile(UUID userId) {
        throw new IllegalStateException("Profile not initialized");
    }

}
