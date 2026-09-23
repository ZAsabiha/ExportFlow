package com.example.exportsystem.batch;

// One raw row from the bulk token-generation manifest, before validation. rowNumber is
// 1-based, matching what a spreadsheet user sees.
public class TokenGenerationRow {
    private final int rowNumber;
    private final String orderCode;
    private final String buyerEmail;
    private final String expiryDaysRaw;

    public TokenGenerationRow(int rowNumber, String orderCode, String buyerEmail, String expiryDaysRaw) {
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
        this.buyerEmail = buyerEmail;
        this.expiryDaysRaw = expiryDaysRaw;
    }

    public int getRowNumber() { return rowNumber; }
    public String getOrderCode() { return orderCode; }
    public String getBuyerEmail() { return buyerEmail; }
    public String getExpiryDaysRaw() { return expiryDaysRaw; }
}
