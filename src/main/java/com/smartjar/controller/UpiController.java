package com.smartjar.controller;

import com.smartjar.dto.UpiPaymentRequest;
import com.smartjar.entity.Transaction;
import com.smartjar.service.UpiService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upi")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UpiController {

    private final UpiService upiService;

    public UpiController(UpiService upiService) {
        this.upiService = upiService;
    }

    @GetMapping("/verify/{upiId}")
    public Map<String, Object> verifyUpi(@PathVariable String upiId) {
        return upiService.verifyUpi(upiId);
    }

    @PostMapping("/p2p/send")
    public Map<String, String> sendMoney(@RequestBody UpiPaymentRequest request) {
        return upiService.processPayment(request);
    }

    @GetMapping("/history/{userId}")
    public List<Transaction> getHistory(@PathVariable UUID userId) {
        return upiService.getHistory(userId);
    }
}
