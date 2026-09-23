package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.admin.RejectClaimRequest;
import com.example.exportsystem.dto.admin.ResolveClaimRequest;
import com.example.exportsystem.dto.claim.ClaimResponse;
import com.example.exportsystem.entity.*;
import com.example.exportsystem.repository.ClaimRepository;
import com.example.exportsystem.repository.OrderRepository;
import com.example.exportsystem.service.AuditLogService;
import com.example.exportsystem.service.ClaimService;
import com.example.exportsystem.service.FileStorageService;
import com.example.exportsystem.service.NotificationService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;
    private final OrderRepository orderRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final OrderDeadlineNotifier deadlineNotifier;
    private final AuditLogService auditLogService;

    public ClaimServiceImpl(ClaimRepository claimRepository, OrderRepository orderRepository,
                             FileStorageService fileStorageService, NotificationService notificationService,
                             OrderDeadlineNotifier deadlineNotifier, AuditLogService auditLogService) {
        this.claimRepository = claimRepository;
        this.orderRepository = orderRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
        this.deadlineNotifier = deadlineNotifier;
        this.auditLogService = auditLogService;
    }

    // ---------- Client-facing ----------

    @Override
    @Transactional
    public ClaimResponse fileClaim(User client, Long orderId, String message, MultipartFile proofFile) {
        Order order = findOwnedOrder(client, orderId);

        Claim claim = new Claim();
        claim.setOrder(order);
        claim.setSubmittedBy(client);
        claim.setMessage(message);
        claim.setStatus(ClaimStatus.OPEN);

        if (proofFile != null && !proofFile.isEmpty()) {
            storeProof(claim, proofFile);
        }

        Claim saved = claimRepository.save(claim);
        auditLogService.log(client.getEmail(), "CLIENT", "Claim Filed",
                "Filed a claim against order " + order.getOrderCode());
        return toResponse(saved);
    }

    @Override
    public Page<ClaimResponse> listMyClaims(User client, Pageable pageable) {
        return claimRepository.findBySubmittedBy_EmailIgnoreCase(client.getEmail(), pageable).map(this::toResponse);
    }

    @Override
    public ClaimResponse getMyClaim(User client, Long claimId) {
        return toResponse(findOwnedClaim(client, claimId));
    }

    @Override
    public Resource loadMyProof(User client, Long claimId) {
        return loadProof(findOwnedClaim(client, claimId));
    }

    // ---------- Admin-facing ----------

    @Override
    public Page<ClaimResponse> listAllClaims(ClaimStatus statusFilter, Pageable pageable) {
        Page<Claim> page = statusFilter != null
                ? claimRepository.findByStatus(statusFilter, pageable)
                : claimRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    @Override
    public ClaimResponse getClaim(Long claimId) {
        return toResponse(findOrThrow(claimId));
    }

    @Override
    public Resource loadProofForAdmin(Long claimId) {
        return loadProof(findOrThrow(claimId));
    }

    @Override
    @Transactional
    public ClaimResponse resolveClaim(User admin, Long claimId, ResolveClaimRequest request) {
        Claim claim = findOrThrow(claimId);
        requireOpen(claim);

        Order order = claim.getOrder();
        if (request.isMarkGovernmentVerified()) {
            order.setGovernmentVerified(true);
            order.setGovernmentVerifiedAt(LocalDateTime.now());
            order.setGovernmentVerifiedBy(admin);
        }

        if (request.getDocumentDeadline() != null) {
            boolean eligible = order.getRequestStatus() == RequestStatus.ACCEPTED
                    && order.getStage() != OrderStage.COMPLETED
                    && order.isGovernmentVerified();
            if (!eligible) {
                throw new IllegalArgumentException(
                        "A document upload deadline can only be set for an accepted order, still in progress, "
                                + "whose documents have been government-verified.");
            }
            order.setDocumentDeadline(request.getDocumentDeadline());
            order.setDeadlineNote(request.getDeadlineNote());
            order.setDeadlineReminderSent(false);
        }

        if (request.isMarkGovernmentVerified() || request.getDocumentDeadline() != null) {
            orderRepository.save(order);
        }

        if (request.getDocumentDeadline() != null) {
            String message = "Order " + order.getOrderCode() + " has a document upload deadline of "
                    + order.getDocumentDeadline()
                    + (order.getDeadlineNote() != null && !order.getDeadlineNote().isBlank()
                            ? " (" + order.getDeadlineNote() + ")" : "") + ".";
            deadlineNotifier.notifyExportManagers(order, message);
        }

        claim.setStatus(ClaimStatus.RESOLVED);
        claim.setAdminResponse(request.getAdminResponse());
        claim.setResolvedBy(admin);
        claim.setResolvedAt(LocalDateTime.now());
        Claim saved = claimRepository.save(claim);

        notificationService.notifyClient(claim.getSubmittedBy().getEmail(), order.getOrderCode(),
                "Your claim on order " + order.getOrderCode() + " was resolved: " + request.getAdminResponse(),
                NotificationType.CLAIM);
        auditLogService.log(admin.getEmail(), "ADMIN", "Claim Resolved",
                "Resolved claim #" + claim.getId() + " on order " + order.getOrderCode());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ClaimResponse rejectClaim(User admin, Long claimId, RejectClaimRequest request) {
        Claim claim = findOrThrow(claimId);
        requireOpen(claim);

        claim.setStatus(ClaimStatus.REJECTED);
        claim.setAdminResponse(request.getAdminResponse());
        claim.setResolvedBy(admin);
        claim.setResolvedAt(LocalDateTime.now());
        Claim saved = claimRepository.save(claim);

        notificationService.notifyClient(claim.getSubmittedBy().getEmail(), claim.getOrder().getOrderCode(),
                "Your claim on order " + claim.getOrder().getOrderCode() + " was rejected: " + request.getAdminResponse(),
                NotificationType.CLAIM);
        auditLogService.log(admin.getEmail(), "ADMIN", "Claim Rejected",
                "Rejected claim #" + claim.getId() + " on order " + claim.getOrder().getOrderCode());
        return toResponse(saved);
    }

    // ---------- helpers ----------

    private void requireOpen(Claim claim) {
        if (claim.getStatus() != ClaimStatus.OPEN) {
            throw new IllegalStateException("This claim has already been resolved: " + claim.getId());
        }
    }

    private void storeProof(Claim claim, MultipartFile file) {
        String original = file.getOriginalFilename();
        String extension = "";
        if (original != null && original.contains(".")) {
            extension = original.substring(original.lastIndexOf('.'));
        }
        String storedFileName = UUID.randomUUID() + extension;
        Path storedPath;
        try {
            storedPath = fileStorageService.store(file.getInputStream(), storedFileName);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read uploaded proof file " + original, e);
        }
        claim.setProofOriginalFileName(original);
        claim.setProofStoredFileName(storedFileName);
        claim.setProofFilePath(storedPath.toString());
        claim.setProofFileSizeBytes(file.getSize());
        claim.setProofContentType(file.getContentType());
    }

    private Resource loadProof(Claim claim) {
        if (claim.getProofFilePath() == null) {
            throw new IllegalArgumentException("This claim has no proof attachment");
        }
        try {
            Path path = Paths.get(claim.getProofFilePath()).normalize();
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("File not found or unreadable: " + claim.getProofOriginalFileName());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error resolving proof file path for claim ID: " + claim.getId(), e);
        }
    }

    private Order findOwnedOrder(User client, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (!isOwnedBy(order, client)) {
            throw new IllegalArgumentException("Order not found: " + orderId);
        }
        return order;
    }

    private Claim findOwnedClaim(User client, Long claimId) {
        Claim claim = findOrThrow(claimId);
        if (claim.getSubmittedBy().getEmail() == null || client.getEmail() == null
                || !claim.getSubmittedBy().getEmail().equalsIgnoreCase(client.getEmail())) {
            throw new IllegalArgumentException("Claim not found: " + claimId);
        }
        return claim;
    }

    private boolean isOwnedBy(Order order, User client) {
        if (order.getBuyerEmail() != null && client.getEmail() != null) {
            return order.getBuyerEmail().equalsIgnoreCase(client.getEmail());
        }
        String displayName = (client.getUsername() != null && !client.getUsername().isBlank())
                ? client.getUsername() : client.getEmail();
        return order.getBuyerName() != null && order.getBuyerName().equalsIgnoreCase(displayName);
    }

    private Claim findOrThrow(Long id) {
        return claimRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Claim not found: " + id));
    }

    private ClaimResponse toResponse(Claim claim) {
        ClaimResponse r = new ClaimResponse();
        r.setId(claim.getId());
        r.setOrderId(claim.getOrder().getId());
        r.setOrderCode(claim.getOrder().getOrderCode());
        r.setSubmittedByEmail(claim.getSubmittedBy().getEmail());
        r.setSubmittedByName(claim.getSubmittedBy().getUsername());
        r.setMessage(claim.getMessage());
        r.setHasProofAttachment(claim.getProofFilePath() != null);
        r.setProofOriginalFileName(claim.getProofOriginalFileName());
        r.setProofFileSizeBytes(claim.getProofFileSizeBytes());
        r.setStatus(claim.getStatus());
        r.setAdminResponse(claim.getAdminResponse());
        r.setResolvedByEmail(claim.getResolvedBy() != null ? claim.getResolvedBy().getEmail() : null);
        r.setResolvedAt(claim.getResolvedAt());
        r.setCreatedAt(claim.getCreatedAt());
        return r;
    }
}
