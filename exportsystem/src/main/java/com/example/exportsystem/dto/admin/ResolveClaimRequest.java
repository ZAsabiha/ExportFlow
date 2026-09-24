package com.example.exportsystem.dto.admin;

import com.example.exportsystem.entity.DocumentType;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.Set;

public class ResolveClaimRequest {

    @NotBlank
    private String adminResponse;

    private boolean markGovernmentVerified;

    // Optional - only set once the order is (or is being) government-verified.
    private LocalDateTime documentDeadline;

    private String deadlineNote;

    // Documents the Export Manager must upload by the deadline. Only used with documentDeadline;
    // if null, the documents the client ticked on the claim are used.
    private Set<DocumentType> requiredDocuments;

    public String getAdminResponse() { return adminResponse; }
    public void setAdminResponse(String adminResponse) { this.adminResponse = adminResponse; }

    public boolean isMarkGovernmentVerified() { return markGovernmentVerified; }
    public void setMarkGovernmentVerified(boolean markGovernmentVerified) { this.markGovernmentVerified = markGovernmentVerified; }

    public LocalDateTime getDocumentDeadline() { return documentDeadline; }
    public void setDocumentDeadline(LocalDateTime documentDeadline) { this.documentDeadline = documentDeadline; }

    public String getDeadlineNote() { return deadlineNote; }
    public void setDeadlineNote(String deadlineNote) { this.deadlineNote = deadlineNote; }

    public Set<DocumentType> getRequiredDocuments() { return requiredDocuments; }
    public void setRequiredDocuments(Set<DocumentType> requiredDocuments) { this.requiredDocuments = requiredDocuments; }
}
