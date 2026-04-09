package com.smartjar.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpiPaymentRequest {
    private String senderUpi;
    private String receiverUpi;
    private BigDecimal amount;
    private String note;
    private boolean applyRoundUp;
    private boolean applyFivePercent;
    private String mpin;
}
