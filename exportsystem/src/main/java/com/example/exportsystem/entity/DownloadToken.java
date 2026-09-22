package com.example.exportsystem.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// Secure token that lets a buyer/client download the trade documents for one order.
// Not to be confused with RefreshToken, which is for login sessions.
@Entity
@Table(name = "download_tokens")
public class DownloadToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    private String buyerEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DownloadTokenStatus status = DownloadTokenStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        this.issuedAt = LocalDateTime.now();
    }

    public DownloadToken() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

    public DownloadTokenStatus getStatus() { return status; }
    public void setStatus(DownloadTokenStatus status) { this.status = status; }

    public LocalDateTime getIssuedAt() { return issuedAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
