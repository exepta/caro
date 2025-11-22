package org.tiltus.authbackend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.tiltus.authbackend.model.CaroUserProfile;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaroProfileRepository extends JpaRepository<CaroUserProfile, UUID> {

    Optional<CaroUserProfile> findByUserId(UUID userId);
}
