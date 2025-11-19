package org.tiltus.authbackend.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.requests.UserSettingsRequest;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaroUserServiceTest {

    @Mock
    private CaroUserRepository userRepository;

    @InjectMocks
    private CaroUserService caroUserService;

    @Test
    void save_updatesFirstAndLastName_andUpdatedAt_andPersistsUser() {
        // arrange
        String userId = UUID.randomUUID().toString();
        UUID uuid = UUID.fromString(userId);

        CaroUser existingUser = new CaroUser();
        existingUser.setId(uuid);
        existingUser.setFirstName("OldFirst");
        existingUser.setLastName("OldLast");
        existingUser.setUpdatedAt(Instant.parse("2024-01-01T00:00:00Z"));

        UserSettingsRequest request = new UserSettingsRequest("NewFirst", "NewLast");

        when(userRepository.findById(uuid)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(CaroUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Instant beforeCall = Instant.now();

        // act
        CaroUser result = caroUserService.save(userId, request);

        // assert
        ArgumentCaptor<CaroUser> captor = ArgumentCaptor.forClass(CaroUser.class);
        verify(userRepository).save(captor.capture());
        CaroUser savedUser = captor.getValue();

        assertThat(savedUser.getId()).isEqualTo(uuid);
        assertThat(savedUser.getFirstName()).isEqualTo("NewFirst");
        assertThat(savedUser.getLastName()).isEqualTo("NewLast");

        assertThat(savedUser.getUpdatedAt())
                .isNotNull()
                .isAfter(beforeCall);
        assertThat(result).isSameAs(savedUser);
    }

    @Test
    void save_throwsNotFound_whenUserDoesNotExist() {
        // arrange
        String userId = UUID.randomUUID().toString();
        UUID uuid = UUID.fromString(userId);

        UserSettingsRequest request = new UserSettingsRequest("NewFirst", "NewLast");

        when(userRepository.findById(uuid)).thenReturn(Optional.empty());

        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> caroUserService.save(userId, request)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(ex.getReason()).isEqualTo("User not found");

        verify(userRepository, never()).save(any());
    }
}
