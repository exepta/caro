package org.tiltus.authbackend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.CaroUserProfile;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.requests.UserSettingsRequest;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CaroUserService {

    private final CaroUserRepository userRepository;

    public CaroUser save(String userId, UserSettingsRequest request) {
        UUID uuid = UUID.fromString(userId);

        CaroUser user = userRepository.findById(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setUpdatedAt(Instant.now());
        CaroUserProfile profile = user.getProfile();
        profile.setUser(user);
        profile.setDisplayName(request.profile().displayName());
        profile.setAvatarUrl(request.profile().avatarUrl());
        profile.setBannerUrl(request.profile().bannerUrl());
        profile.setAccentColor(request.profile().accentColor());
        user.setProfile(profile);

        return userRepository.save(user);
    }

    public CaroUser getById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

}
