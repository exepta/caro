package org.tiltus.authbackend.repositories;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.CaroUserProfile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaroProfileRepositoryTest {

    @Mock
    private CaroProfileRepository caroProfileRepository;

    @Test
    void findByUserId_returnsProfile_whenProfileExistsForUser() {
        // arrange
        UUID userId = UUID.randomUUID();

        CaroUser user = new CaroUser();
        user.setId(userId);

        CaroUserProfile profile = new CaroUserProfile();
        profile.setId(UUID.randomUUID());
        profile.setUser(user);
        profile.setDisplayName("Test User");
        profile.setAvatarUrl("avatar.png");
        profile.setBannerUrl("banner.png");
        profile.setAccentColor("#ffffff");

        when(caroProfileRepository.findByUserId(userId))
                .thenReturn(Optional.of(profile));

        // act
        Optional<CaroUserProfile> result = caroProfileRepository.findByUserId(userId);

        // assert
        verify(caroProfileRepository).findByUserId(userId);
        assertThat(result).isPresent();
        assertThat(result.get().getUser()).isNotNull();
        assertThat(result.get().getUser().getId()).isEqualTo(userId);
        assertThat(result.get().getDisplayName()).isEqualTo("Test User");
    }

    @Test
    void findByUserId_returnsEmpty_whenNoProfileForUserExists() {
        // arrange
        UUID randomUserId = UUID.randomUUID();
        when(caroProfileRepository.findByUserId(randomUserId))
                .thenReturn(Optional.empty());

        // act
        Optional<CaroUserProfile> result = caroProfileRepository.findByUserId(randomUserId);

        // assert
        verify(caroProfileRepository).findByUserId(randomUserId);
        assertThat(result).isEmpty();
    }
}
