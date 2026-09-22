package com.example.exportsystem.dto.admin;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public class UpdateUserPermissionsRequest {

    // The full desired permission set for the user (replaces whatever they had, same shape
    // as PUT semantics elsewhere in this API) - not a delta/add-remove list.
    @NotNull
    private Set<String> permissions;

    public Set<String> getPermissions() { return permissions; }
    public void setPermissions(Set<String> permissions) { this.permissions = permissions; }
}
