package org.tiltus.authbackend.services;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setup() throws Exception {
        jwtService = new JwtService();
        setField(jwtService, "secret", "45DE5562ADE578CD47AD886DCD66DC72A9C4AD");
        setField(jwtService, "issuer", "test-issuer");
        setField(jwtService, "accessTtl", 60L);
        setField(jwtService, "refreshTtl", 7L);
    }

    @Test
    void issueAccess_generatesValidToken() {
        String token = jwtService.issueAccess(UUID.randomUUID(), "testUser");
        assertNotNull(token);
        assertDoesNotThrow(() -> jwtService.parse(token));
    }

    @Test
    void issueRefresh_generatesValidToken() {
        String token = jwtService.issueRefresh(UUID.randomUUID());
        assertNotNull(token);
        assertDoesNotThrow(() -> jwtService.parse(token));
    }

    @Test
    void parse_validTokenReturnsClaims() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.issueAccess(userId, "testUser");

        var claims = jwtService.parse(token).getBody();
        assertEquals(userId.toString(), claims.getSubject());
        assertEquals("testUser", claims.get("username"));
        assertEquals("test-issuer", claims.getIssuer());
    }

    @Test
    void parse_invalidTokenThrowsJwtException() {
        assertThrows(JwtException.class, () -> jwtService.parse("invalidToken"));
    }

    @Test
    void parse_expiredTokenThrowsJwtException() throws Exception {
        JwtService expiredJwtService = new JwtService();
        setField(expiredJwtService, "secret", "45DE5562ADE578CD47AD886DCD66DC72A9C4AD");
        setField(expiredJwtService, "issuer", "test-issuer");
        setField(expiredJwtService, "accessTtl", -1L);
        setField(expiredJwtService, "refreshTtl", 7L);

        String expiredToken = expiredJwtService.issueAccess(UUID.randomUUID(), "testUser");
        assertThrows(JwtException.class, () -> jwtService.parse(expiredToken));
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        var field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
