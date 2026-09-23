import { apiRequest, API_BASE_URL, buildQuery } from "./client";

export function getDashboard() {
    return apiRequest("/client/dashboard");
}

// Global search (TopNavbar) - scoped to the logged-in buyer's own orders/shipments/invoices.
export function globalSearch(q) {
    return apiRequest(`/client/search${buildQuery({ q })}`);
}

// Returns a page: { content, page, size, totalElements, totalPages }.
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