package com.smartjar.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.smartjar.entity.Wallet;
import com.smartjar.repository.WalletRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PaymentController {

    @Value("${razorpay.key.id:rzp_test_YourGenericKey}")
    private String keyId;

    @Value("${razorpay.key.secret:YourGenericSecret}")
    private String keySecret;

    @Value("${razorpay.webhook.secret:webhook_secret_change_me}")
    private String webhookSecret;

    private final WalletRepository walletRepo;

    public PaymentController(WalletRepository walletRepo) {
        this.walletRepo = walletRepo;
    }

    @PostMapping("/create-order")
    public Map<String, Object> createOrder(@RequestBody Map<String, Object> data) throws RazorpayException {
        try {
            int amount = (int) data.get("amount"); // Amount in INR
            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount * 100); // Amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + UUID.randomUUID().toString().substring(0, 8));

            Order order = razorpay.orders.create(orderRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("key", keyId);
            return response;
        } catch (RazorpayException e) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("error", "Razorpay authentication failed or keys missing. Operating in Mock Mode.");
            fallback.put("orderId", "order_mock_" + UUID.randomUUID().toString().substring(0, 8));
            fallback.put("amount", (int) data.get("amount") * 100);
            return fallback;
        }
    }

    /**
     * Verifies Razorpay payment signature before crediting wallet.
     * SECURITY: Never credit a wallet without verifying the HMAC-SHA256 signature.
     */
    @PostMapping("/verify-wallet-topup")
    public Map<String, Object> verifyPaymentAndTopup(@RequestBody Map<String, Object> data) {
        String orderId = (String) data.get("orderId");
        String paymentId = (String) data.get("paymentId");
        String signature = (String) data.get("signature");

        // Verify Razorpay signature — reject if missing or invalid
        if (orderId == null || paymentId == null || signature == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payment verification fields.");
        }

        if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Payment signature verification failed.");
        }

        UUID userId = UUID.fromString((String) data.get("userId"));
        int amount = (int) data.get("amount");

        Wallet wallet = walletRepo.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(BigDecimal.valueOf(amount)));
        walletRepo.save(wallet);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("newBalance", wallet.getBalance());
        return response;
    }

    /**
     * Validates the Razorpay payment signature using HMAC-SHA256.
     * Formula: HMAC_SHA256(orderId + "|" + paymentId, webhookSecret)
     */
    private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hashBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(hashBytes);
            // Constant-time comparison to prevent timing attacks
            return constantTimeEquals(expectedSignature, signature);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
