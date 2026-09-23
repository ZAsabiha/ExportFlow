package com.example.exportsystem.repository;

import com.example.exportsystem.entity.DocumentImportError;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentImportErrorRepository extends JpaRepository<DocumentImportError, Long> {
    Page<DocumentImportError> findByJobExecutionId(Long jobExecutionId, Pageable pageable);
}
