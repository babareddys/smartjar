package com.smartjar.service;

import com.smartjar.dto.AuthRequest;
import com.smartjar.dto.AuthResponse;
import com.smartjar.dto.RegisterRequest;
import com.smartjar.entity.User;
import com.smartjar.repository.*;
import com.smartjar.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    @Mock private UserRepository userRepo;
    @Mock private WalletRepository walletRepo;
    @Mock private UpiRepository upiRepo;
    @Mock private EmailService emailService;
    @Mock private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepo, walletRepo, upiRepo, passwordEncoder, jwtUtil, emailService);
    }

    // ─── Registration ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("register: sends OTP and returns AWAITING_VERIFICATION for new email")
    void register_newEmail_returnsAwaitingVerification() throws Exception {
        when(userRepo.findByEmail("new@test.com")).thenReturn(Optional.empty());
        doNothing().when(emailService).sendCode(anyString(), anyString());

        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@test.com");
        req.setName("Test User");
        req.setPassword("SecureP@ss1!");
        req.setPhone("9999999999");

        AuthResponse res = authService.register(req);
        assertEquals("AWAITING_VERIFICATION", res.getToken());
        verify(emailService).sendCode(eq("new@test.com"), anyString());
    }

    @Test
    @DisplayName("register: throws when email already exists")
    void register_duplicateEmail_throws() {
        when(userRepo.findByEmail("exists@test.com")).thenReturn(Optional.of(new User()));

        RegisterRequest req = new RegisterRequest();
        req.setEmail("exists@test.com");
        req.setPassword("pass");

        assertThrows(RuntimeException.class, () -> authService.register(req));
    }

    // ─── OTP Verification ────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyOtp: fails when no pending registration exists")
    void verifyOtp_noPending_throws() {
        assertThrows(RuntimeException.class, () -> authService.verifyOtp("ghost@test.com", "123456"));
    }

    @Test
    @DisplayName("verifyOtp: fails with wrong OTP, succeeds with correct OTP")
    void verifyOtp_correctFlow() throws Exception {
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.empty());
        doNothing().when(emailService).sendCode(anyString(), anyString());

        RegisterRequest req = new RegisterRequest();
        req.setEmail("user@test.com");
        req.setName("Test");
        req.setPassword("P@ss1!");
        req.setPhone("9000000000");

        // Register first to put in OTP vault
        authService.register(req);

        // Wrong OTP should fail
        assertThrows(RuntimeException.class, () -> authService.verifyOtp("user@test.com", "000000"));
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: returns JWT for correct credentials")
    void login_correctCredentials_returnsToken() {
        String rawPassword = "MyPassword1!";
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@test.com");
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole("ROLE_USER");

        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("mock.jwt.token");

        AuthRequest req = new AuthRequest();
        req.setEmail("user@test.com");
        req.setPassword(rawPassword);

        AuthResponse res = authService.login(req);
        assertNotNull(res.getToken());
        assertEquals("mock.jwt.token", res.getToken());
    }

    @Test
    @DisplayName("login: throws for wrong password")
    void login_wrongPassword_throws() {
        User user = new User();
        user.setPassword(passwordEncoder.encode("CorrectPassword1!"));
        user.setEmail("user@test.com");

        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        AuthRequest req = new AuthRequest();
        req.setEmail("user@test.com");
        req.setPassword("WrongPassword!");

        assertThrows(RuntimeException.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("login: throws for non-existent user")
    void login_nonExistentUser_throws() {
        when(userRepo.findByEmail(anyString())).thenReturn(Optional.empty());

        AuthRequest req = new AuthRequest();
        req.setEmail("nobody@test.com");
        req.setPassword("irrelevant");

        assertThrows(RuntimeException.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("login: triggers device verification for new device")
    void login_newDevice_returnsDeviceVerificationFlag() throws Exception {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@test.com");
        user.setPassword(passwordEncoder.encode("Pass1!"));
        user.setRole("ROLE_USER");
        user.setLastDeviceId("device-aaa");

        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        doNothing().when(emailService).sendCode(anyString(), anyString());

        AuthRequest req = new AuthRequest();
        req.setEmail("user@test.com");
        req.setPassword("Pass1!");
        req.setDeviceId("device-new-unknown");

        AuthResponse res = authService.login(req);
        // Should require device verification, no JWT issued
        assertNull(res.getToken());
        assertTrue(res.isRequiresDeviceVerification());
    }
}
