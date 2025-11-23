package org.tiltus.authbackend.rest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.tiltus.authbackend.rest.requests.SendFriendRequest;
import org.tiltus.authbackend.rest.response.FriendResponse;
import org.tiltus.authbackend.services.CaroFriendshipService;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FriendRestControllerTest {

    @Mock
    private CaroFriendshipService friendshipService;

    @InjectMocks
    private FriendRestController controller;

    // --------- POST /api/friends/requests ---------

    @Test
    void sendFriendRequest_shouldCallServiceAndReturnOk_whenUserIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();
        UUID targetUserId = UUID.randomUUID();

        SendFriendRequest request = new SendFriendRequest(targetUserId);

        // act
        ResponseEntity<Void> response = controller.sendFriendRequest(userId, request);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(friendshipService).sendRequest(currentUserUuid, targetUserId);
    }

    @Test
    void sendFriendRequest_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";
        SendFriendRequest request = new SendFriendRequest(UUID.randomUUID());

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.sendFriendRequest(invalidUserId, request)
        );
    }

    // --------- POST /api/friends/requests/{id}/accept ---------

    @Test
    void acceptFriendRequest_shouldCallServiceAndReturnOk_whenUserIdAndFriendshipIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();
        UUID friendshipId = UUID.randomUUID();

        // act
        ResponseEntity<Void> response = controller.acceptFriendRequest(userId, friendshipId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(friendshipService).acceptRequest(currentUserUuid, friendshipId);
    }

    @Test
    void acceptFriendRequest_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";
        UUID friendshipId = UUID.randomUUID();

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.acceptFriendRequest(invalidUserId, friendshipId)
        );
    }

    // --------- DELETE /api/friends/{friendId} ---------

    @Test
    void unfriend_shouldCallServiceAndReturnNoContent_whenUserIdAndFriendIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();
        UUID friendId = UUID.randomUUID();

        // act
        ResponseEntity<Void> response = controller.unfriend(userId, friendId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(friendshipService).unfriend(currentUserUuid, friendId);
    }

    @Test
    void unfriend_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";
        UUID friendId = UUID.randomUUID();

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.unfriend(invalidUserId, friendId)
        );
    }

    // --------- GET /api/friends ---------

    @Test
    void getFriends_shouldReturnFriendsFromService_whenUserIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();

        FriendResponse friend1 = new FriendResponse(
                UUID.randomUUID(),
                "friend1",
                "friend1@example.com"
        );
        FriendResponse friend2 = new FriendResponse(
                UUID.randomUUID(),
                "friend2",
                "friend2@example.com"
        );

        List<FriendResponse> friends = List.of(friend1, friend2);

        when(friendshipService.getFriends(currentUserUuid)).thenReturn(friends);

        // act
        ResponseEntity<List<FriendResponse>> response = controller.getFriends(userId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactlyElementsOf(friends);
        verify(friendshipService).getFriends(currentUserUuid);
    }

    @Test
    void getFriends_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.getFriends(invalidUserId)
        );
    }
}

