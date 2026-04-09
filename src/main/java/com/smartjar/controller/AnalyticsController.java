package com.smartjar.controller;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AnalyticsController {

    @GetMapping("/monthly-spending")
    public Map<String, Object> getMonthlySpending() {
        Map<String, Object> res = new HashMap<>();
        res.put("month", "October");
        res.put("totalSpent", 12000);
        return res;
    }

    @GetMapping("/category-breakdown")
    public Map<String, Integer> getCategoryBreakdown() {
        Map<String, Integer> res = new HashMap<>();
        res.put("food", 4500);
        res.put("shopping", 3000);
        res.put("transport", 1500);
        res.put("bills", 3000);
        return res;
    }

    @GetMapping("/savings-stats")
    public Map<String, Object> getSavingsStats() {
        Map<String, Object> res = new HashMap<>();
        res.put("totalSaved", 1200);
        res.put("growthPercent", 12.5);
        return res;
    }
}
