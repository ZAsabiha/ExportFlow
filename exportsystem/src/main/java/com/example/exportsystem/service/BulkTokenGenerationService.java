package com.example.exportsystem.service;

import com.example.exportsystem.dto.token.BulkTokenGenerationStatusResponse;
import com.example.exportsystem.dto.token.TokenGenerationErrorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface BulkTokenGenerationService {

    // Stages the manifest and launches tokenGenerationJob in the background; returns as
    // soon as the job has started, not when it finishes.
    BulkTokenGenerationStatusResponse launchGeneration(MultipartFile manifest);

    BulkTokenGenerationStatusResponse getStatus(Long jobExecutionId);

    Page<TokenGenerationErrorResponse> getErrors(Long jobExecutionId, Pageable pageable);

    // Resumes a job that failed outright (crash, I/O error) from its last completed
    // chunk. Not for per-row validation failures - those are already skipped, not failed.
    BulkTokenGenerationStatusResponse retry(Long jobExecutionId);
}
