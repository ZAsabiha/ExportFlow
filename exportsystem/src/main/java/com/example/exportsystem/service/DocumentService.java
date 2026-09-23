package com.example.exportsystem.service;

import com.example.exportsystem.dto.document.BatchUploadResponse;
import com.example.exportsystem.dto.document.DocumentResponse;
import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.entity.TradeDocument;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

public interface DocumentService {

    DocumentResponse uploadSingle(Long orderId, DocumentType documentType, MultipartFile file);

    // Accepts several files against the same order in one call - what the
    // frontend's multi-select FileUploader needs. Partial failures (e.g. one bad
    // file among ten) don't abort the rest; each result is reported individually.
    BatchUploadResponse uploadBatch(Long orderId, DocumentType documentType, List<MultipartFile> files);

    // Same persistence path as uploadSingle/uploadBatch, for content that isn't a
    // MultipartFile - used by the bulk-import Spring Batch writer to attach a file
    // read out of a ZIP entry. Caller owns closing the stream.
    TradeDocument storeFromStream(Order order, DocumentType documentType, InputStream in,
                                   String originalFileName, long size, String contentType);

    List<DocumentResponse> listByOrder(Long orderId);

    Page<DocumentResponse> listAll(Pageable pageable);

    TradeDocument getDocumentEntity(Long id);

    Resource loadFileAsResource(Long id);
}

