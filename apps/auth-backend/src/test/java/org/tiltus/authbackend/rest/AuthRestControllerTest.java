package org.tiltus.authbackend.rest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.requests.LoginRequest;
import org.tiltus.authbackend.rest.requests.RefreshRequest;
import org.tiltus.authbackend.rest.requests.RegisterRequest;
import org.tiltus.authbackend.rest.response.TokenResponse;
import org.tiltus.authbackend.services.AuthService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthRestControllerTest {

    @Mock
    private CaroUserRepository userRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthRestController controller;

    @Test
    void register_success_returnsCreatedTokens() {
        RegisterRequest req = new RegisterRequest("alice@example.com", "alice", "password");

        when(userRepository.existsByEmailIgnoreCase(req.email())).thenReturn(false);

        TokenResponse expected = new TokenResponse("access-token", "refresh-token");
        when(authService.register(req)).thenReturn(expected);

        ResponseEntity<TokenResponse> resp = controller.register(req);

        assertEquals(HttpStatus.CREATED, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("access-token", resp.getBody().accessToken());
        assertEquals("refresh-token", resp.getBody().refreshToken());

        verify(userRepository).existsByEmailIgnoreCase(req.email());
        verify(authService).register(req);
    }

    @Test
    void register_conflict_whenEmailExists() {
        RegisterRequest req = new RegisterRequest("bob@example.com", "bob", "pw");

        when(userRepository.existsByEmailIgnoreCase(req.email())).thenReturn(true);

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> controller.register(req));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(userRepository).existsByEmailIgnoreCase(req.email());
        verifyNoInteractions(authService);
    }

    @Test
    void login_success_returnsTokens() {
        LoginRequest req = new LoginRequest("alice@example.com", "pw");

        TokenResponse expected = new TokenResponse("access", "refresh");
        when(authService.login(req)).thenReturn(expected);

        ResponseEntity<TokenResponse> resp = controller.login(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("access", resp.getBody().accessToken());
        assertEquals("refresh", resp.getBody().refreshToken());

        verify(authService).login(req);
    }

    @Test
    void login_invalidPayload_throwsBadRequest() {
        LoginRequest req = new LoginRequest("alice", "   ");

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> controller.login(req));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(authService);
    }

    @Test
    void login_invalidCredentials_propagatesUnauthorizedFromService() {
        LoginRequest req = new LoginRequest("alice", "wrong");

        when(authService.login(req))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> controller.login(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(authService).login(req);
    }

    @Test
    void refresh_success_issuesNewTokens() {
        String providedRefresh = "valid-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        TokenResponse expected = new TokenResponse("new-access", "new-refresh");
        when(authService.refresh(req)).thenReturn(expected);

        ResponseEntity<TokenResponse> resp = controller.refresh(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("new-access", resp.getBody().accessToken());
        assertEquals("new-refresh", resp.getBody().refreshToken());

        verify(authService).refresh(req);
    }

    @Test
    void refresh_invalidPayload_throwsBadRequest() {
        RefreshRequest req = new RefreshRequest("   ");

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> controller.refresh(req));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(authService);
    }

    @Test
    void refresh_unauthorized_propagatesFromService() {
        String providedRefresh = "bad-refresh";
        RefreshRequest req = new RefreshRequest(providedRefresh);

        when(authService.refresh(req))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh"));

        ResponseStatusException ex =
                assertThrows(ResponseStatusException.class, () -> controller.refresh(req));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(authService).refresh(req);
    }
}
