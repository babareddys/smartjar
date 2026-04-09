package com.smartjar.controller;
import com.smartjar.dto.WalletResponse;
import com.smartjar.service.WalletService;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;
@RestController @RequestMapping("/api/wallet") @CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class WalletController {
    private final WalletService walletService;
    public WalletController(WalletService walletService) { this.walletService = walletService; }

    @GetMapping("/{userId}") public WalletResponse getWallet(@PathVariable UUID userId) {
        return new WalletResponse(walletService.getWallet(userId));
    }
    @PostMapping("/{userId}/add") public WalletResponse addMoney(@PathVariable UUID userId, @RequestParam BigDecimal amount) {
        return new WalletResponse(walletService.addMoney(userId, amount));
    }
}
