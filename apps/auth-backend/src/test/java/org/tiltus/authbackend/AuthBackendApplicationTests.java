package org.tiltus.authbackend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ExtendWith(MockitoExtension.class)
class AuthBackendApplicationTests {

    @Test
    void applicationStartsSuccessfully() {
        assertDoesNotThrow(() -> AuthBackendApplication.main(new String[]{}));
    }

    @Test
    void applicationFailsToStartWithInvalidArgs() {
        String[] invalidArgs = {"--invalid"};
        assertThrows(Exception.class, () -> AuthBackendApplication.main(invalidArgs));
    }
}
