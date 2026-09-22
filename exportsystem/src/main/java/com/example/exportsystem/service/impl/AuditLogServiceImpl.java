package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.admin.AuditLogResponse;
import com.example.exportsystem.entity.AuditLog;
import com.example.exportsystem.repository.AuditLogRepository;
import com.example.exportsystem.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void log(String actorEmail, String actorRole, String action, String details) {
        AuditLog entry = new AuditLog();
        entry.setActorEmail(actorEmail);
        entry.setActorRole(actorRole);
        entry.setAction(action);
        entry.setDetails(details);
        entry.setIpAddress(currentRequestIp());
        auditLogRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> list(String search, String action, Pageable pageable) {
        String safeSearch = (search == null || search.isBlank()) ? null : search.trim();
        String safeAction = (action == null || action.isBlank()) ? null : action.trim();
        return auditLogRepository.search(safeSearch, safeAction, pageable).map(this::toResponse);
    }

    // Best-effort: only present when called on a request thread (true for every current call
    // site). Never fails logging itself if it's unavailable.
    private String currentRequestIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest().getRemoteAddr() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private AuditLogResponse toResponse(AuditLog entry) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(entry.getId());
        response.setUser(entry.getActorEmail());
        response.setRole(entry.getActorRole());
        response.setAction(entry.getAction());
        response.setDetails(entry.getDetails());
        response.setIp(entry.getIpAddress());
        response.setTimestamp(entry.getCreatedAt());
        return response;
    }
}
