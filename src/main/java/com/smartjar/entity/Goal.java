package com.smartjar.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Data
public class Goal {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID userId;
    private String goalName;
    private BigDecimal targetAmount;
    private BigDecimal savedAmount = BigDecimal.ZERO;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    @PrePersist public void prePersist() { createdAt = LocalDateTime.now(); }
}
