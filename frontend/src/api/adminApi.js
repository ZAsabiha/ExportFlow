import { apiRequest, buildQuery } from "./client";

// Returns a page: { content, page, size, totalElements, totalPages }.
export function getUsers({ page = 0, size, search, role } = {}) {
    return apiRequest(`/admin/users${buildQuery({ page, size, search, role })}`);
}

export function getAuditLogs({ page = 0, size, search, action } = {}) {
    return apiRequest(`/admin/audit-logs${buildQuery({ page, size, search, action })}`);
}

export function setUserStatus(id, enabled) {
    return apiRequest(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: { enabled },
    });
}

export function setUserPermissions(id, permissions) {
    return apiRequest(`/admin/users/${id}/permissions`, {
        method: "PUT",
        body: { permissions },
    });
}

export function getAvailablePermissions() {
    return apiRequest("/admin/permissions");
}

// Reports API - both the paginated table below and the PDF download read from the same
// admin_report_view database view on the backend (see AdminReportServiceImpl).
export function getAdminReports({ page = 0, size, search, stage, paymentStatus } = {}) {
    return apiRequest(`/admin/reports${buildQuery({ page, size, search, stage, paymentStatus })}`);
}

export function getAdminReportSummary() {
    return apiRequest("/admin/reports/summary");
}

// Fetched as an authenticated blob rather than linked to directly - the endpoint requires
// the Bearer token, which a plain <a href> navigation never sends.
export function downloadAdminReportPdf() {
    return apiRequest("/admin/reports/pdf", { method: "GET" }, { asBlob: true });
}
