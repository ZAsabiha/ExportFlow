import { apiRequest, API_BASE_URL, buildQuery, openEventStream } from "./client";

export function getDashboard() {
    return apiRequest("/client/dashboard");
}


export function globalSearch(q) {
    return apiRequest(`/client/search${buildQuery({ q })}`);
}


export function getOrders({ page = 0, size } = {}) {
    return apiRequest(`/client/orders${buildQuery({ page, size })}`);
}

export function requestOrder({ productName, quantity, destination, targetPrice, neededByDate, itemsDescription }) {
    return apiRequest("/client/orders", {
        method: "POST",
        body: { productName, quantity, destination, targetPrice, neededByDate, itemsDescription }
    });
}

export function acceptQuote(id) {
    return apiRequest(`/client/orders/${id}/accept`, { method: "POST" });
}

export function rejectQuote(id) {
    return apiRequest(`/client/orders/${id}/reject`, { method: "POST" });
}

export function getNotifications({ page = 0, size } = {}) {
    return apiRequest(`/client/notifications${buildQuery({ page, size })}`);
}

export function markNotificationRead(id) {
    return apiRequest(`/client/notifications/${id}/read`, { method: "POST" });
}

export function streamNotifications(handlers) {
    return openEventStream("/client/notifications/stream", handlers);
}

export function getShipments({ page = 0, size } = {}) {
    return apiRequest(`/client/shipments${buildQuery({ page, size })}`);
}

export function getInvoices({ page = 0, size } = {}) {
    return apiRequest(`/client/invoices${buildQuery({ page, size })}`);
}

export function downloadInvoicePdfBlob(id) {
    return apiRequest(`/client/invoices/${id}/pdf`, { method: "GET" }, { asBlob: true });
}

export function unlockDocuments(token) {
    return apiRequest("/client/documents/unlock", {
        method: "POST",
        body: { token }
    });
}

export function downloadDocumentBlob(id, token) {
    const query = new URLSearchParams({ token });
    return apiRequest(`/client/documents/${id}/download?${query}`, { method: "GET" }, { asBlob: true });
}

export function getDocumentDownloadUrl(id, token) {
    const query = new URLSearchParams({ token });
    return `${API_BASE_URL}/client/documents/${id}/download?${query}`;
}

// Claims: a client's complaint against one of their own orders, optionally with a proof
// attachment. Admin-only to review/resolve - see adminApi.js's claim functions.
export function fileClaim({ orderId, message, requestedDocuments = [], proofFile }) {
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("message", message);
    requestedDocuments.forEach((doc) => formData.append("requestedDocuments", doc));
    if (proofFile) {
        formData.append("proofFile", proofFile);
    }
    return apiRequest("/client/claims", {
        method: "POST",
        body: formData
    });
}

export function getMyClaims({ page = 0, size } = {}) {
    return apiRequest(`/client/claims${buildQuery({ page, size })}`);
}

export function getMyClaim(id) {
    return apiRequest(`/client/claims/${id}`);
}

export function downloadMyClaimProofBlob(id) {
    return apiRequest(`/client/claims/${id}/proof/download`, { method: "GET" }, { asBlob: true });
}