package com.smartjar.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Data
public class Wallet {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID userId;
    private BigDecimal balance = BigDecimal.ZERO;
    private LocalDateTime createdAt;
    @PrePersist public void prePersist() { createdAt = LocalDateTime.now(); }
}
