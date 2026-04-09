package com.smartjar.controller;
import com.smartjar.entity.Transaction;
import com.smartjar.service.TransactionService;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;
@RestController @RequestMapping("/api/upi") @CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TransactionController {
    private final TransactionService txService;
    public TransactionController(TransactionService txService) { this.txService = txService; }
    @PostMapping("/send") public Transaction send(@RequestParam UUID senderId, @RequestParam UUID receiverId, @RequestParam BigDecimal amount) {
        return txService.processPayment(senderId, receiverId, amount);
    }
}
