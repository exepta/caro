package org.tiltus.authbackend.rest.requests.call.message;

import java.util.UUID;

public record WebRtcAnswerMessage(
        UUID callId,
        UUID toUserId,
        String sdp
) {}
