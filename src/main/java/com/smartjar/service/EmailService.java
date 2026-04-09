package com.smartjar.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;

    public void sendCode(String toEmail, String otpCode) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(toEmail);
        msg.setSubject("SmartJar Auth Code");
        msg.setText("Your highly secure OTP verification code is: " + otpCode);
        mailSender.send(msg);
    }
}
