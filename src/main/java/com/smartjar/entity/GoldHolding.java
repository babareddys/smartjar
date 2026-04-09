package com.smartjar.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Data
public class GoldHolding {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID userId;
    @Column(precision = 19, scale = 5)
    private BigDecimal grams;
    
    @Column(precision = 19, scale = 2)
    private BigDecimal purchasePrice;
    private LocalDateTime createdAt;
    @PrePersist public void prePersist() { createdAt = LocalDateTime.now(); }
}
