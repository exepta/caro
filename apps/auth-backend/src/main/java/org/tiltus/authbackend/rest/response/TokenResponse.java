package org.tiltus.authbackend.rest.response;

public record TokenResponse(String accessToken, String refreshToken) { }
