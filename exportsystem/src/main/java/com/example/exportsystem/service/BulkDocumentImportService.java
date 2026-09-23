package com.example.exportsystem.service;

import com.example.exportsystem.dto.document.BulkImportStatusResponse;
import com.example.exportsystem.dto.document.DocumentImportErrorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface BulkDocumentImportService {

    // Stages the manifest + ZIP and launches documentImportJob in the background;
    // returns as soon as the job has started, not when it finishes.
    BulkImportStatusResponse launchImport(MultipartFile manifest, MultipartFile documentsZip);

    BulkImportStatusResponse getStatus(Long jobExecutionId);

    Page<DocumentImportErrorResponse> getErrors(Long jobExecutionId, Pageable pageable);

    // Resumes a job that failed outright (crash, I/O error) from its last completed
    // chunk. Not for per-row validation failures - those are already skipped, not failed.
    BulkImportStatusResponse retry(Long jobExecutionId);
}
