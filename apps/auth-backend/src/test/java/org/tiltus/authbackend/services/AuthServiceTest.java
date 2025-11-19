package org.tiltus.authbackend.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.RefreshToken;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.repositories.RefreshTokenRepository;
import org.tiltus.authbackend.rest.requests.LoginRequest;
import org.tiltus.authbackend.rest.requests.RefreshRequest;
import org.tiltus.authbackend.rest.requests.RegisterRequest;
import org.tiltus.authbackend.rest.response.TokenResponse;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private CaroUserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    // ---------- register ----------

    @Test
    void register_success_savesUserAndReturnsTokens() {
        RegisterRequest req = new RegisterRequest(
                "alice",
                "alice@example.com",
                "password"
        );

        when(userRepository.existsByUsernameIgnoreCaseAndTagId(anyString(), anyString()))
                .thenReturn(false);

        when(passwordEncoder.encode("password")).thenReturn("hashed");

        CaroUser savedUser = mock(CaroUser.class);
        UUID userId = UUID.randomUUID();
        when(savedUser.getId()).thenReturn(userId);
        when(savedUser.getUsername()).thenReturn("alice");
        when(userRepository.save(any(CaroUser.class))).thenReturn(savedUser);

        when(jwtService.issueAccess(userId, "alice")).thenReturn("access-token");
        when(jwtService.issueRefresh(userId)).thenReturn("refresh-token");

        TokenResponse result = authService.register(req);

        assertNotNull(result);
        assertEquals("access-token", result.accessToken());
        assertEquals("refresh-token", result.refreshToken());

        ArgumentCaptor<CaroUser> userCaptor = ArgumentCaptor.forClass(CaroUser.class);
        verify(userRepository).save(userCaptor.capture());
        assertNotNull(userCaptor.getValue());

        verify(refreshTokenRepository).deleteByUser(savedUser);
        verify(refreshTokenRepository).save(any(RefreshToken.class));

        verify(userRepository, atLeastOnce())
                .existsByUsernameIgnoreCaseAndTagId(anyString(), anyString());
    }

    @Test
    void register_failsWhenNoUniqueTagCanBeGenerated() {
        RegisterRequest req = new RegisterRequest(
                "alice",
                "alice@example.com",
                "password"
        );

        when(userRepository.existsByUsernameIgnoreCaseAndTagId(anyString(), anyString()))
                .thenReturn(true);

        assertThrows(IllegalStateException.class, () -> authService.register(req));

        verify(userRepository, never()).save(any());
        verifyNoInteractions(jwtService);
        verifyNoInteractions(refreshTokenRepository);
    }

    // ---------- login ----------

    @Test
    void login_success_returnsTokensAndStoresRefreshToken() {
        LoginRequest req = new LoginRequest("alice@example.com", "pw");

        CaroUser user = mock(CaroUser.class);
        UUID userId = UUID.randomUUID();
        when(user.getId()).thenReturn(userId);
        when(user.getUsername()).thenReturn("alice");
        when(user.getPasswordHash()).thenReturn("hashed");

        when(userRepository.findByEmailOrUsername(req.emailOrUsername()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);

        when(jwtService.issueAccess(userId, "alice")).thenReturn("access");
        when(jwtService.issueRefresh(userId)).thenReturn("refresh");

        TokenResponse resp = authService.login(req);

        assertNotNull(resp);
        assertEquals("access", resp.accessToken());
        assertEquals("refresh", resp.refreshToken());

        verify(refreshTokenRepository).deleteByUser(user);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void login_userNotFound_throwsUnauthorized() {
        LoginRequest req = new LoginRequest("unknown", "pw");

        when(userRepository.findByEmailOrUsername(req.emailOrUsername()))
                .thenReturn(Optional.empty());

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> authService.login(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verifyNoInteractions(passwordEncoder);
        verifyNoInteractions(jwtService);
        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void login_invalidPassword_throwsUnauthorized() {
        LoginRequest req = new LoginRequest("alice", "wrong");

        CaroUser user = mock(CaroUser.class);
        when(user.getPasswordHash()).thenReturn("hashed");

        when(userRepository.findByEmailOrUsername(req.emailOrUsername()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> authService.login(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(jwtService, never()).issueAccess(any(), anyString());
        verify(jwtService, never()).issueRefresh(any());
        verify(refreshTokenRepository, never()).deleteByUser(any());
        verify(refreshTokenRepository, never()).save(any());
    }

    // ---------- refresh ----------

    @Test
    void refresh_success_issuesNewTokensAndReplacesStoredRefreshToken() {
        String providedRefresh = "valid-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        UUID uid = UUID.randomUUID();

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(uid.toString());

        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        CaroUser user = mock(CaroUser.class);
        when(user.getId()).thenReturn(uid);
        when(user.getUsername()).thenReturn("alice");

        RefreshToken stored = mock(RefreshToken.class);
        when(stored.getUser()).thenReturn(user);
        when(stored.getExpiresAt()).thenReturn(Instant.now().plus(Duration.ofDays(1)));

        when(refreshTokenRepository.findByToken(providedRefresh))
                .thenReturn(Optional.of(stored));

        when(jwtService.issueAccess(uid, "alice")).thenReturn("new-access");
        when(jwtService.issueRefresh(uid)).thenReturn("new-refresh");

        TokenResponse resp = authService.refresh(req);

        assertNotNull(resp);
        assertEquals("new-access", resp.accessToken());
        assertEquals("new-refresh", resp.refreshToken());

        verify(refreshTokenRepository).deleteByUser(user);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void refresh_wrongType_throwsUnauthorized() {
        String providedRefresh = "bad-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("access");

        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> authService.refresh(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(refreshTokenRepository, never()).findByToken(anyString());
    }

    @Test
    void refresh_tokenNotInStore_throwsUnauthorized() {
        String providedRefresh = "missing-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        UUID uid = UUID.randomUUID();

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(uid.toString());

        when(jwtService.parse(providedRefresh)).thenReturn(jws);
        when(refreshTokenRepository.findByToken(providedRefresh))
                .thenReturn(Optional.empty());

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> authService.refresh(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(jwtService, never()).issueAccess(any(), anyString());
        verify(jwtService, never()).issueRefresh(any());
    }

    @Test
    void refresh_expired_throwsUnauthorized() {
        String providedRefresh = "expired-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        UUID uid = UUID.randomUUID();

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(uid.toString());

        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        RefreshToken stored = mock(RefreshToken.class);
        when(stored.getExpiresAt()).thenReturn(Instant.now().minus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByToken(providedRefresh))
                .thenReturn(Optional.of(stored));

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> authService.refresh(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(jwtService, never()).issueAccess(any(), anyString());
        verify(jwtService, never()).issueRefresh(any());
    }

    @Test
    void refresh_userIdMismatch_throwsUnauthorized() {
        String providedRefresh = "mismatch-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        UUID tokenSubjectId = UUID.randomUUID();
        UUID differentUserId = UUID.randomUUID();

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(tokenSubjectId.toString());

        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        CaroUser user = mock(CaroUser.class);
        when(user.getId()).thenReturn(differentUserId);

        RefreshToken stored = mock(RefreshToken.class);
        when(stored.getUser()).thenReturn(user);
        when(stored.getExpiresAt()).thenReturn(Instant.now().plus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByToken(providedRefresh))
                .thenReturn(Optional.of(stored));

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> authService.refresh(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(jwtService, never()).issueAccess(any(), anyString());
        verify(jwtService, never()).issueRefresh(any());
        verify(refreshTokenRepository, never()).deleteByUser(any());
    }
}
