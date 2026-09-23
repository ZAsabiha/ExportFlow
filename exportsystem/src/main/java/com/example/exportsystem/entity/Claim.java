package com.example.exportsystem.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// A client's complaint against one of their own orders (e.g. "requested weeks ago, still
// not processing"), with an optional proof file attachment. Strictly a Client <-> Admin
// channel - the Export Manager never sees claims. See ClaimService for the resolve/reject
// workflow, which is also where Admin marks an order government-verified and sets its
// document-upload deadline in one combined action.
@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @Column(nullable = false, length = 2000)
    private String message;

    // Optional proof attachment - same shape as TradeDocument's file columns, but all
    // nullable since a claim doesn't require one.
    private String proofOriginalFileName;

    @Column(unique = true)
    private String proofStoredFileName;

    private String proofFilePath;
    private Long proofFileSizeBytes;
    private String proofContentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status = ClaimStatus.OPEN;

    @Column(length = 2000)
    private String adminResponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    private LocalDateTime resolvedAt;

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

    public Claim() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getProofOriginalFileName() { return proofOriginalFileName; }
    public void setProofOriginalFileName(String proofOriginalFileName) { this.proofOriginalFileName = proofOriginalFileName; }

    public String getProofStoredFileName() { return proofStoredFileName; }
    public void setProofStoredFileName(String proofStoredFileName) { this.proofStoredFileName = proofStoredFileName; }

    public String getProofFilePath() { return proofFilePath; }
    public void setProofFilePath(String proofFilePath) { this.proofFilePath = proofFilePath; }

    public Long getProofFileSizeBytes() { return proofFileSizeBytes; }
    public void setProofFileSizeBytes(Long proofFileSizeBytes) { this.proofFileSizeBytes = proofFileSizeBytes; }

    public String getProofContentType() { return proofContentType; }
    public void setProofContentType(String proofContentType) { this.proofContentType = proofContentType; }

    public ClaimStatus getStatus() { return status; }
    public void setStatus(ClaimStatus status) { this.status = status; }

    public String getAdminResponse() { return adminResponse; }
    public void setAdminResponse(String adminResponse) { this.adminResponse = adminResponse; }

    public User getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(User resolvedBy) { this.resolvedBy = resolvedBy; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
