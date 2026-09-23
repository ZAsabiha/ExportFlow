package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.admin.AdminDashboardSummary;
import com.example.exportsystem.dto.admin.AdminUserResponse;
import com.example.exportsystem.entity.DownloadTokenStatus;
import com.example.exportsystem.entity.Role;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.AuditLogRepository;
import com.example.exportsystem.repository.DownloadTokenRepository;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.AdminService;
import com.example.exportsystem.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;
    private final DownloadTokenRepository downloadTokenRepository;

    public AdminServiceImpl(UserRepository userRepository, AuditLogService auditLogService,
                             AuditLogRepository auditLogRepository, DownloadTokenRepository downloadTokenRepository) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.auditLogRepository = auditLogRepository;
        this.downloadTokenRepository = downloadTokenRepository;
    }

    @Override
    public Page<AdminUserResponse> listUsers(String search, String role, Pageable pageable) {
        String safeSearch = (search == null || search.isBlank()) ? null : search.trim();
        String safeRole = (role == null || role.isBlank()) ? null : role.trim();
        return userRepository.search(safeSearch, safeRole, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public AdminUserResponse setUserEnabled(User actingAdmin, Long userId, boolean enabled) {
        if (!enabled && actingAdmin.getId().equals(userId)) {
            throw new IllegalArgumentException("You can't deactivate your own account");
        }
        User user = findOrThrow(userId);
        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        auditLogService.log(actingAdmin.getEmail(), "ADMIN",
                enabled ? "User Activated" : "User Deactivated",
                "Set " + saved.getEmail() + " to " + (enabled ? "active" : "inactive"));
        return toResponse(saved);
    }

    @Override
    public AdminDashboardSummary getDashboardSummary() {
        long activeTokens = downloadTokenRepository.countByStatus(DownloadTokenStatus.ACTIVE);
        long totalTokens = downloadTokenRepository.count();

        Map<String, Long> activeAccountsByRole = new LinkedHashMap<>();
        for (Object[] row : userRepository.countEnabledUsersByRole()) {
            activeAccountsByRole.put((String) row[0], (Long) row[1]);
        }

        AdminDashboardSummary summary = new AdminDashboardSummary();
        summary.setTotalUsers(userRepository.count());
        summary.setActiveTokens(activeTokens);
        summary.setActiveTokenRate(totalTokens == 0 ? 100.0 : (activeTokens * 100.0 / totalTokens));
        summary.setTotalAuditLogs(auditLogRepository.count());
        summary.setLastAuditLogAt(auditLogRepository.findFirstByOrderByCreatedAtDesc()
                .map(log -> log.getCreatedAt()).orElse(null));
        summary.setActiveAccountsByRole(activeAccountsByRole);
        return summary;
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    private AdminUserResponse toResponse(User user) {
        AdminUserResponse response = new AdminUserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRoles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
        response.setEnabled(user.isEnabled());
        return response;
    }
}
