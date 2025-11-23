package org.tiltus.authbackend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.tiltus.authbackend.enums.FriendshipStatus;
import org.tiltus.authbackend.model.CaroFriendship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaroFriendshipRepository extends JpaRepository<CaroFriendship, UUID> {

    @Query("""
        SELECT f FROM CaroFriendship f
        WHERE (f.requester.id = :userId1 AND f.addressee.id = :userId2)
           OR (f.requester.id = :userId2 AND f.addressee.id = :userId1)
        """)
    Optional<CaroFriendship> findBetween(UUID userId1, UUID userId2);

    long countByAddressee_IdAndStatus(UUID addresseeId, FriendshipStatus status);

    List<CaroFriendship> findByAddressee_IdAndStatus(UUID addresseeId, FriendshipStatus status);

    List<CaroFriendship> findByRequester_IdAndStatus(UUID requesterId, FriendshipStatus status);

    @Query("""
    SELECT f FROM CaroFriendship f
        JOIN FETCH f.requester r
        JOIN FETCH f.addressee a
    WHERE f.status = 'ACCEPTED'
      AND (r.id = :userId OR a.id = :userId)
    """)
    List<CaroFriendship> findAcceptedForUser(UUID userId);
}
