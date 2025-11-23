package org.tiltus.authbackend.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tiltus.authbackend.enums.FriendshipStatus;
import org.tiltus.authbackend.model.CaroFriendship;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.repositories.CaroFriendshipRepository;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.response.FriendResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaroFriendshipServiceTest {

    @Mock
    private CaroFriendshipRepository friendshipRepository;

    @Mock
    private CaroUserRepository userRepository;

    @InjectMocks
    private CaroFriendshipService service;

    // -------- sendRequest --------

    @Test
    void sendRequest_shouldThrow_whenSelfRequest() {
        UUID id = UUID.randomUUID();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.sendRequest(id, id)
        );

        assertThat(ex.getMessage()).contains("cannot send a friend request to yourself");
        verifyNoInteractions(userRepository, friendshipRepository);
    }

    @Test
    void sendRequest_shouldThrow_whenRequesterNotFound() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        when(userRepository.findById(requesterId)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.sendRequest(requesterId, targetId)
        );

        assertThat(ex.getMessage()).contains("User does not exist");
        verify(userRepository).findById(requesterId);
        verify(userRepository, never()).findById(targetId);
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void sendRequest_shouldThrow_whenTargetUserNotFound() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        CaroUser requester = mock(CaroUser.class);
        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.sendRequest(requesterId, targetId)
        );

        assertThat(ex.getMessage()).contains("Target user does not exist");
        verify(userRepository).findById(requesterId);
        verify(userRepository).findById(targetId);
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void sendRequest_shouldThrow_whenTargetHasTooManyPendingRequests() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        CaroUser requester = mock(CaroUser.class);
        CaroUser addressee = mock(CaroUser.class);

        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(addressee));

        when(friendshipRepository.countByAddressee_IdAndStatus(targetId, FriendshipStatus.PENDING))
                .thenReturn(100L);

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.sendRequest(requesterId, targetId)
        );

        assertThat(ex.getMessage()).contains("too many pending friend requests");
        verify(friendshipRepository, never()).findBetween(any(), any());
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    void sendRequest_shouldThrow_whenExistingFriendshipAccepted() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        CaroUser requester = mock(CaroUser.class);
        CaroUser addressee = mock(CaroUser.class);

        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(addressee));
        when(friendshipRepository.countByAddressee_IdAndStatus(targetId, FriendshipStatus.PENDING))
                .thenReturn(0L);

        CaroFriendship existing = mock(CaroFriendship.class);
        when(existing.getStatus()).thenReturn(FriendshipStatus.ACCEPTED);
        when(friendshipRepository.findBetween(requesterId, targetId))
                .thenReturn(Optional.of(existing));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.sendRequest(requesterId, targetId)
        );

        assertThat(ex.getMessage()).contains("already friends");
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    void sendRequest_shouldThrow_whenExistingFriendshipPending() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        CaroUser requester = mock(CaroUser.class);
        CaroUser addressee = mock(CaroUser.class);

        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(addressee));
        when(friendshipRepository.countByAddressee_IdAndStatus(targetId, FriendshipStatus.PENDING))
                .thenReturn(0L);

        CaroFriendship existing = mock(CaroFriendship.class);
        when(existing.getStatus()).thenReturn(FriendshipStatus.PENDING);
        when(friendshipRepository.findBetween(requesterId, targetId))
                .thenReturn(Optional.of(existing));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.sendRequest(requesterId, targetId)
        );

        assertThat(ex.getMessage()).contains("already pending");
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    void sendRequest_shouldThrow_whenExistingFriendshipBlocked() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        CaroUser requester = mock(CaroUser.class);
        CaroUser addressee = mock(CaroUser.class);

        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(addressee));
        when(friendshipRepository.countByAddressee_IdAndStatus(targetId, FriendshipStatus.PENDING))
                .thenReturn(0L);

        CaroFriendship existing = mock(CaroFriendship.class);
        when(existing.getStatus()).thenReturn(FriendshipStatus.BLOCKED);
        when(friendshipRepository.findBetween(requesterId, targetId))
                .thenReturn(Optional.of(existing));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.sendRequest(requesterId, targetId)
        );

        assertThat(ex.getMessage()).contains("blocked");
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    void sendRequest_shouldThrow_whenExistingFriendshipDeclined() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        CaroUser requester = mock(CaroUser.class);
        CaroUser addressee = mock(CaroUser.class);

        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(addressee));
        when(friendshipRepository.countByAddressee_IdAndStatus(targetId, FriendshipStatus.PENDING))
                .thenReturn(0L);

        CaroFriendship existing = mock(CaroFriendship.class);
        when(existing.getStatus()).thenReturn(FriendshipStatus.DECLINED);
        when(friendshipRepository.findBetween(requesterId, targetId))
                .thenReturn(Optional.of(existing));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.sendRequest(requesterId, targetId)
        );

        assertThat(ex.getMessage()).contains("declined");
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    void sendRequest_shouldCreateNewFriendship_whenAllOkAndNoExistingFriendship() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        CaroUser requester = mock(CaroUser.class);
        CaroUser addressee = mock(CaroUser.class);

        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(addressee));
        when(friendshipRepository.countByAddressee_IdAndStatus(targetId, FriendshipStatus.PENDING))
                .thenReturn(0L);
        when(friendshipRepository.findBetween(requesterId, targetId))
                .thenReturn(Optional.empty());

        ArgumentCaptor<CaroFriendship> captor = ArgumentCaptor.forClass(CaroFriendship.class);

        service.sendRequest(requesterId, targetId);

        verify(friendshipRepository).save(captor.capture());
        CaroFriendship saved = captor.getValue();

        assertThat(saved.getRequester()).isEqualTo(requester);
        assertThat(saved.getAddressee()).isEqualTo(addressee);
        assertThat(saved.getStatus()).isEqualTo(FriendshipStatus.PENDING);
    }

    // -------- acceptRequest --------

    @Test
    void acceptRequest_shouldThrow_whenFriendshipNotFound() {
        UUID currentUserId = UUID.randomUUID();
        UUID friendshipId = UUID.randomUUID();

        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.acceptRequest(currentUserId, friendshipId)
        );

        assertThat(ex.getMessage()).contains("does not exist");
    }

    @Test
    void acceptRequest_shouldThrow_whenCurrentUserIsNotAddressee() {
        UUID currentUserId = UUID.randomUUID();
        UUID friendshipId = UUID.randomUUID();

        CaroUser addressee = mock(CaroUser.class);
        when(addressee.getId()).thenReturn(UUID.randomUUID()); // != currentUserId

        CaroFriendship friendship = mock(CaroFriendship.class);
        when(friendship.getAddressee()).thenReturn(addressee);
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(friendship));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.acceptRequest(currentUserId, friendshipId)
        );

        assertThat(ex.getMessage()).contains("cannot accept a friend request from someone else");
        verify(friendship, never()).setStatus(any());
    }

    @Test
    void acceptRequest_shouldThrow_whenFriendshipNotPending() {
        UUID currentUserId = UUID.randomUUID();
        UUID friendshipId = UUID.randomUUID();

        CaroUser addressee = mock(CaroUser.class);
        when(addressee.getId()).thenReturn(currentUserId);

        CaroFriendship friendship = mock(CaroFriendship.class);
        when(friendship.getAddressee()).thenReturn(addressee);
        when(friendship.getStatus()).thenReturn(FriendshipStatus.ACCEPTED);
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(friendship));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.acceptRequest(currentUserId, friendshipId)
        );

        assertThat(ex.getMessage()).contains("Only pending friend requests can be accepted");
        verify(friendship, never()).setStatus(any());
    }

    @Test
    void acceptRequest_shouldSetStatusAccepted_whenAllOk() {
        UUID currentUserId = UUID.randomUUID();
        UUID friendshipId = UUID.randomUUID();

        CaroUser addressee = mock(CaroUser.class);
        when(addressee.getId()).thenReturn(currentUserId);

        CaroFriendship friendship = mock(CaroFriendship.class);
        when(friendship.getAddressee()).thenReturn(addressee);
        when(friendship.getStatus()).thenReturn(FriendshipStatus.PENDING);
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(friendship));

        service.acceptRequest(currentUserId, friendshipId);

        verify(friendship).setStatus(FriendshipStatus.ACCEPTED);
    }

    // -------- unfriend --------

    @Test
    void unfriend_shouldThrow_whenFriendshipNotFound() {
        UUID currentUserId = UUID.randomUUID();
        UUID friendId = UUID.randomUUID();

        when(friendshipRepository.findBetween(currentUserId, friendId))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.unfriend(currentUserId, friendId)
        );

        assertThat(ex.getMessage()).contains("No friendship found");
        verify(friendshipRepository, never()).delete(any());
    }

    @Test
    void unfriend_shouldThrow_whenFriendshipNotAccepted() {
        UUID currentUserId = UUID.randomUUID();
        UUID friendId = UUID.randomUUID();

        CaroFriendship friendship = mock(CaroFriendship.class);
        when(friendship.getStatus()).thenReturn(FriendshipStatus.PENDING);

        when(friendshipRepository.findBetween(currentUserId, friendId))
                .thenReturn(Optional.of(friendship));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.unfriend(currentUserId, friendId)
        );

        assertThat(ex.getMessage()).contains("only unfriend users you are currently friends with");
        verify(friendshipRepository, never()).delete(any());
    }

    @Test
    void unfriend_shouldDeleteFriendship_whenStatusAccepted() {
        UUID currentUserId = UUID.randomUUID();
        UUID friendId = UUID.randomUUID();

        CaroFriendship friendship = mock(CaroFriendship.class);
        when(friendship.getStatus()).thenReturn(FriendshipStatus.ACCEPTED);

        when(friendshipRepository.findBetween(currentUserId, friendId))
                .thenReturn(Optional.of(friendship));

        service.unfriend(currentUserId, friendId);

        verify(friendshipRepository).delete(friendship);
    }

    // -------- getFriends --------

    @Test
    void getFriends_shouldMapFriendsCorrectly_whenUserIsRequesterOrAddressee() {
        UUID userId = UUID.randomUUID();
        UUID friendId1 = UUID.randomUUID();
        UUID friendId2 = UUID.randomUUID();

        CaroUser user = new CaroUser();
        user.setId(userId);
        user.setUsername("currentUser");
        user.setEmail("current@example.com");

        CaroUser friend1 = new CaroUser();
        friend1.setId(friendId1);
        friend1.setUsername("friend1");
        friend1.setEmail("friend1@example.com");

        CaroUser friend2 = new CaroUser();
        friend2.setId(friendId2);
        friend2.setUsername("friend2");
        friend2.setEmail("friend2@example.com");

        // Friendship 1: user = requester, friend1 = addressee
        CaroFriendship f1 = mock(CaroFriendship.class);
        when(f1.getRequester()).thenReturn(user);
        when(f1.getAddressee()).thenReturn(friend1);

        // Friendship 2: friend2 = requester, user = addressee
        CaroFriendship f2 = mock(CaroFriendship.class);
        when(f2.getRequester()).thenReturn(friend2);

        when(friendshipRepository.findAcceptedForUser(userId))
                .thenReturn(List.of(f1, f2));

        // act
        List<FriendResponse> result = service.getFriends(userId);

        // assert
        assertThat(result).hasSize(2);
        assertThat(result)
                .extracting(FriendResponse::id)
                .containsExactlyInAnyOrder(friendId1, friendId2);
        assertThat(result)
                .extracting(FriendResponse::username)
                .containsExactlyInAnyOrder("friend1", "friend2");
        assertThat(result)
                .extracting(FriendResponse::email)
                .containsExactlyInAnyOrder("friend1@example.com", "friend2@example.com");

        verify(friendshipRepository).findAcceptedForUser(userId);
    }

}

