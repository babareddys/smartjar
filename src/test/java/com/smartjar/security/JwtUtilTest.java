package com.smartjar.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JwtUtil Security Tests")
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private static final String VALID_SECRET = "MyVeryLongAndSecureJwtSecretKeyForJarAppThatIsAtLeast256BitsLong!";
    private static final UUID TEST_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", VALID_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 86400000L);
    }

    @Test
    @DisplayName("Token generation produces a non-null, non-empty JWT")
    void generateToken_returnsValidToken() {
        String token = jwtUtil.generateToken("user@example.com", TEST_USER_ID, "ROLE_USER");
        assertNotNull(token);
        assertFalse(token.isBlank());
        // JWT has 3 parts separated by dots
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    @DisplayName("Generated token passes validation")
    void validateToken_validToken_returnsTrue() {
        String token = jwtUtil.generateToken("user@example.com", TEST_USER_ID, "ROLE_USER");
        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    @DisplayName("Tampered token fails validation")
    void validateToken_tamperedToken_returnsFalse() {
        String token = jwtUtil.generateToken("user@example.com", TEST_USER_ID, "ROLE_USER");
        // Corrupt the signature part
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";
        assertFalse(jwtUtil.validateToken(tampered));
    }

    @Test
    @DisplayName("Random garbage string fails validation")
    void validateToken_randomString_returnsFalse() {
        assertFalse(jwtUtil.validateToken("not.a.jwt"));
        assertFalse(jwtUtil.validateToken(""));
        assertFalse(jwtUtil.validateToken("eyJhbGciOiJIUzI1NiJ9.garbage.signature"));
    }

    @Test
    @DisplayName("Email is correctly extracted from a valid token")
    void extractEmail_returnsCorrectEmail() {
        String email = "test@smartjar.com";
        String token = jwtUtil.generateToken(email, TEST_USER_ID, "ROLE_USER");
        assertEquals(email, jwtUtil.extractEmail(token));
    }

    @Test
    @DisplayName("Short JWT secret (< 256 bits) throws IllegalStateException")
    void getSigningKey_shortSecret_throwsException() {
        JwtUtil weakJwt = new JwtUtil();
        ReflectionTestUtils.setField(weakJwt, "secret", "tooshort");
        ReflectionTestUtils.setField(weakJwt, "expirationMs", 86400000L);
        assertThrows(IllegalStateException.class,
                () -> weakJwt.generateToken("user@example.com", UUID.randomUUID(), "ROLE_USER"),
                "Should reject secrets shorter than 256 bits");
    }

    @Test
    @DisplayName("Token signed with a different secret fails validation")
    void validateToken_differentSecret_returnsFalse() {
        String token = jwtUtil.generateToken("user@example.com", TEST_USER_ID, "ROLE_USER");

        JwtUtil otherJwt = new JwtUtil();
        ReflectionTestUtils.setField(otherJwt, "secret", "ACompletelyDifferentSecretKeyThatIsAlsoLongEnough12345!");
        ReflectionTestUtils.setField(otherJwt, "expirationMs", 86400000L);

        assertFalse(otherJwt.validateToken(token));
    }
}
