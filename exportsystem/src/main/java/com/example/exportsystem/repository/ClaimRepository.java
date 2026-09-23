package com.example.exportsystem.repository;

import com.example.exportsystem.entity.Claim;
import com.example.exportsystem.entity.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    Page<Claim> findBySubmittedBy_EmailIgnoreCase(String email, Pageable pageable);

    Page<Claim> findByStatus(ClaimStatus status, Pageable pageable);
}
