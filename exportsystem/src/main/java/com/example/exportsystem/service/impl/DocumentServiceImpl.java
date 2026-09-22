package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.document.BatchUploadResponse;
import com.example.exportsystem.dto.document.DocumentResponse;
import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.Order;
import com.example.exportsystem.entity.TradeDocument;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.repository.TradeDocumentRepository;
import com.example.exportsystem.service.DocumentService;
import com.example.exportsystem.service.FileStorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {

    private final TradeDocumentRepository documentRepository;
    private final OrderRepository orderRepository;
    private final FileStorageService fileStorageService;

    public DocumentServiceImpl(TradeDocumentRepository documentRepository,
                                OrderRepository orderRepository,
                                FileStorageService fileStorageService) {
        this.documentRepository = documentRepository;
        this.orderRepository = orderRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    public DocumentResponse uploadSingle(Long orderId, DocumentType documentType, MultipartFile file) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        TradeDocument saved = storeAndPersist(order, documentType, file);
        return toResponse(saved);
    }

    @Override
    public BatchUploadResponse uploadBatch(Long orderId, DocumentType documentType, List<MultipartFile> files) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        BatchUploadResponse result = new BatchUploadResponse();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                result.getErrors().add("Skipped an empty file");
                continue;
            }
            try {
                TradeDocument saved = storeAndPersist(order, documentType, file);
                result.getUploaded().add(toResponse(saved));
            } catch (Exception e) {
                result.getErrors().add(file.getOriginalFilename() + ": " + e.getMessage());
            }
        }
        result.setSuccessCount(result.getUploaded().size());
        result.setFailureCount(result.getErrors().size());
        return result;
    }

    @Override
    public List<DocumentResponse> listByOrder(Long orderId) {
        return documentRepository.findByOrder_Id(orderId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<DocumentResponse> listAll(Pageable pageable) {
        return documentRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public TradeDocument getDocumentEntity(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + id));
    }

    @Override
    public org.springframework.core.io.Resource loadFileAsResource(Long id) {
        TradeDocument doc = getDocumentEntity(id);
        try {
            Path path = java.nio.file.Paths.get(doc.getFilePath()).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or unreadable: " + doc.getOriginalFileName());
            }
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException("Error resolving file path for document ID: " + id, e);
        }
    }

    private TradeDocument storeAndPersist(Order order, DocumentType documentType, MultipartFile file) {
        String extension = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            extension = original.substring(original.lastIndexOf('.'));
        }
        String storedFileName = UUID.randomUUID() + extension;
        Path storedPath = fileStorageService.store(file, storedFileName);

        TradeDocument doc = new TradeDocument();
        doc.setOrder(order);
        doc.setDocumentType(documentType);
        doc.setOriginalFileName(original);
        doc.setStoredFileName(storedFileName);
        doc.setFilePath(storedPath.toString());
        doc.setFileSizeBytes(file.getSize());
        doc.setContentType(file.getContentType());
        return documentRepository.save(doc);
    }

    private DocumentResponse toResponse(TradeDocument doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getOrder().getOrderCode(),
                doc.getDocumentType(),
                doc.getOriginalFileName(),
                doc.getFileSizeBytes(),
                doc.getUploadedAt()
        );
    }
}

