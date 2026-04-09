package com.smartjar.controller;

import com.smartjar.entity.Savings;
import com.smartjar.repository.SavingsRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/savings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class SavingsController {
    
    private final SavingsRepository savingsRepo;

    public SavingsController(SavingsRepository savingsRepo) {
        this.savingsRepo = savingsRepo;
    }

    @GetMapping("/total/{userId}")
    public Map<String, Object> getTotalSavings(@PathVariable UUID userId) {
        BigDecimal total = savingsRepo.findAll().stream()
                .filter(s -> s.getUserId().equals(userId))
                .map(Savings::getSavedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> res = new HashMap<>();
        res.put("total", total);
        return res;
    }

    @PostMapping("/prefs/{userId}")
    public Map<String, String> updatePrefs(@PathVariable UUID userId, @RequestBody Map<String, Boolean> prefs) {
        // Here you would optimally save this to a UserSettings DB table.
        // For local simulation, we return success so the UI reacts correctly.
        Map<String, String> res = new HashMap<>();
        res.put("status", "SUCCESS");
        return res;
    }
}
