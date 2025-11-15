package org.tiltus.authbackend.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.services.JwtService;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private CaroUserRepository userRepository;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authorizationHeaderStartsWithBearer_setsAuthentication() throws Exception {
        String token = "validToken";
        UUID userId = UUID.randomUUID();
        CaroUser user = new CaroUser();
        user.setId(userId);

        Mockito.when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        @SuppressWarnings("unchecked")
        io.jsonwebtoken.Jws<io.jsonwebtoken.Claims> jws = Mockito.mock(io.jsonwebtoken.Jws.class);
        io.jsonwebtoken.Claims claims = Mockito.mock(io.jsonwebtoken.Claims.class);
        Mockito.when(claims.getSubject()).thenReturn(userId.toString());
        Mockito.when(jws.getBody()).thenReturn(claims);
        Mockito.when(jwtService.parse(token)).thenReturn(jws);

        Mockito.when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        SecurityContextHolder.clearContext();
        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(userId.toString(), SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        Mockito.verify(filterChain).doFilter(request, response);
    }

    @Test
    void authorizationHeaderMissing_doesNotSetAuthentication() throws Exception {
        Mockito.when(request.getHeader("Authorization")).thenReturn(null);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        Mockito.verify(filterChain).doFilter(request, response);
    }

    @Test
    void invalidToken_doesNotSetAuthentication() throws Exception {
        String token = "invalidToken";

        Mockito.when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        Mockito.when(jwtService.parse(token)).thenThrow(new JwtException("Invalid token"));

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        Mockito.verify(filterChain).doFilter(request, response);
    }

    @Test
    void userNotFound_doesNotSetAuthentication() throws Exception {
        String token = "validToken";
        UUID userId = UUID.randomUUID();

        Mockito.when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        @SuppressWarnings("unchecked")
        io.jsonwebtoken.Jws<io.jsonwebtoken.Claims> jws = Mockito.mock(io.jsonwebtoken.Jws.class);
        io.jsonwebtoken.Claims claims = Mockito.mock(io.jsonwebtoken.Claims.class);
        Mockito.when(claims.getSubject()).thenReturn(userId.toString());
        Mockito.when(jws.getBody()).thenReturn(claims);
        Mockito.when(jwtService.parse(token)).thenReturn(jws);

        Mockito.when(userRepository.findById(userId)).thenReturn(Optional.empty());

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        Mockito.verify(filterChain).doFilter(request, response);
    }
}
