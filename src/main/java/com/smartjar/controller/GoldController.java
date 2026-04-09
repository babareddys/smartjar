package com.smartjar.controller;

import com.smartjar.entity.GoldHolding;
import com.smartjar.entity.Wallet;
import com.smartjar.repository.GoldHoldingRepository;
import com.smartjar.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/gold")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class GoldController {

    @Value("${gold.api.key:demo_api_key}")
    private String goldApiKey;

    @Value("${gold.api.url:https://api.metalpriceapi.com/v1/latest}")
    private String goldApiBaseUrl;

    private final WalletRepository walletRepo;
    private final GoldHoldingRepository goldRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    public GoldController(WalletRepository walletRepo, GoldHoldingRepository goldRepo) {
        this.walletRepo = walletRepo;
        this.goldRepo = goldRepo;
    }

    private BigDecimal fetchLiveGoldPrice() {
        try {
            String url = goldApiBaseUrl + "?api_key=" + goldApiKey + "&base=USD&currencies=XAU,INR";
            String jsonResponse = restTemplate.getForObject(url, String.class);
            org.json.JSONObject obj = new org.json.JSONObject(jsonResponse);
            org.json.JSONObject rates = obj.getJSONObject("rates");
            
            double inr = rates.getDouble("INR");
            double xau = rates.getDouble("XAU");
            
            double pricePerOunceInr = inr / xau;
            double pricePerGram = pricePerOunceInr / 31.1034768; // Troy Ounce to Grams converter
            
            return BigDecimal.valueOf(pricePerGram).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            // Fallback securely if rate limiting strikes
            return BigDecimal.valueOf(15329.00);
        }
    }

    @GetMapping("/price")
    public Map<String, Object> getLivePrice() {
        Map<String, Object> res = new HashMap<>();
        res.put("pricePerGram", fetchLiveGoldPrice()); 
        res.put("currency", "INR");
        return res;
    }

    @PostMapping("/buy")
    public Map<String, Object> buyGold(@RequestBody Map<String, Object> req) {
        UUID userId = UUID.fromString((String) req.get("userId"));
        BigDecimal amountInr = new BigDecimal(req.get("amount").toString());

        Wallet wallet = walletRepo.findByUserId(userId).orElseThrow(() -> new RuntimeException("Wallet empty"));

        if (wallet.getBalance().compareTo(amountInr) < 0) {
            throw new RuntimeException("Insufficient wallet balance for gold purchase.");
        }

        BigDecimal livePrice = fetchLiveGoldPrice();
        BigDecimal grams = amountInr.divide(livePrice, 4, RoundingMode.HALF_UP);

        wallet.setBalance(wallet.getBalance().subtract(amountInr));
        walletRepo.save(wallet);

        GoldHolding holding = new GoldHolding();
        holding.setUserId(userId);
        holding.setPurchasePrice(amountInr);
        holding.setGrams(grams);
        holding.setCreatedAt(LocalDateTime.now());
        goldRepo.save(holding);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("goldBoughtGrams", grams);
        res.put("newWalletBalance", wallet.getBalance());
        return res;
    }

    @PostMapping("/sell")
    public Map<String, Object> sellGold(@RequestBody Map<String, Object> req) {
        UUID userId = UUID.fromString((String) req.get("userId"));
        BigDecimal gramsToSell = new BigDecimal(req.get("grams").toString());

        BigDecimal totalGramsOwned = goldRepo.findByUserId(userId).stream()
                .map(GoldHolding::getGrams)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalGramsOwned.compareTo(gramsToSell) < 0) {
            throw new RuntimeException("Insufficient gold balance to sell.");
        }

        BigDecimal livePrice = fetchLiveGoldPrice();
        BigDecimal cashValue = gramsToSell.multiply(livePrice).setScale(2, RoundingMode.HALF_UP);

        Wallet wallet = walletRepo.findByUserId(userId).orElseThrow(() -> new RuntimeException("Wallet missing"));
        wallet.setBalance(wallet.getBalance().add(cashValue));
        walletRepo.save(wallet);

        GoldHolding selling = new GoldHolding();
        selling.setUserId(userId);
        selling.setPurchasePrice(cashValue.negate()); 
        selling.setGrams(gramsToSell.negate());      
        selling.setCreatedAt(LocalDateTime.now());
        goldRepo.save(selling);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("goldSoldGrams", gramsToSell);
        res.put("cashReceived", cashValue);
        res.put("newWalletBalance", wallet.getBalance());
        return res;
    }

    @GetMapping("/portfolio/{userId}")
    public Map<String, Object> getPortfolio(@PathVariable UUID userId) {
        BigDecimal totalGrams = goldRepo.findByUserId(userId).stream()
                .map(GoldHolding::getGrams)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal livePrice = fetchLiveGoldPrice();

        Map<String, Object> res = new HashMap<>();
        res.put("totalGrams", totalGrams);
        res.put("currentValue", totalGrams.multiply(livePrice).setScale(2, RoundingMode.HALF_UP));
        return res;
    }
}
