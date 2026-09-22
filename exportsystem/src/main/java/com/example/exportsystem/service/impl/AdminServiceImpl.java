package com.example.exportsystem.service.impl;

import com.example.exportsystem.dto.admin.AdminUserResponse;
import com.example.exportsystem.entity.Permission;
import com.example.exportsystem.entity.Role;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.AdminService;
import com.example.exportsystem.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public AdminServiceImpl(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
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
    @Transactional
    public AdminUserResponse setUserPermissions(User actingAdmin, Long userId, Set<String> permissionNames) {
        User user = findOrThrow(userId);
        Set<Permission> permissions = new HashSet<>();
        for (String name : permissionNames) {
            try {
                permissions.add(Permission.valueOf(name));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Unknown permission: " + name);
            }
        }
        user.setPermissions(permissions);
        User saved = userRepository.save(user);
        auditLogService.log(actingAdmin.getEmail(), "ADMIN", "Permissions Updated",
                "Set permissions for " + saved.getEmail() + " to " + permissions);
        return toResponse(saved);
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
        response.setPermissions(user.getPermissions().stream().map(Enum::name).collect(Collectors.toSet()));
        response.setEnabled(user.isEnabled());
        return response;
    }
}
