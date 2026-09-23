package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.token.BulkTokenGenerationStatusResponse;
import com.example.exportsystem.dto.token.TokenGenerationErrorResponse;
import com.example.exportsystem.service.BulkTokenGenerationService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/export-manager/tokens/bulk-generate")
@PreAuthorize("hasRole('EXPORT_MANAGER')")
public class BulkTokenGenerationController {

    private final BulkTokenGenerationService bulkTokenGenerationService;

    public BulkTokenGenerationController(BulkTokenGenerationService bulkTokenGenerationService) {
        this.bulkTokenGenerationService = bulkTokenGenerationService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<BulkTokenGenerationStatusResponse> launch(@RequestParam("manifest") MultipartFile manifest) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(bulkTokenGenerationService.launchGeneration(manifest));
    }

    @GetMapping("/{jobExecutionId}")
    public ResponseEntity<BulkTokenGenerationStatusResponse> status(@PathVariable Long jobExecutionId) {
        return ResponseEntity.ok(bulkTokenGenerationService.getStatus(jobExecutionId));
    }

    @GetMapping("/{jobExecutionId}/errors")
    public ResponseEntity<PageResponse<TokenGenerationErrorResponse>> errors(
            @PathVariable Long jobExecutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.TOKENS_PAGE_SIZE,
                Sort.by(Sort.Direction.ASC, "rowNumber"));
        return ResponseEntity.ok(PageResponse.of(bulkTokenGenerationService.getErrors(jobExecutionId, pageable)));
    }

    @PostMapping("/{jobExecutionId}/retry")
    public ResponseEntity<BulkTokenGenerationStatusResponse> retry(@PathVariable Long jobExecutionId) {
        return ResponseEntity.ok(bulkTokenGenerationService.retry(jobExecutionId));
    }
}
