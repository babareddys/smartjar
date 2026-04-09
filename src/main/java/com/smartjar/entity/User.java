package com.smartjar.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Data
@Table(name="users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String name;
    @Column(unique = true) private String email;
    private String phone;
    private String password;
    private String role = "ROLE_USER";
    private String status = "PENDING";
    private String lastDeviceId;
    private LocalDateTime createdAt;
    @PrePersist public void prePersist() { createdAt = LocalDateTime.now(); }
}
