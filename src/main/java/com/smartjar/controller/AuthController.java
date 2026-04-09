package com.smartjar.controller;
import com.smartjar.dto.*;
import com.smartjar.service.AuthService;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth") @CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register") public AuthResponse register(@RequestBody RegisterRequest req) { return authService.register(req); }
    @PostMapping("/login") public AuthResponse login(@RequestBody AuthRequest req) { return authService.login(req); }
    
    @PostMapping("/verify")
    public AuthResponse verifyOtp(@RequestParam String email, @RequestParam String otp) {
        return authService.verifyOtp(email, otp);
    }
    
    @PostMapping("/verify-device")
    public AuthResponse verifyDevice(@RequestParam String email, @RequestParam String deviceId, @RequestParam String otp) {
        return authService.verifyDevice(email, deviceId, otp);
    }
}
