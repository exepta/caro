package org.tiltus.authbackend.repositories;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tiltus.authbackend.model.CaroUser;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CaroUserRepositoryTest {

    @Mock
    private CaroUserRepository caroUserRepository;

    @Test
    void findByEmailIgnoreCase_returnsUserWhenEmailExists() {
        String email = "test@example.com";
        CaroUser user = new CaroUser();
        user.setEmail(email);

        Mockito.when(caroUserRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(user));

        Optional<CaroUser> result = caroUserRepository.findByEmailIgnoreCase(email);

        assertTrue(result.isPresent());
        assertEquals(email, result.get().getEmail());
    }

    @Test
    void findByEmailIgnoreCase_returnsEmptyWhenEmailDoesNotExist() {
        String email = "nonexistent@example.com";

        Mockito.when(caroUserRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.empty());

        Optional<CaroUser> result = caroUserRepository.findByEmailIgnoreCase(email);

        assertTrue(result.isEmpty());
    }

    @Test
    void findByUsernameIgnoreCase_returnsUserWhenUsernameExists() {
        String username = "testUser";
        CaroUser user = new CaroUser();
        user.setUsername(username);

        Mockito.when(caroUserRepository.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(user));

        Optional<CaroUser> result = caroUserRepository.findByUsernameIgnoreCase(username);

        assertTrue(result.isPresent());
        assertEquals(username, result.get().getUsername());
    }

    @Test
    void findByUsernameIgnoreCase_returnsEmptyWhenUsernameDoesNotExist() {
        String username = "nonexistentUser";

        Mockito.when(caroUserRepository.findByUsernameIgnoreCase(username)).thenReturn(Optional.empty());

        Optional<CaroUser> result = caroUserRepository.findByUsernameIgnoreCase(username);

        assertTrue(result.isEmpty());
    }

    @Test
    void findByEmailOrUsername_returnsUserWhenEmailMatches() {
        String query = "test@example.com";
        CaroUser user = new CaroUser();
        user.setEmail(query);

        Mockito.when(caroUserRepository.findByEmailOrUsername(query)).thenReturn(Optional.of(user));

        Optional<CaroUser> result = caroUserRepository.findByEmailOrUsername(query);

        assertTrue(result.isPresent());
        assertEquals(query, result.get().getEmail());
    }

    @Test
    void findByEmailOrUsername_returnsUserWhenUsernameMatches() {
        String query = "testUser";
        CaroUser user = new CaroUser();
        user.setUsername(query);

        Mockito.when(caroUserRepository.findByEmailOrUsername(query)).thenReturn(Optional.of(user));

        Optional<CaroUser> result = caroUserRepository.findByEmailOrUsername(query);

        assertTrue(result.isPresent());
        assertEquals(query, result.get().getUsername());
    }

    @Test
    void findByEmailOrUsername_returnsEmptyWhenNoMatch() {
        String query = "nonexistent";

        Mockito.when(caroUserRepository.findByEmailOrUsername(query)).thenReturn(Optional.empty());

        Optional<CaroUser> result = caroUserRepository.findByEmailOrUsername(query);

        assertTrue(result.isEmpty());
    }

    @Test
    void existsByEmailIgnoreCase_returnsTrueWhenEmailExists() {
        String email = "test@example.com";

        Mockito.when(caroUserRepository.existsByEmailIgnoreCase(email)).thenReturn(true);

        boolean result = caroUserRepository.existsByEmailIgnoreCase(email);

        assertTrue(result);
    }

    @Test
    void existsByEmailIgnoreCase_returnsFalseWhenEmailDoesNotExist() {
        String email = "nonexistent@example.com";

        Mockito.when(caroUserRepository.existsByEmailIgnoreCase(email)).thenReturn(false);

        boolean result = caroUserRepository.existsByEmailIgnoreCase(email);

        assertFalse(result);
    }

    @Test
    void existsByUsernameIgnoreCase_returnsTrueWhenUsernameExists() {
        String username = "testUser";

        Mockito.when(caroUserRepository.existsByUsernameIgnoreCase(username)).thenReturn(true);

        boolean result = caroUserRepository.existsByUsernameIgnoreCase(username);

        assertTrue(result);
    }

    @Test
    void existsByUsernameIgnoreCase_returnsFalseWhenUsernameDoesNotExist() {
        String username = "nonexistentUser";

        Mockito.when(caroUserRepository.existsByUsernameIgnoreCase(username)).thenReturn(false);

        boolean result = caroUserRepository.existsByUsernameIgnoreCase(username);

        assertFalse(result);
    }

    @Test
    void existsByUsernameIgnoreCaseAndTagId_returnsTrueWhenUserWithTagExists() {
        String username = "testUser";
        String tagId = "#1234";

        Mockito.when(caroUserRepository.existsByUsernameIgnoreCaseAndTagId(username, tagId))
                .thenReturn(true);

        boolean result = caroUserRepository.existsByUsernameIgnoreCaseAndTagId(username, tagId);

        assertTrue(result);
    }

    @Test
    void existsByUsernameIgnoreCaseAndTagId_returnsFalseWhenUserWithTagDoesNotExist() {
        String username = "nonexistentUser";
        String tagId = "#9999";

        Mockito.when(caroUserRepository.existsByUsernameIgnoreCaseAndTagId(username, tagId))
                .thenReturn(false);

        boolean result = caroUserRepository.existsByUsernameIgnoreCaseAndTagId(username, tagId);

        assertFalse(result);
    }
}
