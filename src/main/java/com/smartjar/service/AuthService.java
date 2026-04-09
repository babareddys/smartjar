package com.smartjar.service;

import com.smartjar.dto.*;
import com.smartjar.entity.*;
import com.smartjar.repository.*;
import com.smartjar.security.JwtUtil;
// import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class AuthService {
    private final UserRepository userRepo;
    private final WalletRepository walletRepo;
    private final UpiRepository upiRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    // Ephemeral Identity RAM Vault
    private final Map<String, PendingRegistration> otpVault = new ConcurrentHashMap<>();
    private static final long OTP_EXPIRY_MS = 10 * 60 * 1000L; // 10 minutes
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static class PendingRegistration {
        RegisterRequest req;
        String otp;
        Instant expiresAt;
        PendingRegistration(RegisterRequest req, String otp) {
            this.req = req;
            this.otp = otp;
            this.expiresAt = Instant.now().plusMillis(OTP_EXPIRY_MS);
        }
        boolean isExpired() { return Instant.now().isAfter(expiresAt); }
    }

    public AuthService(UserRepository userRepo, WalletRepository walletRepo, UpiRepository upiRepo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, EmailService emailService) {
        this.userRepo = userRepo;
        this.walletRepo = walletRepo;
        this.upiRepo = upiRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.findByEmail(req.getEmail()).isPresent()) throw new RuntimeException("Email already exists in Database");

        String generatedOtp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        
        try {
            emailService.sendCode(req.getEmail(), generatedOtp);
            // Save registration temporarily into RAM ONLY after guaranteed SMTP success
            otpVault.put(req.getEmail(), new PendingRegistration(req, generatedOtp));
        } catch (Exception e) {
            System.err.println("SMTP Email Execution Failed: " + e.getMessage());
            throw new RuntimeException("SMTP Block: " + e.getMessage());
        }

        return new AuthResponse("AWAITING_VERIFICATION", null);
    }

    @Transactional
    public AuthResponse verifyOtp(String email, String otp) {
        PendingRegistration pending = otpVault.get(email);
        if (pending == null || pending.isExpired()) {
            otpVault.remove(email);
            throw new RuntimeException("No pending registration found or OTP expired. Please register again.");
        }
        if (!pending.otp.equals(otp)) throw new RuntimeException("Invalid OTP Code");

        // Native Injection Execution (After Verification Confirmed)
        RegisterRequest req = pending.req;
        
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user = userRepo.save(user);

        Wallet wallet = new Wallet();
        wallet.setUserId(user.getId());
        walletRepo.save(wallet);

        String username = req.getEmail().split("@")[0].toLowerCase().replaceAll("[^a-z0-9]", "");
        String upiId = username + "@jar";
        
        Upi upi = new Upi();
        upi.setUpiId(upiId);
        upi.setUserId(user.getId());
        upi.setBankName("SmartJar Bank");
        upiRepo.save(upi);

        // Terminate RAM Trace
        otpVault.remove(email);

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole());
        return new AuthResponse(token, user);
    }

    public AuthResponse login(AuthRequest req) {
        User user = userRepo.findByEmail(req.getEmail()).orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Machine Fingerprint Guard
        if (req.getDeviceId() != null) {
            String registeredDevice = user.getLastDeviceId();
            if (registeredDevice == null) {
                user.setLastDeviceId(req.getDeviceId());
                userRepo.save(user);
            } else if (!registeredDevice.equals(req.getDeviceId())) {
                String generatedOtp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
                try {
                    emailService.sendCode(user.getEmail(), generatedOtp);
                    otpVault.put(user.getEmail() + "_DEVICE_" + req.getDeviceId(), new PendingRegistration(null, generatedOtp));
                } catch (Exception e) {
                    // Log but don't expose SMTP failure details to caller
                    System.err.println("Device verification email failed: " + e.getMessage());
                }
                
                // Return explicitly mapped device Verification lock, stripping JWT
                return new AuthResponse(null, user, true);
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole());
        return new AuthResponse(token, user, false);
    }

    @Transactional
    public AuthResponse verifyDevice(String email, String deviceId, String otp) {
        String vaultKey = email + "_DEVICE_" + deviceId;
        PendingRegistration pending = otpVault.get(vaultKey);
        if (pending == null || pending.isExpired()) {
            otpVault.remove(vaultKey);
            throw new RuntimeException("No hardware confirmation sequence found or it has expired.");
        }
        if (!pending.otp.equals(otp)) throw new RuntimeException("Cryptographic Error: Invalid Device OTP Code");

        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        user.setLastDeviceId(deviceId); // Rebind to the newest verified Device ID
        userRepo.save(user);

        otpVault.remove(vaultKey);

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole());
        return new AuthResponse(token, user, false);
    }
}
