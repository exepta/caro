package org.tiltus.authbackend.security;

import jakarta.servlet.http.HttpServletMapping;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SecurityConfigTest {

    @Mock
    private JwtAuthFilter jwtAuthFilter;

    @InjectMocks
    private SecurityConfig securityConfig;

    @Mock
    private HttpSecurity httpSecurity;

    @Test
    void filterChain_configuresHttpSecurityCorrectly() throws Exception {
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).csrf(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).cors(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).sessionManagement(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).authorizeHttpRequests(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.doReturn(httpSecurity).when(httpSecurity).addFilterBefore(org.mockito.Mockito.any(), org.mockito.ArgumentMatchers.eq(UsernamePasswordAuthenticationFilter.class));

        SecurityFilterChain mockChain = org.mockito.Mockito.mock(SecurityFilterChain.class);
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
        String allowedOrigins = "https://example.com";
        CorsConfigurationSource source = securityConfig.cors(allowedOrigins);

        assertNotNull(source);
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);

        lenient().doReturn(null).when(request).getAttribute(org.mockito.ArgumentMatchers.anyString());
        lenient().doReturn("").when(request).getRequestURI();
        lenient().doReturn("").when(request).getContextPath();
        lenient().doReturn("").when(request).getServletPath();
        lenient().doReturn(null).when(request).getPathInfo();

        HttpServletMapping mapping = org.mockito.Mockito.mock(HttpServletMapping.class);
        lenient().doReturn(mapping).when(request).getHttpServletMapping();

        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);
        assertEquals(List.of(allowedOrigins), config.getAllowedOrigins());
        assertEquals(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"), config.getAllowedMethods());
        assertEquals(List.of("*"), config.getAllowedHeaders());
    }
}

