package com.smartjar.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
@Entity
@Data
public class Upi {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String upiId;
    private UUID userId;
    private String bankName;
}
