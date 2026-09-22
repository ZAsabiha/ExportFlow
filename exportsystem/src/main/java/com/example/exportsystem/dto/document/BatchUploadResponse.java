package com.example.exportsystem.dto.document;

import java.util.ArrayList;
import java.util.List;

// Result of a multi-file batch upload: what succeeded and what failed, per file.
public class BatchUploadResponse {
    private int successCount;
    private int failureCount;
    private List<DocumentResponse> uploaded = new ArrayList<>();
    private List<String> errors = new ArrayList<>();

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getFailureCount() { return failureCount; }
    public void setFailureCount(int failureCount) { this.failureCount = failureCount; }

    public List<DocumentResponse> getUploaded() { return uploaded; }
    public void setUploaded(List<DocumentResponse> uploaded) { this.uploaded = uploaded; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
