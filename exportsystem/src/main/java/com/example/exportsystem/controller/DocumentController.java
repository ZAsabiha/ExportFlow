package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.document.BatchUploadResponse;
import com.example.exportsystem.dto.document.DocumentResponse;
import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.service.DocumentService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/export-manager/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<DocumentResponse> upload(@RequestParam Long orderId,
                                                     @RequestParam DocumentType documentType,
                                                     @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.uploadSingle(orderId, documentType, file));
    }


    @PostMapping(value = "/batch-upload", consumes = "multipart/form-data")
    public ResponseEntity<BatchUploadResponse> batchUpload(@RequestParam Long orderId,
                                                             @RequestParam DocumentType documentType,
                                                             @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(documentService.uploadBatch(orderId, documentType, files));
    }

    @GetMapping
    public ResponseEntity<PageResponse<DocumentResponse>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.DOCUMENTS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "uploadedAt"));
        return ResponseEntity.ok(PageResponse.of(documentService.listAll(pageable)));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<DocumentResponse>> listByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(documentService.listByOrder(orderId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable Long id) {
        com.example.exportsystem.entity.TradeDocument doc = documentService.getDocumentEntity(id);
        org.springframework.core.io.Resource resource = documentService.loadFileAsResource(id);

        String contentType = doc.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getOriginalFileName() + "\"")
                .body(resource);
    }
}

