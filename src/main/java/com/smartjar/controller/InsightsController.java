package com.smartjar.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/insights")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class InsightsController {

    @GetMapping
    public List<String> getInsights() {
        return Arrays.asList(
            "You spent ₹12,000 this month.",
            "You saved ₹1,200 automatically via round-ups.",
            "You are 25% closer to your Laptop goal."
        );
    }
}
