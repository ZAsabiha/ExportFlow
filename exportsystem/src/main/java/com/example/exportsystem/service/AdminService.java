package com.example.exportsystem.service;

import com.example.exportsystem.dto.admin.AdminUserResponse;
import com.example.exportsystem.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Set;

// Backs the Admin Portal's user-management screen: listing every account, activating/
// deactivating them, and assigning the fine-grained Permission set each user carries on top
// of their role. Every endpoint that reaches this is already locked to ROLE_ADMIN (see
// AdminController's class-level @PreAuthorize).
public interface AdminService {

    // search matches username/email (case-insensitive, substring); role filters to an exact
    // role name. Either may be null/blank to skip that filter.
    Page<AdminUserResponse> listUsers(String search, String role, Pageable pageable);

    AdminUserResponse setUserEnabled(User actingAdmin, Long userId, boolean enabled);

    AdminUserResponse setUserPermissions(User actingAdmin, Long userId, Set<String> permissionNames);
}
