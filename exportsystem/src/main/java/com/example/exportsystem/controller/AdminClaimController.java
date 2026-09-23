package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.admin.RejectClaimRequest;
import com.example.exportsystem.dto.admin.ResolveClaimRequest;
import com.example.exportsystem.dto.claim.ClaimResponse;
import com.example.exportsystem.entity.ClaimStatus;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/claims")
@PreAuthorize("hasRole('ADMIN')")
public class AdminClaimController {

    private final ClaimService claimService;
    private final UserRepository userRepository;

    public AdminClaimController(ClaimService claimService, UserRepository userRepository) {
        this.claimService = claimService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ClaimResponse>> listClaims(@RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(required = false) Integer size,
                                                                     @RequestParam(required = false) ClaimStatus status) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.CLAIMS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(claimService.listAllClaims(status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> getClaim(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getClaim(id));
    }

    @GetMapping("/{id}/proof/download")
    public ResponseEntity<Resource> downloadProof(@PathVariable Long id) {
        ClaimResponse claim = claimService.getClaim(id);
        Resource resource = claimService.loadProofForAdmin(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + claim.getProofOriginalFileName() + "\"")
                .body(resource);
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ClaimResponse> resolve(Authentication authentication, @PathVariable Long id,
                                                   @Valid @RequestBody ResolveClaimRequest request) {
        return ResponseEntity.ok(claimService.resolveClaim(currentUser(authentication), id, request));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ClaimResponse> reject(Authentication authentication, @PathVariable Long id,
                                                  @Valid @RequestBody RejectClaimRequest request) {
        return ResponseEntity.ok(claimService.rejectClaim(currentUser(authentication), id, request));
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + authentication.getName()));
    }
}
