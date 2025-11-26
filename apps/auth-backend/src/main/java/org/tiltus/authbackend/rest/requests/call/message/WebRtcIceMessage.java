package org.tiltus.authbackend.rest.requests.call.message;

import java.util.UUID;

public record WebRtcIceMessage(
        UUID callId,
        UUID toUserId,
        String candidate,
        String sdpMid,
        Integer sdpMLineIndex
) {}
