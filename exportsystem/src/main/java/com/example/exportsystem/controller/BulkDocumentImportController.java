package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.document.BulkImportStatusResponse;
import com.example.exportsystem.dto.document.DocumentImportErrorResponse;
import com.example.exportsystem.service.BulkDocumentImportService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/export-manager/documents/bulk-import")
@PreAuthorize("hasRole('EXPORT_MANAGER')")
public class BulkDocumentImportController {

    private final BulkDocumentImportService bulkDocumentImportService;

    public BulkDocumentImportController(BulkDocumentImportService bulkDocumentImportService) {
        this.bulkDocumentImportService = bulkDocumentImportService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<BulkImportStatusResponse> launch(@RequestParam("manifest") MultipartFile manifest,
                                                             @RequestParam("documents") MultipartFile documentsZip) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(bulkDocumentImportService.launchImport(manifest, documentsZip));
    }

    @GetMapping("/{jobExecutionId}")
    public ResponseEntity<BulkImportStatusResponse> status(@PathVariable Long jobExecutionId) {
        return ResponseEntity.ok(bulkDocumentImportService.getStatus(jobExecutionId));
    }

    @GetMapping("/{jobExecutionId}/errors")
    public ResponseEntity<PageResponse<DocumentImportErrorResponse>> errors(
            @PathVariable Long jobExecutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.DOCUMENTS_PAGE_SIZE,
                Sort.by(Sort.Direction.ASC, "rowNumber"));
        return ResponseEntity.ok(PageResponse.of(bulkDocumentImportService.getErrors(jobExecutionId, pageable)));
    }

    @PostMapping("/{jobExecutionId}/retry")
    public ResponseEntity<BulkImportStatusResponse> retry(@PathVariable Long jobExecutionId) {
        return ResponseEntity.ok(bulkDocumentImportService.retry(jobExecutionId));
    }
}
