package org.tiltus.authbackend.rest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.CaroUserProfile;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.requests.UserSettingsRequest;
import org.tiltus.authbackend.rest.response.UserSettingsResponse;
import org.tiltus.authbackend.services.CaroUserService;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserRestControllerTest {

    @Mock
    private CaroUserRepository userRepository;

    @Mock
    private CaroUserService userService;

    @InjectMocks
    private UserRestController controller;

    // --------- GET /api/user/me ---------

    @Test
    void me_shouldReturnUserSettings_whenUserIdValidAndUserExists() {
        // arrange
        String userId = UUID.randomUUID().toString();
        UUID uuid = UUID.fromString(userId);

        CaroUserProfile profile = mock(CaroUserProfile.class);
        when(profile.getDisplayName()).thenReturn("John Doe");

        CaroUser user = mock(CaroUser.class);
        when(user.getProfile()).thenReturn(profile);

        when(userRepository.findById(uuid)).thenReturn(Optional.of(user));

        ResponseEntity<UserSettingsResponse> response = controller.me(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        verify(userRepository).findById(uuid);
    }

    @Test
    void me_shouldThrowUnauthorized_whenUserIdNull() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me(null)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void me_shouldThrowUnauthorized_whenUserIdEmpty() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me("")
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void me_shouldThrowUnauthorized_whenUserIdIsAnonymousUser() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me("anonymousUser")
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void me_shouldThrowUnauthorized_whenUserIdIsNotAValidUuid() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me("not-a-uuid")
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void me_shouldThrowNotFound_whenUserDoesNotExist() {
        // arrange
        String userId = UUID.randomUUID().toString();
        UUID uuid = UUID.fromString(userId);

        when(userRepository.findById(uuid)).thenReturn(Optional.empty());

        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me(userId)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // --------- PUT /api/user/me ---------

    @Test
    void updateMe_shouldReturnUpdatedUserSettings_whenUserIdValid() {
        String userId = UUID.randomUUID().toString();

        UserSettingsRequest request = new UserSettingsRequest(
                "testuser",
                "mail@example.com",
                "John",
                "Doe",
                null
        );

        CaroUserProfile profile = mock(CaroUserProfile.class);
        when(profile.getDisplayName()).thenReturn("John Doe");

        CaroUser savedUser = mock(CaroUser.class);
        when(savedUser.getProfile()).thenReturn(profile);

        when(userService.save(userId, request)).thenReturn(savedUser);

        ResponseEntity<UserSettingsResponse> response = controller.updateMe(userId, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        verify(userService).save(userId, request);
    }

    @Test
    void updateMe_shouldThrowUnauthorized_whenUserIdNull() {
        UserSettingsRequest request = new UserSettingsRequest(
                "testuser",
                "mail@example.com",
                "John",
                "Doe",
                null
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateMe(null, request)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void updateMe_shouldThrowUnauthorized_whenUserIdEmpty() {
        UserSettingsRequest request = new UserSettingsRequest(
                "testuser",
                "mail@example.com",
                "John",
                "Doe",
                null
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateMe("", request)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void updateMe_shouldThrowUnauthorized_whenUserIdIsAnonymousUser() {
        UserSettingsRequest request = new UserSettingsRequest(
                "testuser",
                "mail@example.com",
                "John",
                "Doe",
                null
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateMe("anonymousUser", request)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void updateMe_shouldThrowUnauthorized_whenUserIdIsNotAValidUuid() {
        UserSettingsRequest request = new UserSettingsRequest(
                "testuser",
                "mail@example.com",
                "John",
                "Doe",
                null
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateMe("not-a-uuid", request)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // --------- GET /api/user/{id} ---------

    @Test
    void getById_shouldReturnUserSettings_whenUserIdValidAndUserExists() {
        // arrange
        String userId = UUID.randomUUID().toString();
        UUID uuid = UUID.fromString(userId);

        CaroUserProfile profile = mock(CaroUserProfile.class);
        when(profile.getDisplayName()).thenReturn("John Doe");

        CaroUser user = mock(CaroUser.class);
        when(user.getProfile()).thenReturn(profile);

        when(userRepository.findById(uuid)).thenReturn(Optional.of(user));

        // act
        ResponseEntity<UserSettingsResponse> response = controller.getById(userId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        verify(userRepository).findById(uuid);
    }

    @Test
    void getById_shouldThrowBadRequest_whenUserIdNull() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getById(null)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getById_shouldThrowBadRequest_whenUserIdEmpty() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getById("")
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getById_shouldThrowBadRequest_whenUserIdIsAnonymousUser() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getById("anonymousUser")
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getById_shouldThrowUnauthorized_whenUserIdIsNotAValidUuid() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getById("not-a-uuid")
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getById_shouldThrowNotFound_whenUserDoesNotExist() {
        // arrange
        String userId = UUID.randomUUID().toString();
        UUID uuid = UUID.fromString(userId);

        when(userRepository.findById(uuid)).thenReturn(Optional.empty());

        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getById(userId)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // --------- GET /api/user/username/{username} ---------

    @Test
    void getByUsername_shouldReturnUserSettings_whenUsernameValidAndUserExists() {
        // arrange
        String username = "DevUser";

        CaroUserProfile profile = mock(CaroUserProfile.class);
        when(profile.getDisplayName()).thenReturn("John Doe");

        CaroUser user = mock(CaroUser.class);
        when(user.getProfile()).thenReturn(profile);

        when(userRepository.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(user));

        // act
        ResponseEntity<UserSettingsResponse> response = controller.getByUsername(username);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        verify(userRepository).findByUsernameIgnoreCase(username);
    }

    @Test
    void getByUsername_shouldThrowBadRequest_whenUsernameNull() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getByUsername(null)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getByUsername_shouldThrowBadRequest_whenUsernameEmpty() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getByUsername("")
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getByUsername_shouldThrowNotFound_whenUserDoesNotExist() {
        // arrange
        String username = "UnknownUser";

        when(userRepository.findByUsernameIgnoreCase(username)).thenReturn(Optional.empty());

        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getByUsername(username)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
