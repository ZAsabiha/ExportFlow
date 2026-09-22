package com.example.exportsystem.controller;

import com.example.exportsystem.common.PaginationDefaults;
import com.example.exportsystem.dto.PageResponse;
import com.example.exportsystem.dto.admin.AdminUserResponse;
import com.example.exportsystem.dto.admin.AuditLogResponse;
import com.example.exportsystem.dto.admin.UpdateUserPermissionsRequest;
import com.example.exportsystem.dto.admin.UpdateUserStatusRequest;
import com.example.exportsystem.entity.Permission;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.UserRepository;
import com.example.exportsystem.service.AdminService;
import com.example.exportsystem.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;


@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    public AdminController(AdminService adminService, AuditLogService auditLogService, UserRepository userRepository) {
        this.adminService = adminService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<AdminUserResponse>> listUsers(@RequestParam(defaultValue = "0") int page,
                                                                       @RequestParam(required = false) Integer size,
                                                                       @RequestParam(required = false) String search,
                                                                       @RequestParam(required = false) String role) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.USERS_PAGE_SIZE,
                Sort.by(Sort.Direction.ASC, "username"));
        return ResponseEntity.ok(PageResponse.of(adminService.listUsers(search, role, pageable)));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserResponse> setUserStatus(Authentication authentication,
                                                              @PathVariable Long id,
                                                              @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminService.setUserEnabled(currentUser(authentication), id, request.getEnabled()));
    }

    @PutMapping("/users/{id}/permissions")
    public ResponseEntity<AdminUserResponse> setUserPermissions(Authentication authentication,
                                                                   @PathVariable Long id,
                                                                   @Valid @RequestBody UpdateUserPermissionsRequest request) {
        return ResponseEntity.ok(adminService.setUserPermissions(currentUser(authentication), id, request.getPermissions()));
    }

    // Lets the frontend render the permission checklist without hardcoding the enum values.
    @GetMapping("/permissions")
    public ResponseEntity<List<String>> listAvailablePermissions() {
        return ResponseEntity.ok(Arrays.stream(Permission.values()).map(Enum::name).toList());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<PageResponse<AuditLogResponse>> listAuditLogs(@RequestParam(defaultValue = "0") int page,
                                                                          @RequestParam(required = false) Integer size,
                                                                          @RequestParam(required = false) String search,
                                                                          @RequestParam(required = false) String action) {
        Pageable pageable = PaginationDefaults.pageable(page, size, PaginationDefaults.AUDIT_LOGS_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(auditLogService.list(search, action, pageable)));
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + authentication.getName()));
    }
}
