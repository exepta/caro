package org.tiltus.authbackend.rest.requests;

import java.util.UUID;

public record SendFriendRequest(
        UUID targetUserId
) { }
