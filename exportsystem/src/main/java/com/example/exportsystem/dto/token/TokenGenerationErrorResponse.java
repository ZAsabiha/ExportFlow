package com.example.exportsystem.dto.token;

public class TokenGenerationErrorResponse {
    private Integer rowNumber;
    private String orderCode;
    private String message;

    public TokenGenerationErrorResponse() {}

    public TokenGenerationErrorResponse(Integer rowNumber, String orderCode, String message) {
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
        this.message = message;
    }

    public Integer getRowNumber() { return rowNumber; }
    public void setRowNumber(Integer rowNumber) { this.rowNumber = rowNumber; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
