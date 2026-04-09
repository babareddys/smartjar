package com.smartjar.service;
import com.smartjar.entity.*;
import com.smartjar.repository.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;
@Service
public class TransactionService {
    private final TransactionRepository txRepo;
    private final WalletRepository walletRepo;
    private final SavingsRepository savingsRepo;
    public TransactionService(TransactionRepository t, WalletRepository w, SavingsRepository s) {
        this.txRepo = t; this.walletRepo = w; this.savingsRepo = s;
    }
    public Transaction processPayment(UUID senderId, UUID receiverId, BigDecimal amount) {
        Wallet senderWallet = walletRepo.findByUserId(senderId).orElseThrow();
        if (senderWallet.getBalance().compareTo(amount) < 0) throw new RuntimeException("Insufficient balance");
        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        Wallet receiverWallet = walletRepo.findByUserId(receiverId).orElseThrow();
        receiverWallet.setBalance(receiverWallet.getBalance().add(amount));
        Transaction tx = new Transaction();
        tx.setSenderId(senderId); tx.setReceiverId(receiverId); tx.setAmount(amount);
        tx.setTransactionType("WALLET_TRANSFER"); tx.setStatus("SUCCESS");
        txRepo.save(tx);
        BigDecimal remainder = amount.remainder(BigDecimal.valueOf(100));
        if (remainder.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal roundUpAmount = BigDecimal.valueOf(100).subtract(remainder);
            if (senderWallet.getBalance().compareTo(roundUpAmount) >= 0) {
                senderWallet.setBalance(senderWallet.getBalance().subtract(roundUpAmount));
                Savings s = new Savings();
                s.setUserId(senderId); s.setTransactionId(tx.getId());
                s.setSavedAmount(roundUpAmount); s.setAssetType("GOLD");
                savingsRepo.save(s);
            }
        }
        walletRepo.save(senderWallet); walletRepo.save(receiverWallet);
        return tx;
    }
}
