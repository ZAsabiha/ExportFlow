package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.claim.ClaimResponse;
import com.example.exportsystem.entity.DocumentType;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.ClaimService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@RestController
@RequestMapping("/api/client/claims")
@PreAuthorize("hasRole('CLIENT')")
public class ClientClaimController {

    private final ClaimService claimService;
    private final UserRepository userRepository;

    public ClientClaimController(ClaimService claimService, UserRepository userRepository) {
        this.claimService = claimService;
        this.userRepository = userRepository;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ClaimResponse> fileClaim(Authentication authentication,
                                                     @RequestParam Long orderId,
                                                     @RequestParam String message,
                                                     @RequestParam(value = "requestedDocuments", required = false) Set<DocumentType> requestedDocuments,
                                                     @RequestParam(value = "proofFile", required = false) MultipartFile proofFile) {
        return ResponseEntity.ok(claimService.fileClaim(currentUser(authentication), orderId, message,
                requestedDocuments, proofFile));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ClaimResponse>> myClaims(Authentication authentication,
                                                                  @RequestParam(defaultValue = "0") int page,
                                                                  @RequestParam(required = false) Integer size) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.CLAIMS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(claimService.listMyClaims(currentUser(authentication), pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> myClaim(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(claimService.getMyClaim(currentUser(authentication), id));
    }

    @GetMapping("/{id}/proof/download")
    public ResponseEntity<Resource> downloadMyProof(Authentication authentication, @PathVariable Long id) {
        User client = currentUser(authentication);
        ClaimResponse claim = claimService.getMyClaim(client, id);
        Resource resource = claimService.loadMyProof(client, id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + claim.getProofOriginalFileName() + "\"")
                .body(resource);
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + authentication.getName()));
    }
}
