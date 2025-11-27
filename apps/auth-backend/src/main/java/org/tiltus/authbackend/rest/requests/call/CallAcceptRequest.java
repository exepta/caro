package org.tiltus.authbackend.rest.requests.call;

import java.util.UUID;

public record CallAcceptRequest(
        String callId,
        UUID fromUserId,
        UUID toUserId
) {
}
