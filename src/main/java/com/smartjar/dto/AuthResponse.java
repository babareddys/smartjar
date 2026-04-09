package com.smartjar.dto;
import lombok.Data;
@Data public class AuthResponse {
    private String token;
    private com.smartjar.entity.User user;
    private boolean requiresDeviceVerification;
    public AuthResponse(String token, com.smartjar.entity.User user) { this.token = token; this.user = user; }
    public AuthResponse(String token, com.smartjar.entity.User user, boolean requiresDeviceVerification) { this.token = token; this.user = user; this.requiresDeviceVerification = requiresDeviceVerification; }
    public AuthResponse() {}
}
