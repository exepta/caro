package org.tiltus.authbackend.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.CaroUserProfile;
import org.tiltus.authbackend.repositories.CaroProfileRepository;
import org.tiltus.authbackend.rest.requests.UserProfileRequest;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaroProfileServiceTest {

    @Mock
    private CaroProfileRepository profileRepository;

    @Mock
    private CaroUserService userService;

    @InjectMocks
    private CaroProfileService caroProfileService;

    // ---------------------------------------------------------
    // getCurrentCaroUserProfile
    // ---------------------------------------------------------

    @Test
    void getCurrentCaroUserProfile_returnsExistingProfile_whenFound() {
        // arrange
        UUID userId = UUID.randomUUID();

        CaroUser user = new CaroUser();
        user.setId(userId);

        CaroUserProfile profile = new CaroUserProfile();
        profile.setUser(user);
        profile.setDisplayName("Existing");

        when(profileRepository.findByUserId(userId))
                .thenReturn(Optional.of(profile));

        // act
        CaroUserProfile result = caroProfileService.getCurrentCaroUserProfile(userId);

        // assert
        verify(profileRepository).findByUserId(userId);
        assertThat(result).isSameAs(profile);
        assertThat(result.getUser()).isSameAs(user);
        assertThat(result.getDisplayName()).isEqualTo("Existing");
    }

    @Test
    void getCurrentCaroUserProfile_throwsIllegalState_whenProfileNotInitialized() {
        // arrange
        UUID userId = UUID.randomUUID();
        when(profileRepository.findByUserId(userId))
                .thenReturn(Optional.empty());

        // act + assert
        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> caroProfileService.getCurrentCaroUserProfile(userId)
        );

        assertThat(ex.getMessage()).isEqualTo("Profile not initialized");
        verify(profileRepository).findByUserId(userId);
    }

    // ---------------------------------------------------------
    // updateCurrentUserProfile
    // ---------------------------------------------------------

    @Test
    void updateCurrentUserProfile_updatesExistingProfile_andSaves() {
        // arrange
        UUID userId = UUID.randomUUID();

        CaroUser user = new CaroUser();
        user.setId(userId);

        CaroUserProfile existingProfile = new CaroUserProfile();
        existingProfile.setUser(user);
        existingProfile.setDisplayName("Old");
        existingProfile.setAvatarUrl("old-avatar");
        existingProfile.setBannerUrl("old-banner");
        existingProfile.setAccentColor("#000000");

        UserProfileRequest request = new UserProfileRequest(
                "New Display",
                "new-avatar",
                "new-banner",
                "#ffffff"
        );

        when(userService.getById(userId)).thenReturn(user);
        when(profileRepository.findById(userId)).thenReturn(Optional.of(existingProfile));
        when(profileRepository.save(any(CaroUserProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // act
        CaroUserProfile result = caroProfileService.updateCurrentUserProfile(userId, request);

        // assert
        ArgumentCaptor<CaroUserProfile> captor = ArgumentCaptor.forClass(CaroUserProfile.class);
        verify(profileRepository).save(captor.capture());
        CaroUserProfile saved = captor.getValue();

        verify(userService).getById(userId);
        verify(profileRepository).findById(userId);

        assertThat(saved).isSameAs(existingProfile);
        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getDisplayName()).isEqualTo("New Display");
        assertThat(saved.getAvatarUrl()).isEqualTo("new-avatar");
        assertThat(saved.getBannerUrl()).isEqualTo("new-banner");
        assertThat(saved.getAccentColor()).isEqualTo("#ffffff");

        assertThat(result).isSameAs(saved);
    }

    @Test
    void updateCurrentUserProfile_createsNewProfile_whenNoneExists() {
        // arrange
        UUID userId = UUID.randomUUID();

        CaroUser user = new CaroUser();
        user.setId(userId);

        UserProfileRequest request = new UserProfileRequest(
                "New Display",
                "new-avatar",
                "new-banner",
                "#ffffff"
        );

        when(userService.getById(userId)).thenReturn(user);
        when(profileRepository.findById(userId)).thenReturn(Optional.empty());
        when(profileRepository.save(any(CaroUserProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // act
        CaroUserProfile result = caroProfileService.updateCurrentUserProfile(userId, request);

        // assert
        ArgumentCaptor<CaroUserProfile> captor = ArgumentCaptor.forClass(CaroUserProfile.class);
        verify(profileRepository).save(captor.capture());
        CaroUserProfile saved = captor.getValue();

        verify(userService).getById(userId);
        verify(profileRepository).findById(userId);

        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getDisplayName()).isEqualTo("New Display");
        assertThat(saved.getAvatarUrl()).isEqualTo("new-avatar");
        assertThat(saved.getBannerUrl()).isEqualTo("new-banner");
        assertThat(saved.getAccentColor()).isEqualTo("#ffffff");

        assertThat(result).isSameAs(saved);
    }
}
