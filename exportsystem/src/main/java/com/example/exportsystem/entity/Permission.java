package com.example.exportsystem.entity;

// Fine-grained capabilities an admin can grant to (or revoke from) an individual user, on
// top of their role. Distinct from Role: a role decides which portal/controllers a user can
// reach at all (@PreAuthorize("hasRole(...)")), while a Permission is an admin-assignable
// per-user flag exposed to the frontend (and available as a Spring Security authority) for
// finer capability checks than the role alone provides.
public enum Permission {
    MANAGE_ORDERS,
    MANAGE_SHIPMENTS,
    MANAGE_DOCUMENTS,
    MANAGE_INVOICES,
    ISSUE_DOWNLOAD_TOKENS,
    VIEW_REPORTS,

    // Client-portal viewing permissions. Granted by default at registration (see
    // AuthService.register) so a client's access is unrestricted out of the box - an admin
    // revokes one of these on a specific client to take away just that page.
    VIEW_SHIPMENTS
}