package com.example.exportsystem.repository;


import com.example.exportsystem.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface RoleRepository extends JpaRepository<Role,Long> {


    Optional<Role> findByName(String name);

}
