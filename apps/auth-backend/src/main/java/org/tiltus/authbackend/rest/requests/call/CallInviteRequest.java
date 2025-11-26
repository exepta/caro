package org.tiltus.authbackend.rest.requests.call;

import java.util.UUID;

public record CallInviteRequest(
        String callId,
        UUID fromUserId,
        UUID toUserId,
        String fromUsername
) {
}
