package org.tiltus.authbackend.repositories;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.RefreshToken;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenRepositoryTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    void findByToken_returnsRefreshTokenWhenTokenExists() {
        String token = "validToken";
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);

        Mockito.when(refreshTokenRepository.findByToken(token)).thenReturn(Optional.of(refreshToken));

        Optional<RefreshToken> result = refreshTokenRepository.findByToken(token);

        assertTrue(result.isPresent());
        assertEquals(token, result.get().getToken());
    }

    @Test
    void findByToken_returnsEmptyWhenTokenDoesNotExist() {
        String token = "nonexistentToken";

        Mockito.when(refreshTokenRepository.findByToken(token)).thenReturn(Optional.empty());

        Optional<RefreshToken> result = refreshTokenRepository.findByToken(token);

        assertTrue(result.isEmpty());
    }

    @Test
    void deleteByUser_deletesRefreshTokensForUser() {
        CaroUser user = new CaroUser();
        user.setId(UUID.randomUUID());

        Mockito.doNothing().when(refreshTokenRepository).deleteByUser(user);

        assertDoesNotThrow(() -> refreshTokenRepository.deleteByUser(user));
        Mockito.verify(refreshTokenRepository, Mockito.times(1)).deleteByUser(user);
    }
}
