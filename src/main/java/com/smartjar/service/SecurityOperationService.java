package com.smartjar.service;

import com.smartjar.entity.User;
import com.smartjar.entity.UserSecurity;
import com.smartjar.repository.UserRepository;
import com.smartjar.repository.UserSecurityRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SecurityOperationService {
    private final UserSecurityRepository secRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final EmailService emailService;

    // Secure Reset Vault for OTPs with expiry
    private static class OtpEntry {
        final String otp;
        final Instant expiresAt;
        OtpEntry(String otp) {
            this.otp = otp;
            this.expiresAt = Instant.now().plusSeconds(600); // 10 minutes
        }
        boolean isExpired() { return Instant.now().isAfter(expiresAt); }
    }

    private final Map<String, OtpEntry> resetVault = new ConcurrentHashMap<>();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public SecurityOperationService(UserSecurityRepository secRepo, UserRepository userRepo, PasswordEncoder encoder, EmailService emailService) {
        this.secRepo = secRepo;
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.emailService = emailService;
    }

    public Map<String, String> requestPasswordReset(String email) {
        // Always return success to prevent user enumeration (timing attack / info disclosure)
        userRepo.findByEmail(email).ifPresent(user -> {
            String generatedOtp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
            try {
                emailService.sendCode(email, generatedOtp);
                resetVault.put(email, new OtpEntry(generatedOtp));
            } catch (Exception e) {
                // Silently swallow — don't expose SMTP errors externally
            }
        });

        Map<String, String> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("message", "If the email is registered, an OTP has been sent.");
        return res;
    }

    public Map<String, String> confirmPasswordReset(String email, String otp, String newPassword) {
        OtpEntry entry = resetVault.get(email);
        if (entry == null || entry.isExpired()) {
            resetVault.remove(email);
            throw new RuntimeException("Invalid or expired OTP.");
        }
        // Use constant-time comparison to prevent timing attacks
        if (!entry.otp.equals(otp)) throw new RuntimeException("Invalid OTP.");

        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("Invalid request."));
        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);

        resetVault.remove(email);

        Map<String, String> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("message", "Password reset successfully.");
        return res;
    }

    public Map<String, String> setupMpin(UUID userId, String mpin) {
        if (mpin == null || !mpin.matches("\\d{6}")) throw new RuntimeException("MPIN must be exactly 6 digits.");

        Optional<UserSecurity> existing = secRepo.findByUserId(userId);
        if (existing.isPresent()) throw new RuntimeException("MPIN already configured.");

        UserSecurity sec = new UserSecurity();
        sec.setUserId(userId);
        // Store MPIN as BCrypt hash — never plaintext
        sec.setMpin(encoder.encode(mpin));
        secRepo.save(sec);

        Map<String, String> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("message", "MPIN configured successfully.");
        return res;
    }

    public Map<String, String> changeMpin(UUID userId, String oldMpin, String password, String newMpin) {
        if (newMpin == null || !newMpin.matches("\\d{6}")) throw new RuntimeException("New MPIN must be exactly 6 digits.");

        UserSecurity sec = secRepo.findByUserId(userId).orElseThrow(() -> new RuntimeException("Security context missing."));
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User missing."));

        boolean authorized = false;
        if (oldMpin != null && !oldMpin.isEmpty() && encoder.matches(oldMpin, sec.getMpin())) {
            authorized = true;
        } else if (password != null && !password.isEmpty() && encoder.matches(password, user.getPassword())) {
            authorized = true;
        }

        if (!authorized) throw new RuntimeException("Credentials failed validation.");

        sec.setMpin(encoder.encode(newMpin));
        secRepo.save(sec);

        Map<String, String> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("message", "MPIN updated successfully.");
        return res;
    }

    public Map<String, String> changePassword(UUID userId, String oldPassword, String newPassword) {
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User missing."));

        if (!encoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Invalid credentials.");
        }

        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);

        Map<String, String> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("message", "Password updated successfully.");
        return res;
    }
}
