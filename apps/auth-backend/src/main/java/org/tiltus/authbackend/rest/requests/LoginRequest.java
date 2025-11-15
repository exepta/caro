package org.tiltus.authbackend.rest.requests;

public record LoginRequest(String emailOrUsername, String password) { }
