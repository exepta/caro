package org.tiltus.authbackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.tiltus.authbackend.model.CaroUser;
import org.tiltus.authbackend.repositories.CaroUserRepository;
import org.tiltus.authbackend.services.JwtService;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CaroUserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String headRequest = Optional.ofNullable(request.getHeader("Authorization")).orElse("");
        if (headRequest.startsWith("Bearer ")) {
            String token = headRequest.substring(7);
            try {
                Jws<Claims> claims = jwtService.parse(token);
                UUID userId = UUID.fromString(claims.getBody().getSubject());
                CaroUser user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            user.getId().toString(), null, List.of()
                    );
                    auth.setDetails(user);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException ignored) { }
        }

        filterChain.doFilter(request, response);
    }
}
