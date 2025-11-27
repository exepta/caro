package org.tiltus.authbackend.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.tiltus.authbackend.rest.requests.call.CallAcceptRequest;
import org.tiltus.authbackend.rest.requests.call.CallInviteRequest;
import org.tiltus.authbackend.rest.requests.call.CallRejectRequest;
import org.tiltus.authbackend.rest.requests.call.message.CallHangupMessage;
import org.tiltus.authbackend.rest.requests.call.message.WebRtcAnswerMessage;
import org.tiltus.authbackend.rest.requests.call.message.WebRtcIceMessage;
import org.tiltus.authbackend.rest.requests.call.message.WebRtcOfferMessage;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class CallSignalingRestController {

    private final SimpMessageSendingOperations messagingTemplate;

    @MessageMapping("/call/invite")
    public void invite(CallInviteRequest request, Principal principal) {
        if (principal == null) {
            System.out.println("Principal is null on /call/invite");
            return;
        }

        UUID fromUserId = UUID.fromString(principal.getName());
        System.out.println("Received call invite from principal " + fromUserId);

        var safeRequest = new CallInviteRequest(
                request.callId(),
                fromUserId,
                request.toUserId(),
                request.fromUsername()
        );

        messagingTemplate.convertAndSendToUser(
                request.toUserId().toString(),
                "/queue/incoming-call",
                safeRequest
        );
    }

    @MessageMapping("/call/accept")
    public void accept(CallAcceptRequest request) {
        messagingTemplate.convertAndSendToUser(
                request.fromUserId().toString(),
                "/queue/call-accepted",
                request
        );
    }

    @MessageMapping("/call/reject")
    public void reject(CallRejectRequest request) {
        messagingTemplate.convertAndSendToUser(
                request.fromUserId().toString(),
                "/queue/call-rejected",
                request
        );
    }

    @MessageMapping("/call/offer")
    public void offer(WebRtcOfferMessage request, Principal principal) {
        if (principal == null) return;

        UUID fromUserId = UUID.fromString(principal.getName());

        var payload = Map.of(
                "callId", request.callId().toString(),
                "fromUserId", fromUserId.toString(),
                "sdp", request.sdp()
        );

        messagingTemplate.convertAndSendToUser(
                request.toUserId().toString(),
                "/queue/call-offer",
                payload
        );
    }

    @MessageMapping("/call/answer")
    public void answer(WebRtcAnswerMessage request, Principal principal) {
        if (principal == null) return;

        UUID fromUserId = UUID.fromString(principal.getName());

        var payload = Map.of(
                "callId", request.callId().toString(),
                "fromUserId", fromUserId.toString(),
                "sdp", request.sdp()
        );

        messagingTemplate.convertAndSendToUser(
                request.toUserId().toString(),
                "/queue/call-answer",
                payload
        );
    }

    @MessageMapping("/call/ice")
    public void ice(WebRtcIceMessage request, Principal principal) {
        if (principal == null) return;

        UUID fromUserId = UUID.fromString(principal.getName());

        var payload = Map.of(
                "callId", request.callId().toString(),
                "fromUserId", fromUserId.toString(),
                "candidate", request.candidate(),
                "sdpMid", request.sdpMid(),
                "sdpMLineIndex", request.sdpMLineIndex()
        );

        messagingTemplate.convertAndSendToUser(
                request.toUserId().toString(),
                "/queue/call-ice",
                payload
        );
    }

    @MessageMapping("/call/hangup")
    public void hangup(CallHangupMessage request, Principal principal) {
        if (principal == null) return;

        UUID fromUserId = UUID.fromString(principal.getName());

        var payload = Map.of(
                "callId", request.callId().toString(),
                "fromUserId", fromUserId.toString()
        );

        messagingTemplate.convertAndSendToUser(
                request.toUserId().toString(),
                "/queue/call-hangup",
                payload
        );
    }
}
