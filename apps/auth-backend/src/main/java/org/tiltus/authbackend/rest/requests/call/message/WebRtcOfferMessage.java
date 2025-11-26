package org.tiltus.authbackend.rest.requests.call.message;

import java.util.UUID;

public record WebRtcOfferMessage(
        UUID callId,
        UUID toUserId,
        String sdp
) {}
