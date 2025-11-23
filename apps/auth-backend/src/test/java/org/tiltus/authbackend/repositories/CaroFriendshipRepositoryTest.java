package org.tiltus.authbackend.repositories;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tiltus.authbackend.enums.FriendshipStatus;
import org.tiltus.authbackend.model.CaroFriendship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaroFriendshipRepositoryTest {

    @Mock
    private CaroFriendshipRepository repository;

    @Test
    void findBetween_shouldReturnOptionalFriendship() {
        UUID userId1 = UUID.randomUUID();
        UUID userId2 = UUID.randomUUID();
        CaroFriendship friendship = mock(CaroFriendship.class);

        when(repository.findBetween(userId1, userId2)).thenReturn(Optional.of(friendship));

        Optional<CaroFriendship> result = repository.findBetween(userId1, userId2);

        assertThat(result).contains(friendship);
        verify(repository).findBetween(userId1, userId2);
    }

    @Test
    void countByAddressee_IdAndStatus_shouldReturnCount() {
        UUID addresseeId = UUID.randomUUID();
        long expectedCount = 5L;

        when(repository.countByAddressee_IdAndStatus(addresseeId, FriendshipStatus.PENDING))
                .thenReturn(expectedCount);

        long result = repository.countByAddressee_IdAndStatus(addresseeId, FriendshipStatus.PENDING);

        assertThat(result).isEqualTo(expectedCount);
        verify(repository).countByAddressee_IdAndStatus(addresseeId, FriendshipStatus.PENDING);
    }

    @Test
    void findByAddressee_IdAndStatus_shouldReturnList() {
        UUID addresseeId = UUID.randomUUID();
        CaroFriendship f1 = mock(CaroFriendship.class);
        CaroFriendship f2 = mock(CaroFriendship.class);
        List<CaroFriendship> expected = List.of(f1, f2);

        when(repository.findByAddressee_IdAndStatus(addresseeId, FriendshipStatus.PENDING))
                .thenReturn(expected);

        List<CaroFriendship> result =
                repository.findByAddressee_IdAndStatus(addresseeId, FriendshipStatus.PENDING);

        assertThat(result).isEqualTo(expected);
        verify(repository).findByAddressee_IdAndStatus(addresseeId, FriendshipStatus.PENDING);
    }

    @Test
    void findByRequester_IdAndStatus_shouldReturnList() {
        UUID requesterId = UUID.randomUUID();
        CaroFriendship f1 = mock(CaroFriendship.class);

        List<CaroFriendship> expected = List.of(f1);

        when(repository.findByRequester_IdAndStatus(requesterId, FriendshipStatus.ACCEPTED))
                .thenReturn(expected);

        List<CaroFriendship> result =
                repository.findByRequester_IdAndStatus(requesterId, FriendshipStatus.ACCEPTED);

        assertThat(result).isEqualTo(expected);
        verify(repository).findByRequester_IdAndStatus(requesterId, FriendshipStatus.ACCEPTED);
    }

    @Test
    void findAcceptedForUser_shouldReturnList() {
        UUID userId = UUID.randomUUID();
        CaroFriendship f1 = mock(CaroFriendship.class);
        CaroFriendship f2 = mock(CaroFriendship.class);
        List<CaroFriendship> expected = List.of(f1, f2);

        when(repository.findAcceptedForUser(userId)).thenReturn(expected);

        List<CaroFriendship> result = repository.findAcceptedForUser(userId);

        assertThat(result).isEqualTo(expected);
        verify(repository).findAcceptedForUser(userId);
    }
}

