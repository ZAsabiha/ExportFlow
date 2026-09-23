package com.example.exportsystem.repository;

import com.example.exportsystem.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Powers the Admin Dashboard's "Last log Xm ago" subtitle.
    Optional<AuditLog> findFirstByOrderByCreatedAtDesc();

    // search matches actor email/action/details; action filters to an exact action label.
    
    @Query(value = """
            SELECT a FROM AuditLog a
            WHERE (CAST(:search AS string) IS NULL OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                OR LOWER(a.details) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                OR LOWER(a.action) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (CAST(:action AS string) IS NULL OR a.action = CAST(:action AS string))
            """,
            countQuery = """
            SELECT COUNT(a.id) FROM AuditLog a
            WHERE (CAST(:search AS string) IS NULL OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                OR LOWER(a.details) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                OR LOWER(a.action) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (CAST(:action AS string) IS NULL OR a.action = CAST(:action AS string))
            """)
    Page<AuditLog> search(@Param("search") String search, @Param("action") String action, Pageable pageable);
}
