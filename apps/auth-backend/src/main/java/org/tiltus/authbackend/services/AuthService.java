package org.tiltus.authbackend.services;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.model.CaroUserProfile;
import org.tiltus.authbackend.model.RefreshToken;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.repositories.RefreshTokenRepository;
import org.tiltus.authbackend.rest.requests.LoginRequest;
import org.tiltus.authbackend.rest.requests.RefreshRequest;
import org.tiltus.authbackend.rest.requests.RegisterRequest;
import org.tiltus.authbackend.rest.response.TokenResponse;

import java.time.Duration;
import java.time.Instant;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CaroUserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public TokenResponse register(RegisterRequest request) {
        CaroUser user = new CaroUser(
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password()),
                "",
                ""
        );
        user.setTagId(generateTagId(request.username()));
        user.setProfile(new CaroUserProfile());
        CaroUser savedUser = userRepository.save(user);

        return issueTokensFor(savedUser);
    }

    public TokenResponse login(LoginRequest request) {
        CaroUser user = userRepository.findByEmailOrUsername(request.emailOrUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return issueTokensFor(user);
    }


    public TokenResponse refresh(RefreshRequest request) {
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

        return new TokenResponse(access, refresh);
    }

    private TokenResponse issueTokensFor(CaroUser user) {
        refreshTokenRepository.deleteByUser(user);

        String access = jwtService.issueAccess(user.getId(), user.getUsername());
        String refresh = jwtService.issueRefresh(user.getId());

        RefreshToken refreshToken = new RefreshToken(
                user,
                refresh,
                Instant.now().plus(Duration.ofDays(30))
        );
        refreshTokenRepository.save(refreshToken);

        return new TokenResponse(access, refresh);
    }

    private String generateTagId(String username) {
        Random random = new Random();
        for (int i = 0; i < 10; i++) {
            String tag = "#" + String.format("%06d", random.nextInt(1_000_000));
            if (!userRepository.existsByUsernameIgnoreCaseAndTagId(username, tag)) {
                return tag;
            }
        }
        throw new IllegalStateException("Unable to generate unique tag id");
    }

}
