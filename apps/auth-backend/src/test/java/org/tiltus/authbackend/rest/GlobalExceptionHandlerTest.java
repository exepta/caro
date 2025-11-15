package org.tiltus.authbackend.rest;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.tiltus.authbackend.rest.response.ErrorResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private GlobalExceptionHandler handler;

    @Test
    void handleResponseStatus_returnsErrorResponseWithCorrectDetails() {
        when(request.getRequestURI()).thenReturn("/test-uri");
        ResponseStatusException exception = new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid input");

        ResponseEntity<ErrorResponse> response = handler.handleResponseStatus(exception, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("bad_request", response.getBody().code());
        assertEquals("Invalid input", response.getBody().message());
        assertEquals("/test-uri", response.getBody().path());
    }

    @Test
    void handleResponseStatus_returnsDefaultCodeForUnhandledStatus() {
        when(request.getRequestURI()).thenReturn("/test-uri");
        ResponseStatusException exception = new ResponseStatusException(HttpStatus.I_AM_A_TEAPOT, "Teapot error");

        ResponseEntity<ErrorResponse> response = handler.handleResponseStatus(exception, request);

        assertEquals(HttpStatus.I_AM_A_TEAPOT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("error", response.getBody().code());
        assertEquals("Teapot error", response.getBody().message());
        assertEquals("/test-uri", response.getBody().path());
    }

    @Test
    void handleOther_returnsInternalServerErrorWithCorrectDetails() {
        when(request.getRequestURI()).thenReturn("/test-uri");
        Exception exception = new Exception("Unexpected failure");

        ResponseEntity<ErrorResponse> response = handler.handleOther(exception, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("internal_server_error", response.getBody().code());
        assertEquals("Unexpected failure", response.getBody().message());
        assertEquals("/test-uri", response.getBody().path());
    }

    @Test
    void handleOther_returnsGenericMessageWhenExceptionMessageIsNull() {
        when(request.getRequestURI()).thenReturn("/test-uri");
        Exception exception = new Exception();

        ResponseEntity<ErrorResponse> response = handler.handleOther(exception, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("internal_server_error", response.getBody().code());
        assertEquals("Unexpected error", response.getBody().message());
        assertEquals("/test-uri", response.getBody().path());
    }
}

