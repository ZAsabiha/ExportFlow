package com.example.exportsystem.dto.token;

import com.example.exportsystem.entity.DownloadTokenStatus;

import java.time.LocalDateTime;

public class TokenResponse {
    private String token;
    private String orderCode;
    private String buyerEmail;
    private DownloadTokenStatus status;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

    public DownloadTokenStatus getStatus() { return status; }
    public void setStatus(DownloadTokenStatus status) { this.status = status; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
