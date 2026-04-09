package com.smartjar.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WalletRequest {

    private Long userId;
    private BigDecimal amount;

}