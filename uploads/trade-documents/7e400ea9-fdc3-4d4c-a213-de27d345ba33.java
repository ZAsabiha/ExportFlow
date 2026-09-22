package com.example.exportsystem.service;

import com.example.exportsystem.dto.*;
import com.example.exportsystem.entity.*;
import com.example.exportsystem.repository.*;
import com.example.exportsystem.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>())
                .build();

        String targetRoleName = resolveRoleName(request.getRole());

        Role role = roleRepository.findByName(targetRoleName)
                .orElseGet(() -> roleRepository.save(Role.builder().name(targetRoleName).build()));

        user.getRoles().add(role);
        userRepository.save(user);
    }

    private String resolveRoleName(String rawRole) {
        if (rawRole == null || rawRole.trim().isEmpty()) {
            return "CLIENT";
        }
        String normalized = rawRole.toUpperCase().replaceAll("[^A-Z]", "");
        if (normalized.contains("ADMIN")) {
            return "ADMIN";
        }
        if (normalized.contains("MANAGER")) {
            return "EXPORT_MANAGER";
        }
        return "CLIENT";
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getEmail());

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                toRoleNames(user)
        );
    }

    public AuthResponse refreshToken(String tokenString) {
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(tokenString);
        User user = newRefreshToken.getUser();
        String accessToken = jwtService.generateToken(user);
        return new AuthResponse(
                accessToken,
                newRefreshToken.getToken(),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                toRoleNames(user)
        );
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (request == null || request.getRefreshToken() == null) {
            throw new RuntimeException("Refresh token is required");
        }
        return refreshToken(request.getRefreshToken());
    }

    public void revokeRefreshToken(String tokenString) {
        refreshTokenService.revokeToken(tokenString);
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), toRoleNames(user));
    }

    private Set<String> toRoleNames(User user) {
        return user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
    }
}
