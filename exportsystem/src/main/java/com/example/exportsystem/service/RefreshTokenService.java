package com.example.exportsystem.service;

import com.example.exportsystem.entity.RefreshToken;
import com.example.exportsystem.entity.User;
import com.example.exportsystem.repository.RefreshTokenRepository;
import com.example.exportsystem.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    private final long refreshTokenDuration = 1000L * 60 * 60 * 24 * 7; // 7 days

    public RefreshToken createRefreshToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Delete existing refresh tokens for the user to keep single active refresh token
        if (user.getId() != null) {
            refreshTokenRepository.deleteByUserId(user.getId());
        }

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenDuration))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(readOnly = true)
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
    }

    public RefreshToken verifyExpiration(RefreshToken refreshToken) {
        if (refreshToken.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expired. Please make a new login request.");
        }
        return refreshToken;
    }

    public RefreshToken rotateRefreshToken(String oldTokenStr) {
        RefreshToken oldToken = findByToken(oldTokenStr);
        verifyExpiration(oldToken);
        User user = oldToken.getUser();
        refreshTokenRepository.delete(oldToken);
        return createRefreshToken(user.getEmail());
    }

    public void revokeToken(String tokenStr) {
        if (tokenStr != null && !tokenStr.isBlank()) {
            refreshTokenRepository.findByToken(tokenStr).ifPresent(refreshTokenRepository::delete);
        }
    }

    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}