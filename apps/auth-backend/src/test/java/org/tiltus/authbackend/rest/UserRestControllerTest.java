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
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.requests.UserSettingsRequest;
import org.tiltus.authbackend.rest.response.UserSettingsResponse;
import org.tiltus.authbackend.services.CaroUserService;

import java.time.Instant;
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

    @Test
    void me_returnsUserSettings_whenUserExists() {
        // arrange
        UUID userId = UUID.randomUUID();
        String userIdStr = userId.toString();

        CaroUser user = new CaroUser();
        user.setId(userId);
        user.setUsername("dev");
        user.setEmail("dev@caro.net");
        user.setTagId("#123456");
        user.setFirstName("Dev");
        user.setLastName("User");
        user.setCreatedAt(Instant.parse("2024-01-01T00:00:00Z"));
        user.setUpdatedAt(Instant.parse("2024-01-02T00:00:00Z"));

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // act
        ResponseEntity<UserSettingsResponse> response = controller.me(userIdStr);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        UserSettingsResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.id()).isEqualTo(userId);
        assertThat(body.username()).isEqualTo("dev");
        assertThat(body.email()).isEqualTo("dev@caro.net");
        assertThat(body.tagId()).isEqualTo("#123456");
        assertThat(body.firstName()).isEqualTo("Dev");
        assertThat(body.lastName()).isEqualTo("User");
        assertThat(body.createdAt()).isEqualTo(Instant.parse("2024-01-01T00:00:00Z"));
        assertThat(body.updatedAt()).isEqualTo(Instant.parse("2024-01-02T00:00:00Z"));

        verify(userRepository).findById(userId);
        verifyNoInteractions(userService);
    }

    @Test
    void me_throwsBadRequest_whenUserIdIsNull() {
        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me(null)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).isEqualTo("Invalid user id");

        verifyNoInteractions(userRepository);
        verifyNoInteractions(userService);
    }

    @Test
    void me_throwsBadRequest_whenUserIdIsEmpty() {
        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me("")
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).isEqualTo("Invalid user id");

        verifyNoInteractions(userRepository);
        verifyNoInteractions(userService);
    }

    @Test
    void me_throwsNotFound_whenUserDoesNotExist() {
        // arrange
        UUID userId = UUID.randomUUID();
        String userIdStr = userId.toString();

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.me(userIdStr)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(ex.getReason()).isEqualTo("User not found");

        verify(userRepository).findById(userId);
        verifyNoInteractions(userService);
    }

    @Test
    void updateMe_updatesUserSettings_viaService_andReturnsResponse() {
        // arrange
        UUID userId = UUID.randomUUID();
        String userIdStr = userId.toString();

        UserSettingsRequest request = new UserSettingsRequest("NewFirst", "NewLast");

        CaroUser savedUser = new CaroUser();
        savedUser.setId(userId);
        savedUser.setUsername("dev");
        savedUser.setEmail("dev@caro.net");
        savedUser.setTagId("#123456");
        savedUser.setFirstName("NewFirst");
        savedUser.setLastName("NewLast");
        savedUser.setCreatedAt(Instant.parse("2024-01-01T00:00:00Z"));
        savedUser.setUpdatedAt(Instant.parse("2024-01-03T00:00:00Z"));

        when(userService.save(userIdStr, request)).thenReturn(savedUser);

        // act
        ResponseEntity<UserSettingsResponse> response = controller.updateMe(userIdStr, request);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        UserSettingsResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.id()).isEqualTo(userId);
        assertThat(body.firstName()).isEqualTo("NewFirst");
        assertThat(body.lastName()).isEqualTo("NewLast");
        assertThat(body.username()).isEqualTo("dev");
        assertThat(body.email()).isEqualTo("dev@caro.net");
        assertThat(body.tagId()).isEqualTo("#123456");

        verify(userService).save(userIdStr, request);
        verifyNoInteractions(userRepository);
    }

    @Test
    void updateMe_throwsBadRequest_whenUserIdIsNull() {
        // arrange
        UserSettingsRequest request = new UserSettingsRequest("NewFirst", "NewLast");

        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateMe(null, request)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).isEqualTo("Invalid user id");

        verifyNoInteractions(userRepository);
        verifyNoInteractions(userService);
    }

    @Test
    void updateMe_throwsBadRequest_whenUserIdIsEmpty() {
        // arrange
        UserSettingsRequest request = new UserSettingsRequest("NewFirst", "NewLast");

        // act
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateMe("", request)
        );

        // assert
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).isEqualTo("Invalid user id");

        verifyNoInteractions(userRepository);
        verifyNoInteractions(userService);
    }
}
