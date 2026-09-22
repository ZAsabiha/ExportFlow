package com.example.exportsystem.service;

import com.example.exportsystem.dto.token.GenerateTokenRequest;
import com.example.exportsystem.dto.token.TokenResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TokenService {
    TokenResponse generateToken(GenerateTokenRequest request);
    List<TokenResponse> listByOrder(Long orderId);
    Page<TokenResponse> listAll(Pageable pageable);
    void revoke(String token);
}
