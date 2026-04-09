package com.smartjar.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Data
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID senderId;
    private UUID receiverId;
    private BigDecimal amount;
    private String transactionType; // UPI_TRANSFER, WALLET_TOPUP, SAVINGS_TRANSFER
    private String status; // SUCCESS, FAILED
    private LocalDateTime createdAt;
    @PrePersist public void prePersist() { createdAt = LocalDateTime.now(); }
}
