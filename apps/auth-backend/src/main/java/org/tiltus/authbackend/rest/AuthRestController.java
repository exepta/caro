package org.tiltus.authbackend.rest;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.RefreshToken;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.repositories.RefreshTokenRepository;
import org.tiltus.authbackend.rest.requests.LoginRequest;
import org.tiltus.authbackend.rest.requests.RefreshRequest;
import org.tiltus.authbackend.rest.requests.RegisterRequest;
import org.tiltus.authbackend.rest.response.TokenResponse;
import org.tiltus.authbackend.services.JwtService;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRestController {

    private final CaroUserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@RequestBody RegisterRequest request) {
        if (request.email() == null || request.email().isBlank()
                || request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payload");
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already used");
        }

        CaroUser user = new CaroUser(request.username(), request.email(), passwordEncoder.encode(request.password()), "", "");
        user.setTagId("#333");
        CaroUser savedUser = userRepository.save(user);

        refreshTokenRepository.deleteByUser(savedUser);
        String access = jwtService.issueAccess(savedUser.getId(), savedUser.getUsername());
        String refresh = jwtService.issueRefresh(savedUser.getId());
        RefreshToken refreshToken = new RefreshToken(savedUser, refresh, Instant.now().plus(Duration.ofDays(30)));
        refreshTokenRepository.save(refreshToken);

        TokenResponse response = new TokenResponse(access, refresh);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        if (request.emailOrUsername() == null || request.emailOrUsername().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payload");
        }

        CaroUser user = userRepository.findByEmailOrUsername(request.emailOrUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        refreshTokenRepository.deleteByUser(user);
        String access = jwtService.issueAccess(user.getId(), user.getUsername());
        String refresh = jwtService.issueRefresh(user.getId());
        RefreshToken refreshToken = new RefreshToken(user, refresh, Instant.now().plus(Duration.ofDays(30)));
        refreshTokenRepository.save(refreshToken);

        TokenResponse response = new TokenResponse(access, refresh);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshRequest request) {
        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid refresh token");
        }

        Jws<Claims> parsed = jwtService.parse(request.refreshToken());
        Object typ = parsed.getBody().get("typ");
        if (!"refresh".equals(typ)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        UUID userId = UUID.fromString(parsed.getBody().getSubject());
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        CaroUser user = refreshToken.getUser();
        if (!userId.equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token mismatch user");
        }

        refreshTokenRepository.deleteByUser(user);
        String access = jwtService.issueAccess(user.getId(), user.getUsername());
        String refresh = jwtService.issueRefresh(user.getId());
        refreshToken = new RefreshToken(user, refresh, Instant.now().plus(Duration.ofDays(30)));
        refreshTokenRepository.save(refreshToken);

        TokenResponse response = new TokenResponse(access, refresh);
        return ResponseEntity.ok(response);
    }
}
