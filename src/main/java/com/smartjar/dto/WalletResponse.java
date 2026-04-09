package com.smartjar.dto;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;
@Data public class WalletResponse {
    private UUID id;
    private UUID userId;
    private BigDecimal balance;
    public WalletResponse(com.smartjar.entity.Wallet wallet) {
        this.id = wallet.getId();
        this.userId = wallet.getUserId();
        this.balance = wallet.getBalance();
    }
}
