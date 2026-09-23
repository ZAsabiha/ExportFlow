package com.example.exportsystem.service;

import com.example.exportsystem.dto.admin.AdminDashboardSummary;
import com.example.exportsystem.dto.admin.AdminUserResponse;
import com.example.exportsystem.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface AdminService {

   
    Page<AdminUserResponse> listUsers(String search, String role, Pageable pageable);

    AdminUserResponse setUserEnabled(User actingAdmin, Long userId, boolean enabled);

  
    AdminDashboardSummary getDashboardSummary();
}
