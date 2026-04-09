package com.smartjar.controller;

import com.smartjar.service.SecurityOperationService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/security")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class SecurityController {

    private final SecurityOperationService secService;

    public SecurityController(SecurityOperationService secService) {
        this.secService = secService;
    }

    @PostMapping("/setup-mpin")
    public Map<String, String> setupMpin(@RequestBody Map<String, String> payload) {
        return secService.setupMpin(UUID.fromString(payload.get("userId")), payload.get("mpin"));
    }

    @PostMapping("/change-mpin")
    public Map<String, String> changeMpin(@RequestBody Map<String, String> payload) {
        return secService.changeMpin(
            UUID.fromString(payload.get("userId")), 
            payload.get("oldMpin"), 
            payload.get("password"), 
            payload.get("newMpin")
        );
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(@RequestBody Map<String, String> payload) {
        return secService.changePassword(
            UUID.fromString(payload.get("userId")), 
            payload.get("oldPassword"), 
            payload.get("newPassword")
        );
    }

    @PostMapping("/request-reset")
    public Map<String, String> requestReset(@RequestBody Map<String, String> payload) {
        return secService.requestPasswordReset(payload.get("email"));
    }

    @PostMapping("/confirm-reset")
    public Map<String, String> confirmReset(@RequestBody Map<String, String> payload) {
        return secService.confirmPasswordReset(
            payload.get("email"), 
            payload.get("otp"), 
            payload.get("newPassword")
        );
    }
}
