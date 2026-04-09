package com.smartjar.scheduler;

import com.smartjar.entity.RecurringBill;
import com.smartjar.entity.Transaction;
import com.smartjar.entity.Wallet;
import com.smartjar.repository.RecurringBillRepository;
import com.smartjar.repository.TransactionRepository;
import com.smartjar.repository.WalletRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BillingSchedulerService {

    private final RecurringBillRepository billRepo;
    private final WalletRepository walletRepo;
    private final TransactionRepository txRepo;

    public BillingSchedulerService(RecurringBillRepository billRepo, WalletRepository walletRepo, TransactionRepository txRepo) {
        this.billRepo = billRepo;
        this.walletRepo = walletRepo;
        this.txRepo = txRepo;
    }

    // Cron job runs securely autonomous every day at 2:00 AM server time
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void processAutonomousSubscriptions() {
        LocalDate today = LocalDate.now();
        List<RecurringBill> dueBills = billRepo.findByIsActiveTrueAndNextRunDateLessThanEqual(today);

        for (RecurringBill bill : dueBills) {
            Wallet wallet = walletRepo.findByUserId(bill.getUserId()).orElse(null);

            if (wallet != null && wallet.getBalance().compareTo(bill.getAmount()) >= 0) {
                // Drop funds safely
                wallet.setBalance(wallet.getBalance().subtract(bill.getAmount()));
                walletRepo.save(wallet);

                Transaction tx = new Transaction();
                tx.setSenderId(bill.getUserId());
                tx.setAmount(bill.getAmount());
                tx.setTransactionType("AUTONOMOUS_BILL_" + bill.getBillerName().toUpperCase().replaceAll(" ", "_"));
                tx.setStatus("SUCCESS");
                txRepo.save(tx);

                // Increment future cycle based on explicitly configured frequency logic
                if ("DAILY".equalsIgnoreCase(bill.getFrequency())) {
                    bill.setNextRunDate(today.plusDays(1));
                } else if ("MONTHLY".equalsIgnoreCase(bill.getFrequency())) {
                    bill.setNextRunDate(today.plusMonths(1));
                }
                billRepo.save(bill);
            } else {
                // If the wallet balance crashes, we mark the transaction sequence as failed and push it back 1 day to retry
                bill.setNextRunDate(today.plusDays(1));
                billRepo.save(bill);
            }
        }
    }
}
