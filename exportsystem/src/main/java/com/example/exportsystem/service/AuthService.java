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
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.auditLogService = auditLogService;
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

        // The CLIENT role starts with full access to its portal by default; an admin can revoke
        // it (or grant more) later from the Roles page - every CLIENT shares the same set, since
        // permissions are configured per-role, not per-user.
        Role role = roleRepository.findByName(targetRoleName)
                .orElseGet(() -> roleRepository.save("CLIENT".equals(targetRoleName)
                        ? Role.builder().name(targetRoleName).permissions(Set.of(Permission.VIEW_SHIPMENTS)).build()
                        : Role.builder().name(targetRoleName).build()));

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

        if (!user.isEnabled()) {
            throw new RuntimeException("This account has been deactivated. Contact an administrator.");
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getEmail());

        auditLogService.log(user.getEmail(), primaryRoleName(user), "Login", "Signed in successfully");

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                toRoleNames(user),
                toPermissionNames(user)
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
                toRoleNames(user),
                toPermissionNames(user)
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
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), toRoleNames(user), toPermissionNames(user));
    }

    private Set<String> toRoleNames(User user) {
        return user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
    }

    private Set<String> toPermissionNames(User user) {
        return user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Enum::name)
                .collect(Collectors.toSet());
    }

    private String primaryRoleName(User user) {
        Set<String> names = toRoleNames(user);
        if (names.contains("ADMIN")) return "ADMIN";
        if (names.contains("EXPORT_MANAGER")) return "EXPORT_MANAGER";
        if (names.contains("CLIENT")) return "CLIENT";
        return names.stream().findFirst().orElse("UNKNOWN");
    }
}
