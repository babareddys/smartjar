package com.smartjar.config;

import com.razorpay.RazorpayClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id}")
    private String key;

    @Value("${razorpay.key.secret}")
    private String secret;

    @Bean
    public RazorpayClient razorpayClient() throws Exception {
        return new RazorpayClient(key, secret);
    }
}
