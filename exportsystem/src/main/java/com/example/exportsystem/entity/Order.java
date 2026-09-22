package com.example.exportsystem.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Human-facing code shown in the UI, e.g. "EXP-1001"
    @Column(nullable = false, unique = true)
    private String orderCode;

    @Column(nullable = false)
    private String buyerName;

    // Matched against User.email at creation time - used for ownership checks and
    // notification delivery, since it's unique unlike buyerName.
    private String buyerEmail;

    // ---- What the client asked for ----
    private String productName;
    private Integer quantity;
    private String destination;
    private BigDecimal targetPrice;
    private LocalDate neededByDate;
    private String itemsDescription;

    // ---- Export manager's response to the request ----
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus requestStatus = RequestStatus.PENDING;

    private BigDecimal managerQuotedPrice;
    private LocalDate managerQuotedDeliveryDate;
    private String managerNote;

    // Final agreed amount - stays zero until the client accepts a quote.
    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStage stage = OrderStage.CREATED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Order() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

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

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
