package org.tiltus.authbackend.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.issuer}") private String issuer;
    @Value("${jwt.access-ttl-minutes}") private long accessTtl;
    @Value("${jwt.refresh-ttl-days}") private long refreshTtl;

    private Key key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issueAccess(UUID userId, String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(userId.toString())
                .claim("username", username)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(Duration.ofMinutes(accessTtl))))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String issueRefresh(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(userId.toString())
                .claim("typ", "refresh")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(Duration.ofDays(refreshTtl))))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token);
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parse(token).getBody().getSubject());
    }

    public boolean isRefreshToken(String token) {
        Claims claims = parse(token).getBody();
        String typ = claims.get("typ", String.class);
        return "refresh".equals(typ);
    }

    public boolean isAccessToken(String token) {
        return !isRefreshToken(token);
    }
}
