package com.example.exportsystem.dto.client;

import com.example.exportsystem.dto.document.DocumentResponse;

import java.time.LocalDateTime;
import java.util.List;

public class DocumentUnlockResponse {

    private String token;
    private String orderCode;
    private LocalDateTime expiresAt;
    private List<DocumentResponse> documents;

    public DocumentUnlockResponse() {}

    public DocumentUnlockResponse(String token, String orderCode, LocalDateTime expiresAt, List<DocumentResponse> documents) {
        this.token = token;
        this.orderCode = orderCode;
        this.expiresAt = expiresAt;
        this.documents = documents;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public List<DocumentResponse> getDocuments() { return documents; }
    public void setDocuments(List<DocumentResponse> documents) { this.documents = documents; }
}
