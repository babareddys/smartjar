package com.smartjar.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Data
@Table(name="recurring_bills")
public class RecurringBill {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    private String billerName;
    private BigDecimal amount;
    
    // "DAILY" or "MONTHLY"
    private String frequency;

    private LocalDate nextRunDate;
    
    private boolean isActive = true;
}
