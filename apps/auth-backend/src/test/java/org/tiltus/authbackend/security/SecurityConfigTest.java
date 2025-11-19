package org.tiltus.authbackend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityConfigTest {

    @Mock
    private JwtAuthFilter jwtAuthFilter;

    @InjectMocks
    private SecurityConfig securityConfig;

    @Mock
    private HttpSecurity httpSecurity;


    private final String allowedOrigins = "http://localhost:4200";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins", allowedOrigins);
    }

    @Test
    void filterChain_configuresHttpSecurityCorrectly() throws Exception {
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).csrf(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).cors(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).sessionManagement(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).authorizeHttpRequests(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).addFilterBefore(org.mockito.Mockito.any(), org.mockito.ArgumentMatchers.eq(UsernamePasswordAuthenticationFilter.class));

        SecurityFilterChain mockChain = mock(SecurityFilterChain.class);
        org.mockito.Mockito.doReturn(mockChain).when(httpSecurity).build();

        SecurityFilterChain chain = securityConfig.filterChain(httpSecurity);

        assertNotNull(chain);
        verify(httpSecurity).csrf(any());
        verify(httpSecurity).cors(any());
        verify(httpSecurity).sessionManagement(any());
        verify(httpSecurity).authorizeHttpRequests(any());
        verify(httpSecurity).addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Test
    void passwordEncoder_returnsBCryptPasswordEncoder() {
        PasswordEncoder encoder = securityConfig.passwordEncoder();

        assertNotNull(encoder);
        assertInstanceOf(BCryptPasswordEncoder.class, encoder);
    }

    @Test
    void cors_returnsCorsConfigurationSourceWithAllowedOrigins() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertNotNull(source);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/api/auth/login");

        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config);
        assertEquals(List.of(allowedOrigins), config.getAllowedOrigins());
        assertEquals(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"), config.getAllowedMethods());
        assertEquals(List.of("*"), config.getAllowedHeaders());
    }
}

