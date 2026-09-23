package com.example.exportsystem.repository;

import com.example.exportsystem.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("""
            SELECT DISTINCT u FROM User u LEFT JOIN u.roles r
            WHERE (CAST(:search AS string) IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (CAST(:role AS string) IS NULL OR r.name = CAST(:role AS string))
            """)
    Page<User> search(@Param("search") String search, @Param("role") String role, Pageable pageable);

    // Resolves recipient emails for a role-wide notification fan-out (e.g. all Export
    // Managers, when a document deadline is set or approaching).
    List<User> findDistinctByRoles_Name(String roleName);

    // Powers the Admin Dashboard's "Role Access Summary" panel: enabled-user count per role.
    // `enabled` is a nullable Boolean (see User.isEnabled()) where NULL means enabled.
    @Query("""
            SELECT r.name, COUNT(DISTINCT u) FROM User u JOIN u.roles r
            WHERE u.enabled = true OR u.enabled IS NULL
            GROUP BY r.name
            """)
    List<Object[]> countEnabledUsersByRole();
}