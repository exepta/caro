package org.tiltus.authbackend.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.rest.requests.UserSettingsRequest;
import org.tiltus.authbackend.rest.response.UserSettingsResponse;
import org.tiltus.authbackend.services.CaroUserService;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserRestController {

    private final CaroUserRepository userRepository;
    private final CaroUserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserSettingsResponse> me(@AuthenticationPrincipal String userId) {
        if (userId == null || userId.isEmpty() || "anonymousUser".equals(userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        final UUID uuid;
        try {
            uuid = UUID.fromString(userId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user id");
        }

        CaroUser user = userRepository.findById(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(UserSettingsResponse.from(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserSettingsResponse> updateMe(
            @AuthenticationPrincipal String userId,
            @RequestBody UserSettingsRequest request
    ) {
        if (userId == null || userId.isEmpty() || "anonymousUser".equals(userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        try {
            UUID.fromString(userId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user id");
        }

        CaroUser savedUser = userService.save(userId, request);
        return ResponseEntity.ok(UserSettingsResponse.from(savedUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserSettingsResponse> getById(@PathVariable("id") String userId) {
        if (userId == null || userId.isEmpty() || "anonymousUser".equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nothing Happens");
        }

        try {
            UUID.fromString(userId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user id");
        }

        CaroUser user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(UserSettingsResponse.from(user));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserSettingsResponse> getByUsername(@PathVariable("username") String username) {
        if (username == null || username.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username cannot be empty");
        }

        CaroUser user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(UserSettingsResponse.from(user));
    }
}
