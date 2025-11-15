package org.tiltus.authbackend.rest;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.RefreshToken;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.repositories.RefreshTokenRepository;
import org.tiltus.authbackend.rest.requests.LoginRequest;
import org.tiltus.authbackend.rest.requests.RefreshRequest;
import org.tiltus.authbackend.rest.requests.RegisterRequest;
import org.tiltus.authbackend.services.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthRestControllerTest {

    @Mock
    private CaroUserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthRestController controller;

    // ----------------------------------
    // REGISTER: invalid payload
    // ----------------------------------
    @Test
    void register_invalidPayload_throwsBadRequest() {
        RegisterRequest req = new RegisterRequest(null, "alice", "pw");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.register(req)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Invalid payload", ex.getReason());
        verifyNoInteractions(userRepository, refreshTokenRepository, passwordEncoder, jwtService);
    }

    // ----------------------------------
    // LOGIN: invalid payload
    // ----------------------------------
    @Test
    void login_invalidPayload_throwsBadRequest() {
        // password blank -> invalid
        LoginRequest req = new LoginRequest("alice", " ");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.login(req)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Invalid payload", ex.getReason());
        verifyNoInteractions(userRepository, refreshTokenRepository, passwordEncoder, jwtService);
    }

    // ----------------------------------
    // LOGIN: user not found
    // ----------------------------------
    @Test
    void login_userNotFound_throwsUnauthorized() {
        LoginRequest req = new LoginRequest("unknown", "pw");
        when(userRepository.findByEmailOrUsername("unknown")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.login(req)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Invalid credentials", ex.getReason());
        verify(userRepository).findByEmailOrUsername("unknown");
        verifyNoMoreInteractions(userRepository);
        verifyNoInteractions(refreshTokenRepository, passwordEncoder, jwtService);
    }

    // ----------------------------------
    // REFRESH: missing/blank token
    // ----------------------------------
    @Test
    void refresh_missingToken_throwsBadRequest() {
        RefreshRequest req = new RefreshRequest("   "); // blank

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.refresh(req)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Invalid refresh token", ex.getReason());
        verifyNoInteractions(jwtService, refreshTokenRepository, userRepository);
    }

    // ----------------------------------
    // REFRESH: token unknown in DB
    // ----------------------------------
    @Test
    void refresh_unknownToken_throwsUnauthorized() {
        String providedRefresh = "unknown-refresh";
        UUID uid = UUID.randomUUID();
        RefreshRequest req = new RefreshRequest(providedRefresh);

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(uid.toString());
        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        when(refreshTokenRepository.findByToken(providedRefresh)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.refresh(req)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Invalid refresh token", ex.getReason());

        verify(jwtService).parse(providedRefresh);
        verify(refreshTokenRepository).findByToken(providedRefresh);
        verifyNoMoreInteractions(refreshTokenRepository);
    }

    // ----------------------------------
    // REFRESH: user mismatch (Token-Subject != User-ID)
    // ----------------------------------
    @Test
    void refresh_userMismatch_throwsUnauthorized() {
        String providedRefresh = "mismatch-refresh";
        UUID tokenUserId = UUID.randomUUID();
        UUID dbUserId = UUID.randomUUID();
        RefreshRequest req = new RefreshRequest(providedRefresh);

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(tokenUserId.toString());
        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        CaroUser user = mock(CaroUser.class);
        when(user.getId()).thenReturn(dbUserId);

        RefreshToken stored = mock(RefreshToken.class);
        when(stored.getUser()).thenReturn(user);
        when(stored.getExpiresAt()).thenReturn(Instant.now().plus(Duration.ofDays(1)));

        when(refreshTokenRepository.findByToken(providedRefresh)).thenReturn(Optional.of(stored));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.refresh(req)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Token mismatch user", ex.getReason());
    }
}
