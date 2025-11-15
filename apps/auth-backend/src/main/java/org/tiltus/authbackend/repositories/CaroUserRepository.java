package org.tiltus.authbackend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.tiltus.authbackend.model.CaroUser;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaroUserRepository extends JpaRepository<CaroUser, UUID> {

    Optional<CaroUser> findByEmailIgnoreCase(String email);
    Optional<CaroUser> findByUsernameIgnoreCase(String username);

    @Query("""
       SELECT user from CaroUser user\s
          where lower(user.email)=lower(:q) or lower(user.username)=lower(:q)\s
   \s""")
    Optional<CaroUser> findByEmailOrUsername(@Param("q") String query);

    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);

}
