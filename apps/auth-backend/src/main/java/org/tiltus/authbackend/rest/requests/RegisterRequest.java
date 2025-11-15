package org.tiltus.authbackend.rest.requests;

public record RegisterRequest(String email, String username, String password) { }
