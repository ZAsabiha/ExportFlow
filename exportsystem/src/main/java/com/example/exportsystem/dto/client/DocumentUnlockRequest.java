package com.example.exportsystem.dto.client;

import jakarta.validation.constraints.NotBlank;

public class DocumentUnlockRequest {

    @NotBlank
    private String token;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
