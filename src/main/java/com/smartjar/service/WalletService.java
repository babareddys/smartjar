package com.smartjar.service;
import com.smartjar.entity.Wallet;
import com.smartjar.repository.WalletRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;
@Service
public class WalletService {
    private final WalletRepository walletRepo;
    public WalletService(WalletRepository walletRepo) { this.walletRepo = walletRepo; }
    public Wallet getWallet(UUID userId) { return walletRepo.findByUserId(userId).orElseThrow(); }
    public Wallet addMoney(UUID userId, BigDecimal amount) {
        Wallet w = getWallet(userId);
        w.setBalance(w.getBalance().add(amount));
        return walletRepo.save(w);
    }
}
