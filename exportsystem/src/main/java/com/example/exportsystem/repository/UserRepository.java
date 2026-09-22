package com.example.exportsystem.repository;

import com.example.exportsystem.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Backs the Admin Portal's user list: search matches username/email, role filters by an
    // exact role name. Both are optional (pass null to skip). DISTINCT avoids duplicate rows
    // for a user matching the role filter through more than one join row.
    @Query("""
            SELECT DISTINCT u FROM User u LEFT JOIN u.roles r
            WHERE (CAST(:search AS string) IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (CAST(:role AS string) IS NULL OR r.name = CAST(:role AS string))
            """)
    Page<User> search(@Param("search") String search, @Param("role") String role, Pageable pageable);
}