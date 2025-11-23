package org.tiltus.authbackend.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.tiltus.authbackend.rest.requests.SendFriendRequest;
import org.tiltus.authbackend.rest.response.FriendResponse;
import org.tiltus.authbackend.services.CaroFriendshipService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendRestController {

    private final CaroFriendshipService friendshipService;

    @PostMapping("/requests")
    public ResponseEntity<Void> sendFriendRequest(
            @AuthenticationPrincipal String userId,
            @RequestBody SendFriendRequest request
    ) {
        UUID currentUserId = UUID.fromString(userId);
        friendshipService.sendRequest(currentUserId, request.targetUserId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<Void> acceptFriendRequest(
            @AuthenticationPrincipal String userId,
            @PathVariable("id") UUID friendshipId
    ) {
        UUID currentUserId = UUID.fromString(userId);
        friendshipService.acceptRequest(currentUserId, friendshipId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> unfriend(
            @AuthenticationPrincipal String userId,
            @PathVariable("friendId") UUID friendId
    ) {
        UUID currentUserId = UUID.fromString(userId);
        friendshipService.unfriend(currentUserId, friendId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<FriendResponse>> getFriends(
            @AuthenticationPrincipal String userId
    ) {
        UUID currentUserId = UUID.fromString(userId);
        var friends = friendshipService.getFriends(currentUserId);
        return ResponseEntity.ok(friends);
    }
}
