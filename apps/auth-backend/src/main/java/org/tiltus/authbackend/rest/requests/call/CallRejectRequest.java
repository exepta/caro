package org.tiltus.authbackend.rest.requests.call;

import java.util.UUID;

public record CallRejectRequest(
        String callId,
        UUID fromUserId,
        UUID toUserId
) {
}
