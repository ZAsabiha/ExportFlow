package com.example.exportsystem.batch;

// Thrown by TokenGenerationProcessor/TokenGenerationWriter for a row that can't have a
// token issued (unknown order, bad expiryDays). The step is configured to skip these
// rather than fail the whole job - see TokenGenerationJobConfig - and
// TokenGenerationSkipListener records each one to token_generation_errors.
public class RowTokenGenerationException extends RuntimeException {
    private final Integer rowNumber;
    private final String orderCode;

    public RowTokenGenerationException(Integer rowNumber, String orderCode, String message) {
        super(message);
        this.rowNumber = rowNumber;
        this.orderCode = orderCode;
    }

    public Integer getRowNumber() { return rowNumber; }
    public String getOrderCode() { return orderCode; }
}
