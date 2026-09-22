package com.example.exportsystem.dto.document;

import com.example.exportsystem.entity.DocumentType;

import java.time.LocalDateTime;

public class DocumentResponse {
    private Long id;
    private String orderCode;
    private DocumentType documentType;
    private String fileName;
    private Long fileSizeBytes;
    private LocalDateTime uploadedAt;

    public DocumentResponse() {}

    public DocumentResponse(Long id, String orderCode, DocumentType documentType, String fileName,
                             Long fileSizeBytes, LocalDateTime uploadedAt) {
        this.id = id;
        this.orderCode = orderCode;
        this.documentType = documentType;
        this.fileName = fileName;
        this.fileSizeBytes = fileSizeBytes;
        this.uploadedAt = uploadedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
