package com.example.exportsystem.dto.token;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class GenerateTokenRequest {

    @NotNull
    private Long orderId;

    private String buyerEmail;

    @Positive
    private int expiryDays = 7;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

    public int getExpiryDays() { return expiryDays; }
    public void setExpiryDays(int expiryDays) { this.expiryDays = expiryDays; }
}
