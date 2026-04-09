package com.smartjar.service;

import com.smartjar.entity.User;
import com.smartjar.entity.UserSecurity;
import com.smartjar.repository.UserRepository;
import com.smartjar.repository.UserSecurityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SecurityOperationService Tests")
class SecurityOperationServiceTest {

    @Mock private UserSecurityRepository secRepo;
    @Mock private UserRepository userRepo;
    @Mock private EmailService emailService;

    // Use a real encoder — this tests actual hash comparison
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private SecurityOperationService service;

    @BeforeEach
    void setUp() {
        service = new SecurityOperationService(secRepo, userRepo, encoder, emailService);
    }

    // ─── MPIN Setup ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("setupMpin: stores MPIN as BCrypt hash (never plaintext)")
    void setupMpin_storesMpinAsHash() {
        UUID userId = UUID.randomUUID();
        when(secRepo.findByUserId(userId)).thenReturn(Optional.empty());

        service.setupMpin(userId, "123456");

        verify(secRepo).save(argThat(sec ->
                sec.getMpin() != null &&
                !sec.getMpin().equals("123456") &&   // Not plaintext
                sec.getMpin().startsWith("$2a$")      // BCrypt prefix
        ));
    }

    @Test
    @DisplayName("setupMpin: rejects MPIN shorter than 6 digits")
    void setupMpin_invalidMpin_throws() {
        UUID userId = UUID.randomUUID();
        assertThrows(RuntimeException.class, () -> service.setupMpin(userId, "123"));
        assertThrows(RuntimeException.class, () -> service.setupMpin(userId, null));
        assertThrows(RuntimeException.class, () -> service.setupMpin(userId, "12345a")); // non-digits
    }

    @Test
    @DisplayName("setupMpin: prevents duplicate MPIN configuration")
    void setupMpin_whenAlreadyExists_throws() {
        UUID userId = UUID.randomUUID();
        when(secRepo.findByUserId(userId)).thenReturn(Optional.of(new UserSecurity()));
        assertThrows(RuntimeException.class, () -> service.setupMpin(userId, "123456"));
    }

    // ─── Change MPIN ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("changeMpin: succeeds with correct old MPIN (hash comparison)")
    void changeMpin_withCorrectOldMpin_succeeds() {
        UUID userId = UUID.randomUUID();
        String rawOldMpin = "111111";
        String hashedOldMpin = encoder.encode(rawOldMpin);

        UserSecurity sec = new UserSecurity();
        sec.setUserId(userId);
        sec.setMpin(hashedOldMpin);

        when(secRepo.findByUserId(userId)).thenReturn(Optional.of(sec));
        when(userRepo.findById(userId)).thenReturn(Optional.of(new User()));

        Map<String, String> res = service.changeMpin(userId, rawOldMpin, null, "999999");
        assertEquals("SUCCESS", res.get("status"));
        verify(secRepo).save(argThat(s -> !s.getMpin().equals("999999"))); // stored as hash
    }

    @Test
    @DisplayName("changeMpin: succeeds with correct password as alternative")
    void changeMpin_withCorrectPassword_succeeds() {
        UUID userId = UUID.randomUUID();
        String rawPassword = "MyP@ss123";
        String hashedPassword = encoder.encode(rawPassword);

        UserSecurity sec = new UserSecurity();
        sec.setUserId(userId);
        sec.setMpin(encoder.encode("111111"));

        User user = new User();
        user.setPassword(hashedPassword);

        when(secRepo.findByUserId(userId)).thenReturn(Optional.of(sec));
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        Map<String, String> res = service.changeMpin(userId, null, rawPassword, "999999");
        assertEquals("SUCCESS", res.get("status"));
    }

    @Test
    @DisplayName("changeMpin: fails with wrong credentials (no bypass)")
    void changeMpin_withWrongCredentials_throws() {
        UUID userId = UUID.randomUUID();
        UserSecurity sec = new UserSecurity();
        sec.setMpin(encoder.encode("111111"));

        User user = new User();
        user.setPassword(encoder.encode("CorrectPass"));

        when(secRepo.findByUserId(userId)).thenReturn(Optional.of(sec));
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        assertThrows(RuntimeException.class,
                () -> service.changeMpin(userId, "wrong_mpin", "wrong_pass", "999999"));
    }

    // ─── Password Reset ───────────────────────────────────────────────────────

    @Test
    @DisplayName("requestPasswordReset: returns SUCCESS even for unregistered email (anti-enumeration)")
    void requestPasswordReset_unknownEmail_doesNotRevealEmailExists() {
        when(userRepo.findByEmail("ghost@nowhere.com")).thenReturn(Optional.empty());

        Map<String, String> res = service.requestPasswordReset("ghost@nowhere.com");
        // Should not throw; should return SUCCESS without leaking info
        assertEquals("SUCCESS", res.get("status"));
        verify(emailService, never()).sendCode(any(), any());
    }

    @Test
    @DisplayName("requestPasswordReset: sends OTP for registered email")
    void requestPasswordReset_knownEmail_sendsOtp() throws Exception {
        User user = new User();
        when(userRepo.findByEmail("user@smartjar.com")).thenReturn(Optional.of(user));
        doNothing().when(emailService).sendCode(anyString(), anyString());

        Map<String, String> res = service.requestPasswordReset("user@smartjar.com");
        assertEquals("SUCCESS", res.get("status"));
        verify(emailService, times(1)).sendCode(eq("user@smartjar.com"), anyString());
    }

    @Test
    @DisplayName("confirmPasswordReset: fails when no OTP was requested (nothing in vault)")
    void confirmPasswordReset_noOtpRequested_throws() {
        assertThrows(RuntimeException.class,
                () -> service.confirmPasswordReset("nobody@test.com", "123456", "NewPass!"));
    }

    // ─── Change Password ──────────────────────────────────────────────────────

    @Test
    @DisplayName("changePassword: hashes new password before saving")
    void changePassword_savesHashedPassword() {
        UUID userId = UUID.randomUUID();
        String rawOld = "OldPassword1!";
        String hashedOld = encoder.encode(rawOld);

        User user = new User();
        user.setPassword(hashedOld);

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        service.changePassword(userId, rawOld, "NewPassword2!");

        verify(userRepo).save(argThat(u ->
                !u.getPassword().equals("NewPassword2!") &&  // Not plaintext
                u.getPassword().startsWith("$2a$")           // BCrypt
        ));
    }

    @Test
    @DisplayName("changePassword: rejects wrong old password")
    void changePassword_wrongOldPassword_throws() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setPassword(encoder.encode("CorrectOld!"));

        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        assertThrows(RuntimeException.class,
                () -> service.changePassword(userId, "WrongOld!", "NewPass!"));
    }
}
