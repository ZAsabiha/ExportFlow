package com.example.exportsystem.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// One row of the per-row error report for a bulk token generation job. jobExecutionId
// points at Spring Batch's own BATCH_JOB_EXECUTION table (id), not a local FK - Batch
// owns that schema, we just reference it by id. See batch.TokenGenerationSkipListener.
@Entity
@Table(name = "token_generation_errors")
public class TokenGenerationError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long jobExecutionId;

    private Integer rowNumber;
    private String orderCode;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public TokenGenerationError() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getJobExecutionId() { return jobExecutionId; }
    public void setJobExecutionId(Long jobExecutionId) { this.jobExecutionId = jobExecutionId; }

    public Integer getRowNumber() { return rowNumber; }
    public void setRowNumber(Integer rowNumber) { this.rowNumber = rowNumber; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
