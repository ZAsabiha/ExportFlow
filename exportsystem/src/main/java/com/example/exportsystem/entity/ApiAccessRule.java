package com.example.exportsystem.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "api_access_rules")
public class ApiAccessRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "path_pattern", nullable = false)
    private String pathPattern;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    @Column(name = "permission")
    private String permission;

    public ApiAccessRule() {}

    public Long getId() {
        return id;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public String getPathPattern() {
        return pathPattern;
    }

    public String getRoleName() {
        return roleName;
    }

    public String getPermission() {
        return permission;
    }
}
