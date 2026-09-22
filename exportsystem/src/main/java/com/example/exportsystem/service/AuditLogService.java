package com.example.exportsystem.service;

import com.example.exportsystem.dto.admin.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

// Cross-cutting: called from AuthService, AdminService, ClientService, OrderService and
// TokenService whenever they complete a notable action, so the Admin Portal's Audit Logs
// page has a real, paginated trail instead of the placeholder data it started with.
public interface AuditLogService {

    // actorEmail is null for actions with no individually-attributable actor (see AuditLog).
    void log(String actorEmail, String actorRole, String action, String details);

    Page<AuditLogResponse> list(String search, String action, Pageable pageable);
}
