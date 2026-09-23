package com.example.exportsystem.repository;

import com.example.exportsystem.entity.TokenGenerationError;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenGenerationErrorRepository extends JpaRepository<TokenGenerationError, Long> {
    Page<TokenGenerationError> findByJobExecutionId(Long jobExecutionId, Pageable pageable);
}
