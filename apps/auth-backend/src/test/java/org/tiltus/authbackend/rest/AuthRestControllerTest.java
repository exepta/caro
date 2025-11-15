// language: java
package org.tiltus.authbackend.rest;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.mockito.ArgumentMatchers;
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
import org.tiltus.authbackend.rest.response.TokenResponse;
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

    @Test
    void register_success_returnsCreatedTokens() {
        RegisterRequest req = new RegisterRequest("alice", "alice@example.com", "password");
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("hashed");
        CaroUser saved = mock(CaroUser.class);
        UUID id = UUID.randomUUID();
        when(saved.getId()).thenReturn(id);
        when(saved.getUsername()).thenReturn("alice");
        when(userRepository.save(any())).thenReturn(saved);

        when(jwtService.issueAccess(id, "alice")).thenReturn("access-token");
        when(jwtService.issueRefresh(id)).thenReturn("refresh-token");

        ResponseEntity<TokenResponse> resp = controller.register(req);

        assertEquals(HttpStatus.CREATED, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("access-token", resp.getBody().accessToken());
        assertEquals("refresh-token", resp.getBody().refreshToken());

        verify(refreshTokenRepository).deleteByUser(saved);
        verify(refreshTokenRepository).save(ArgumentMatchers.any(RefreshToken.class));
    }

    @Test
    void register_conflict_whenEmailExists() {
        RegisterRequest req = new RegisterRequest("bob", "bob@example.com", "pw");
        // accept any string to match controller behavior
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.register(req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void login_success_returnsTokens() {
        LoginRequest req = new LoginRequest("alice@example.com", "pw");
        CaroUser user = mock(CaroUser.class);
        UUID id = UUID.randomUUID();
        when(user.getId()).thenReturn(id);
        when(user.getUsername()).thenReturn("alice");
        when(user.getPasswordHash()).thenReturn("hashed");
        when(userRepository.findByEmailOrUsername("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);
        when(jwtService.issueAccess(id, "alice")).thenReturn("access");
        when(jwtService.issueRefresh(id)).thenReturn("refresh");

        ResponseEntity<TokenResponse> resp = controller.login(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("access", resp.getBody().accessToken());
        assertEquals("refresh", resp.getBody().refreshToken());
        verify(refreshTokenRepository).deleteByUser(user);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void login_invalidPassword_throwsUnauthorized() {
        LoginRequest req = new LoginRequest("alice", "wrong");
        CaroUser user = mock(CaroUser.class);
        when(user.getPasswordHash()).thenReturn("hashed");
        when(userRepository.findByEmailOrUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.login(req));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void refresh_success_issuesNewTokens() {
        String providedRefresh = "valid-refresh";
        UUID uid = UUID.randomUUID();
        RefreshRequest req = new RefreshRequest(providedRefresh);

        // mock parsed JWS and claims
        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(uid.toString());

        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        RefreshToken stored = mock(RefreshToken.class);
        CaroUser user = mock(CaroUser.class);
        when(user.getId()).thenReturn(uid);
        when(user.getUsername()).thenReturn("alice");
        when(stored.getUser()).thenReturn(user);
        when(stored.getExpiresAt()).thenReturn(Instant.now().plus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByToken(providedRefresh)).thenReturn(Optional.of(stored));

        when(jwtService.issueAccess(uid, "alice")).thenReturn("new-access");
        when(jwtService.issueRefresh(uid)).thenReturn("new-refresh");

        ResponseEntity<TokenResponse> resp = controller.refresh(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("new-access", resp.getBody().accessToken());
        assertEquals("new-refresh", resp.getBody().refreshToken());

        verify(refreshTokenRepository).deleteByUser(user);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void refresh_typMismatch_throwsUnauthorized() {
        String providedRefresh = "bad-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("access"); // wrong type

        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.refresh(req));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void refresh_expired_throwsUnauthorized() {
        String providedRefresh = "expired-refresh";
        UUID uid = UUID.randomUUID();
        RefreshRequest req = new RefreshRequest(providedRefresh);

        @SuppressWarnings("unchecked")
        Jws<Claims> jws = mock(Jws.class);
        Claims claims = mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.get("typ")).thenReturn("refresh");
        when(claims.getSubject()).thenReturn(uid.toString());
        when(jwtService.parse(providedRefresh)).thenReturn(jws);

        RefreshToken stored = mock(RefreshToken.class);
        when(stored.getExpiresAt()).thenReturn(Instant.now().minus(Duration.ofDays(1))); // expired
        when(refreshTokenRepository.findByToken(providedRefresh)).thenReturn(Optional.of(stored));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.refresh(req));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }
}
