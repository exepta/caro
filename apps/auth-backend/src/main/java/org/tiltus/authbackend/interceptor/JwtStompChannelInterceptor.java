package org.tiltus.authbackend.interceptor;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.tiltus.authbackend.services.JwtService;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtStompChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = firstNativeHeader(accessor);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                try {
                    if (jwtService.isAccessToken(token)) {
                        UUID userId = jwtService.extractUserId(token);

                        Authentication authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userId.toString(),
                                        null,
                                        List.of()
                                );

                        accessor.setUser(authentication);
                    } else {
                        System.out.println("Rejecting WebSocket CONNECT: refresh token");
                        return null;
                    }
                } catch (Exception ex) {
                    System.out.println("Invalid JWT on STOMP CONNECT: " + ex.getMessage());
                    return null;
                }
            } else {
                System.out.println("Missing or invalid Authorization header on STOMP CONNECT");
                return null;
            }
        }

        return message;
    }

    private String firstNativeHeader(StompHeaderAccessor accessor) {
        List<String> values = accessor.getNativeHeader("Authorization");
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.getFirst();
    }
}