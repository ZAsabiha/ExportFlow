package com.example.exportsystem.dto.admin;

import jakarta.validation.constraints.NotBlank;

public class RejectClaimRequest {

    @NotBlank
    private String adminResponse;

    public String getAdminResponse() { return adminResponse; }
    public void setAdminResponse(String adminResponse) { this.adminResponse = adminResponse; }
}
