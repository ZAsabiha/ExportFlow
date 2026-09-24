package com.example.exportsystem.dto.order;

import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.OrderStage;
import com.example.exportsystem.entity.PaymentStatus;
import com.example.exportsystem.entity.RequestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public class OrderResponse {

    private Long id;
    private String orderCode;
    private String buyerName;

    private String productName;
    private Integer quantity;
    private String destination;
    private BigDecimal targetPrice;
    private LocalDate neededByDate;
    private String itemsDescription;

    private RequestStatus requestStatus;
    private BigDecimal managerQuotedPrice;
    private LocalDate managerQuotedDeliveryDate;
    private String managerNote;

    private BigDecimal amount;
    private OrderStage stage;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;

    private LocalDateTime documentDeadline;
    private String deadlineNote;
    private Set<DocumentType> requiredDocuments;
    private boolean governmentVerified;
    private LocalDateTime governmentVerifiedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

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

    public RequestStatus getRequestStatus() { return requestStatus; }
    public void setRequestStatus(RequestStatus requestStatus) { this.requestStatus = requestStatus; }

    public BigDecimal getManagerQuotedPrice() { return managerQuotedPrice; }
    public void setManagerQuotedPrice(BigDecimal managerQuotedPrice) { this.managerQuotedPrice = managerQuotedPrice; }

    public LocalDate getManagerQuotedDeliveryDate() { return managerQuotedDeliveryDate; }
    public void setManagerQuotedDeliveryDate(LocalDate managerQuotedDeliveryDate) { this.managerQuotedDeliveryDate = managerQuotedDeliveryDate; }

    public String getManagerNote() { return managerNote; }
    public void setManagerNote(String managerNote) { this.managerNote = managerNote; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public OrderStage getStage() { return stage; }
    public void setStage(OrderStage stage) { this.stage = stage; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getDocumentDeadline() { return documentDeadline; }
    public void setDocumentDeadline(LocalDateTime documentDeadline) { this.documentDeadline = documentDeadline; }

    public String getDeadlineNote() { return deadlineNote; }
    public void setDeadlineNote(String deadlineNote) { this.deadlineNote = deadlineNote; }

    public Set<DocumentType> getRequiredDocuments() { return requiredDocuments; }
    public void setRequiredDocuments(Set<DocumentType> requiredDocuments) { this.requiredDocuments = requiredDocuments; }

    public boolean isGovernmentVerified() { return governmentVerified; }
    public void setGovernmentVerified(boolean governmentVerified) { this.governmentVerified = governmentVerified; }

    public LocalDateTime getGovernmentVerifiedAt() { return governmentVerifiedAt; }
    public void setGovernmentVerifiedAt(LocalDateTime governmentVerifiedAt) { this.governmentVerifiedAt = governmentVerifiedAt; }
}
