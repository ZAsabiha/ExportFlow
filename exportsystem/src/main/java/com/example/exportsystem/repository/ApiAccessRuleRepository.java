package com.example.exportsystem.repository;

import com.example.exportsystem.entity.ApiAccessRule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiAccessRuleRepository extends JpaRepository<ApiAccessRule, Long> {
}
