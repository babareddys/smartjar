package com.smartjar.controller;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BillsController {

    private final com.smartjar.repository.WalletRepository walletRepo;
    private final com.smartjar.repository.RecurringBillRepository recurringRepo;
    private final com.smartjar.repository.UserSecurityRepository secRepo;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.smartjar.repository.TransactionRepository txRepo;
    private final com.smartjar.repository.SavingsRepository savingsRepo;
    private final com.smartjar.repository.GoldHoldingRepository goldRepo;

    public BillsController(com.smartjar.repository.WalletRepository walletRepo, 
                           com.smartjar.repository.RecurringBillRepository recurringRepo, 
                           com.smartjar.repository.UserSecurityRepository secRepo, 
                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                           com.smartjar.repository.TransactionRepository txRepo,
                           com.smartjar.repository.SavingsRepository savingsRepo,
                           com.smartjar.repository.GoldHoldingRepository goldRepo) {
        this.walletRepo = walletRepo;
        this.recurringRepo = recurringRepo;
        this.secRepo = secRepo;
        this.passwordEncoder = passwordEncoder;
        this.txRepo = txRepo;
        this.savingsRepo = savingsRepo;
        this.goldRepo = goldRepo;
    }

    @PostMapping("/pay")
    public Map<String, String> payBill(@RequestBody Map<String, Object> req) {
        java.util.UUID userId = java.util.UUID.fromString((String) req.get("userId"));
        java.math.BigDecimal amount = new java.math.BigDecimal(req.get("amount").toString());
        String mpin = (String) req.get("mpin");
        String billerName = (String) req.get("billerName");
        String frequency = (String) req.get("frequency");
        boolean applyRoundUp = req.get("applyRoundUp") != null && (Boolean) req.get("applyRoundUp");
        boolean applyFivePercent = req.get("applyFivePercent") != null && (Boolean) req.get("applyFivePercent");

        if (mpin == null || mpin.length() != 6) throw new RuntimeException("Security Protocol Drop: MPIN invalid.");
        
        com.smartjar.entity.UserSecurity sec = secRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("MPIN Security Vault Missing."));
        if (!passwordEncoder.matches(mpin, sec.getMpin())) {
            throw new RuntimeException("Cryptographic Error: Invalid 6-Digit MPIN.");
        }

        com.smartjar.entity.Wallet wallet = walletRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient funds for this bill.");
        }

        // Deduct Native
        wallet.setBalance(wallet.getBalance().subtract(amount));

        // Create formal Transaction record
        com.smartjar.entity.Transaction tx = new com.smartjar.entity.Transaction();
        tx.setSenderId(userId);
        tx.setReceiverId(userId);
        tx.setAmount(amount);
        tx.setTransactionType("BILL_PAYMENT_" + billerName.toUpperCase().replace(" ", ""));
        tx.setStatus("SUCCESS");
        txRepo.save(tx);

        java.math.BigDecimal totalSavingsToExecute = java.math.BigDecimal.ZERO;

        // Smart Dynamic Tiered Auto-Savings Execution Protocol
        if (applyRoundUp || applyFivePercent) {
            double amt = amount.doubleValue();
            if (amt <= 100) {
                double remainder = amt % 10;
                double save = (remainder == 0) ? 10 : (10 - remainder);
                totalSavingsToExecute = java.math.BigDecimal.valueOf(save);
            } else if (amt <= 1000) {
                double remainder = amt % 50;
                double save = (remainder == 0) ? 50 : (50 - remainder);
                totalSavingsToExecute = java.math.BigDecimal.valueOf(save);
            } else {
                double save = Math.floor(amt * 0.05);
                totalSavingsToExecute = java.math.BigDecimal.valueOf(save);
            }
        }

        if (totalSavingsToExecute.compareTo(java.math.BigDecimal.ZERO) > 0 && wallet.getBalance().compareTo(totalSavingsToExecute) >= 0) {
            wallet.setBalance(wallet.getBalance().subtract(totalSavingsToExecute));
            
            com.smartjar.entity.Savings savings = new com.smartjar.entity.Savings();
            savings.setUserId(userId);
            savings.setTransactionId(tx.getId());
            savings.setSavedAmount(totalSavingsToExecute);
            savings.setAssetType("GOLD");
            savingsRepo.save(savings);

            java.math.BigDecimal livePrice = java.math.BigDecimal.valueOf(15329.00);
            java.math.BigDecimal grams = totalSavingsToExecute.divide(livePrice, 5, java.math.RoundingMode.HALF_UP);

            com.smartjar.entity.GoldHolding holding = new com.smartjar.entity.GoldHolding();
            holding.setUserId(userId);
            holding.setPurchasePrice(totalSavingsToExecute);
            holding.setGrams(grams);
            goldRepo.save(holding);
        }

        walletRepo.save(wallet);

        if (frequency != null && !frequency.isEmpty() && !frequency.equals("ONCE")) {
            com.smartjar.entity.RecurringBill recur = new com.smartjar.entity.RecurringBill();
            recur.setUserId(userId);
            recur.setBillerName(billerName);
            recur.setAmount(amount);
            recur.setFrequency(frequency);
            if (frequency.equals("DAILY")) {
                recur.setNextRunDate(java.time.LocalDate.now().plusDays(1));
            } else if (frequency.equals("MONTHLY")) {
                recur.setNextRunDate(java.time.LocalDate.now().plusMonths(1));
            }
            recurringRepo.save(recur);
        }

        Map<String, String> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("message", "Payment of ₹" + amount + " to " + billerName + " successful!");
        res.put("savingsApplied", totalSavingsToExecute.toString());
        return res;
    }
}
