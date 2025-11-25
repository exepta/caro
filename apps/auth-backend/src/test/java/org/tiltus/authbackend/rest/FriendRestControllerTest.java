package org.tiltus.authbackend.rest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.tiltus.authbackend.rest.requests.SendFriendRequest;
import org.tiltus.authbackend.rest.response.FriendRequestResponse;
import org.tiltus.authbackend.rest.response.FriendResponse;
import org.tiltus.authbackend.services.CaroFriendshipService;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

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

    // --------- DELETE /api/friends/requests/{id} ---------

    @Test
    void cancelFriendRequest_shouldCallServiceAndReturnNoContent_whenUserIdAndFriendshipIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();
        UUID friendshipId = UUID.randomUUID();

        // act
        ResponseEntity<Void> response = controller.cancelFriendRequest(userId, friendshipId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(friendshipService).cancelRequest(currentUserUuid, friendshipId);
    }

    @Test
    void cancelFriendRequest_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";
        UUID friendshipId = UUID.randomUUID();

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.cancelFriendRequest(invalidUserId, friendshipId)
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

    // --------- POST /api/friends/requests/{id}/decline ---------

    @Test
    void declineFriendRequest_shouldCallServiceAndReturnOk_whenUserIdAndFriendshipIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();
        UUID friendshipId = UUID.randomUUID();

        // act
        ResponseEntity<Void> response = controller.declineFriendRequest(userId, friendshipId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(friendshipService).declineRequest(currentUserUuid, friendshipId);
    }

    @Test
    void declineFriendRequest_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";
        UUID friendshipId = UUID.randomUUID();

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.declineFriendRequest(invalidUserId, friendshipId)
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

    // --------- GET /api/friends/requests/outgoing ---------

    @Test
    void getOutgoingRequests_shouldReturnRequestsFromService_whenUserIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();

        FriendRequestResponse req1 = mock(FriendRequestResponse.class);
        FriendRequestResponse req2 = mock(FriendRequestResponse.class);
        List<FriendRequestResponse> requests = List.of(req1, req2);

        when(friendshipService.getOutgoingRequests(currentUserUuid)).thenReturn(requests);

        // act
        ResponseEntity<List<FriendRequestResponse>> response = controller.getOutgoingRequests(userId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactlyElementsOf(requests);
        verify(friendshipService).getOutgoingRequests(currentUserUuid);
    }

    @Test
    void getOutgoingRequests_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.getOutgoingRequests(invalidUserId)
        );
    }

    // --------- GET /api/friends/requests/incoming ---------

    @Test
    void getIncomingRequests_shouldReturnRequestsFromService_whenUserIdValid() {
        // arrange
        UUID currentUserUuid = UUID.randomUUID();
        String userId = currentUserUuid.toString();

        FriendRequestResponse req1 = mock(FriendRequestResponse.class);
        FriendRequestResponse req2 = mock(FriendRequestResponse.class);
        List<FriendRequestResponse> requests = List.of(req1, req2);

        when(friendshipService.getIncomingRequests(currentUserUuid)).thenReturn(requests);

        // act
        ResponseEntity<List<FriendRequestResponse>> response = controller.getIncomingRequests(userId);

        // assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactlyElementsOf(requests);
        verify(friendshipService).getIncomingRequests(currentUserUuid);
    }

    @Test
    void getIncomingRequests_shouldThrowIllegalArgumentException_whenUserIdIsNotValidUuid() {
        // arrange
        String invalidUserId = "not-a-uuid";

        // act + assert
        assertThrows(
                IllegalArgumentException.class,
                () -> controller.getIncomingRequests(invalidUserId)
        );
    }
}
