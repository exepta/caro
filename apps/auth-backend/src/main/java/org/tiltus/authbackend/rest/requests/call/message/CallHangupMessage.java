package org.tiltus.authbackend.rest.requests.call.message;

import java.util.UUID;

public record CallHangupMessage(
        UUID callId,
        UUID toUserId
) {}
