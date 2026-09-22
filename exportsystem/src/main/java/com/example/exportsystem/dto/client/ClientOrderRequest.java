package com.example.exportsystem.dto.client;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

// What a logged-in client submits from "Request New Order". Carries the full detail the
// export manager needs to judge feasibility (product, quantity, destination, target price,
// deadline) - buyerName/buyerEmail are derived from the account, and the final amount isn't
// set until the manager quotes it and the client accepts.
public class ClientOrderRequest {

    @NotBlank
    private String productName;

    @NotNull
    @Positive
    private Integer quantity;

    @NotBlank
    private String destination;

    @NotNull
    @Positive
    private BigDecimal targetPrice;

    @NotNull
    @Future
    private LocalDate neededByDate;

    // Optional extra context (packaging, HS codes, special handling, etc.)
    private String itemsDescription;

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public BigDecimal getTargetPrice() { return targetPrice; }
    public void setTargetPrice(BigDecimal targetPrice) { this.targetPrice = targetPrice; }

    public LocalDate getNeededByDate() { return neededByDate; }
    public void setNeededByDate(LocalDate neededByDate) { this.neededByDate = neededByDate; }

    public String getItemsDescription() { return itemsDescription; }
    public void setItemsDescription(String itemsDescription) { this.itemsDescription = itemsDescription; }
}
