package com.example.exportsystem.batch;

// A manifest row that TokenGenerationProcessor has successfully resolved against an
// existing Order and validated - ready to issue a download token for.
public class ResolvedTokenGeneration {
    private final Long orderId;
    private final String buyerEmail;
    private final int expiryDays;
    private final int rowNumber;
    private final String orderCode;

    public ResolvedTokenGeneration(Long orderId, String buyerEmail, int expiryDays, int rowNumber, String orderCode) {
        this.orderId = orderId;
        this.buyerEmail = buyerEmail;
        this.expiryDays = expiryDays;
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
    }

    public Long getOrderId() { return orderId; }
    public String getBuyerEmail() { return buyerEmail; }
    public int getExpiryDays() { return expiryDays; }
    public int getRowNumber() { return rowNumber; }
    public String getOrderCode() { return orderCode; }
}
