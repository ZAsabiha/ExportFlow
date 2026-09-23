package com.example.exportsystem.service;

import com.example.exportsystem.dto.admin.RejectClaimRequest;
import com.example.exportsystem.dto.admin.ResolveClaimRequest;
import com.example.exportsystem.dto.claim.ClaimResponse;
import com.example.exportsystem.entity.ClaimStatus;
import com.example.exportsystem.entity.User;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;


public interface ClaimService {

    // ---- Client-facing ----
    ClaimResponse fileClaim(User client, Long orderId, String message, MultipartFile proofFile);

    Page<ClaimResponse> listMyClaims(User client, Pageable pageable);

    ClaimResponse getMyClaim(User client, Long claimId);

    Resource loadMyProof(User client, Long claimId);

    // ---- Admin-facing ----
    Page<ClaimResponse> listAllClaims(ClaimStatus statusFilter, Pageable pageable);

    ClaimResponse getClaim(Long claimId);

    Resource loadProofForAdmin(Long claimId);

   
    ClaimResponse resolveClaim(User admin, Long claimId, ResolveClaimRequest request);

    ClaimResponse rejectClaim(User admin, Long claimId, RejectClaimRequest request);
}
