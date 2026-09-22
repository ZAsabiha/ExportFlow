package com.example.exportsystem.dto.order;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

// Submitted by the Export Manager after checking supplier availability, price, and
// timeline against a client's pending request.
public class ManagerQuoteRequest {

    @NotNull
    @Positive
    private BigDecimal quotedPrice;

    @NotNull
    private LocalDate quotedDeliveryDate;

    private String managerNote;

    public BigDecimal getQuotedPrice() { return quotedPrice; }
    public void setQuotedPrice(BigDecimal quotedPrice) { this.quotedPrice = quotedPrice; }

    public LocalDate getQuotedDeliveryDate() { return quotedDeliveryDate; }
    public void setQuotedDeliveryDate(LocalDate quotedDeliveryDate) { this.quotedDeliveryDate = quotedDeliveryDate; }

    public String getManagerNote() { return managerNote; }
    public void setManagerNote(String managerNote) { this.managerNote = managerNote; }
}
