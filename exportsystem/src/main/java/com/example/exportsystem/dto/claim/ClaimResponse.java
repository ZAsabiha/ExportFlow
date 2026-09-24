package com.example.exportsystem.dto.claim;

import com.example.exportsystem.entity.ClaimStatus;
import com.example.exportsystem.entity.DocumentType;

import java.time.LocalDateTime;
import java.util.Set;

public class ClaimResponse {

    private Long id;
    private Long orderId;
    private String orderCode;
    private String submittedByEmail;
    private String submittedByName;
    private String message;
    private boolean hasProofAttachment;
    private String proofOriginalFileName;
    private Long proofFileSizeBytes;
    private Set<DocumentType> requestedDocuments;
    private ClaimStatus status;
    private String adminResponse;
    private String resolvedByEmail;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getSubmittedByEmail() { return submittedByEmail; }
    public void setSubmittedByEmail(String submittedByEmail) { this.submittedByEmail = submittedByEmail; }

    public String getSubmittedByName() { return submittedByName; }
    public void setSubmittedByName(String submittedByName) { this.submittedByName = submittedByName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isHasProofAttachment() { return hasProofAttachment; }
    public void setHasProofAttachment(boolean hasProofAttachment) { this.hasProofAttachment = hasProofAttachment; }

    public String getProofOriginalFileName() { return proofOriginalFileName; }
    public void setProofOriginalFileName(String proofOriginalFileName) { this.proofOriginalFileName = proofOriginalFileName; }

    public Long getProofFileSizeBytes() { return proofFileSizeBytes; }
    public void setProofFileSizeBytes(Long proofFileSizeBytes) { this.proofFileSizeBytes = proofFileSizeBytes; }

    public Set<DocumentType> getRequestedDocuments() { return requestedDocuments; }
    public void setRequestedDocuments(Set<DocumentType> requestedDocuments) { this.requestedDocuments = requestedDocuments; }

    public ClaimStatus getStatus() { return status; }
    public void setStatus(ClaimStatus status) { this.status = status; }

    public String getAdminResponse() { return adminResponse; }
    public void setAdminResponse(String adminResponse) { this.adminResponse = adminResponse; }

    public String getResolvedByEmail() { return resolvedByEmail; }
    public void setResolvedByEmail(String resolvedByEmail) { this.resolvedByEmail = resolvedByEmail; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
