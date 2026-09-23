package com.example.exportsystem.dto.token;

import java.time.LocalDateTime;

public class BulkTokenGenerationStatusResponse {
    private Long jobExecutionId;
    private String status;
    private String exitDescription;
    private long readCount;
    private long successCount;
    private long skippedCount;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public BulkTokenGenerationStatusResponse() {}

    public Long getJobExecutionId() { return jobExecutionId; }
    public void setJobExecutionId(Long jobExecutionId) { this.jobExecutionId = jobExecutionId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getExitDescription() { return exitDescription; }
    public void setExitDescription(String exitDescription) { this.exitDescription = exitDescription; }

    public long getReadCount() { return readCount; }
    public void setReadCount(long readCount) { this.readCount = readCount; }

    public long getSuccessCount() { return successCount; }
    public void setSuccessCount(long successCount) { this.successCount = successCount; }

    public long getSkippedCount() { return skippedCount; }
    public void setSkippedCount(long skippedCount) { this.skippedCount = skippedCount; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
}
