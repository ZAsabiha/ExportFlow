import { apiRequest, buildQuery } from "./client";

// Returns a page: { content, page, size, totalElements, totalPages }.
export function getUsers({ page = 0, size, search, role } = {}) {
    return apiRequest(`/admin/users${buildQuery({ page, size, search, role })}`);
}

export function getAuditLogs({ page = 0, size, search, action } = {}) {
    return apiRequest(`/admin/audit-logs${buildQuery({ page, size, search, action })}`);
}

export function getAdminDashboardSummary() {
    return apiRequest("/admin/dashboard-summary");
}

export function setUserStatus(id, enabled) {
    return apiRequest(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: { enabled },
    });
}

// Global search (TopNavbar) - matches across all orders/shipments/invoices/users.
export function globalSearch(q) {
    return apiRequest(`/admin/search${buildQuery({ q })}`);
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

// Claims: client complaints, Admin-only. Resolving a claim can also government-verify the
// order's documents and set its Export Manager document-upload deadline in one call.
export function getClaims({ page = 0, size, status } = {}) {
    return apiRequest(`/admin/claims${buildQuery({ page, size, status })}`);
}

export function getClaim(id) {
    return apiRequest(`/admin/claims/${id}`);
}

export function downloadClaimProofBlob(id) {
    return apiRequest(`/admin/claims/${id}/proof/download`, { method: "GET" }, { asBlob: true });
}

export function resolveClaim(id, { adminResponse, markGovernmentVerified, documentDeadline, deadlineNote }) {
    return apiRequest(`/admin/claims/${id}/resolve`, {
        method: "POST",
        body: { adminResponse, markGovernmentVerified, documentDeadline, deadlineNote }
    });
}

export function rejectClaim(id, { adminResponse }) {
    return apiRequest(`/admin/claims/${id}/reject`, {
        method: "POST",
        body: { adminResponse }
    });
}
