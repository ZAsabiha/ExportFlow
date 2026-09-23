import { apiRequest, buildQuery } from "./client";

// Orders API
// Returns a page: { content, page, size, totalElements, totalPages }.
// Pass a larger `size` (e.g. 500) when the caller needs the full/near-full set for a
// dropdown or a dashboard stat rather than a browsable page.
export function getOrders({ page = 0, size } = {}) {
    return apiRequest(`/export-manager/orders${buildQuery({ page, size })}`);
}

export function getOrder(id) {
    return apiRequest(`/export-manager/orders/${id}`);
}

export function quoteOrder(id, { quotedPrice, quotedDeliveryDate, managerNote }) {
    return apiRequest(`/export-manager/orders/${id}/quote`, {
        method: "POST",
        body: { quotedPrice, quotedDeliveryDate, managerNote }
    });
}

export function declineOrder(id, reason) {
    return apiRequest(`/export-manager/orders/${id}/decline`, {
        method: "POST",
        body: { reason }
    });
}

export function advanceOrderStage(id, stage) {
    return apiRequest(`/export-manager/orders/${id}/stage?stage=${stage}`, {
        method: "PATCH"
    });
}

// Shipments API
export function getAllShipments({ page = 0, size } = {}) {
    return apiRequest(`/export-manager/shipments${buildQuery({ page, size })}`);
}

export function getShipmentsByOrder(orderId) {
    return apiRequest(`/export-manager/shipments/order/${orderId}`);
}

export function createShipment({ orderId, carrier, trackingNumber, originPort, destinationPort, estimatedArrival }) {
    return apiRequest("/export-manager/shipments", {
        method: "POST",
        body: { orderId, carrier, trackingNumber, originPort, destinationPort, estimatedArrival }
    });
}

// Invoices API
export function getAllInvoices({ page = 0, size } = {}) {
    return apiRequest(`/export-manager/invoices${buildQuery({ page, size })}`);
}

export function getInvoicesByOrder(orderId) {
    return apiRequest(`/export-manager/invoices/order/${orderId}`);
}

// Documents API
export function getAllDocuments({ page = 0, size } = {}) {
    return apiRequest(`/export-manager/documents${buildQuery({ page, size })}`);
}

export function getDocumentsByOrder(orderId) {
    return apiRequest(`/export-manager/documents/order/${orderId}`);
}

export function downloadDocumentBlob(id) {
    return apiRequest(`/export-manager/documents/${id}/download`, { method: "GET" }, { asBlob: true });
}


export function uploadDocument(orderId, documentType, file) {
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("documentType", documentType);
    formData.append("file", file);
    return apiRequest("/export-manager/documents/upload", {
        method: "POST",
        body: formData
    });
}

export function uploadDocumentsBatch(orderId, documentType, files) {
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("documentType", documentType);
    if (Array.isArray(files)) {
        files.forEach((file) => {
            formData.append("files", file);
        });
    }
    return apiRequest("/export-manager/documents/batch-upload", {
        method: "POST",
        body: formData
    });
}
// Tokens API
export function getAllTokens({ page = 0, size } = {}) {
    return apiRequest(`/export-manager/tokens${buildQuery({ page, size })}`);
}

export function getTokensByOrder(orderId) {
    return apiRequest(`/export-manager/tokens/order/${orderId}`);
}

export function generateToken({ orderId, buyerEmail, expiryDays }) {
    return apiRequest("/export-manager/tokens", {
        method: "POST",
        body: { orderId, buyerEmail, expiryDays }
    });
}

export function revokeToken(token) {
    return apiRequest(`/export-manager/tokens/${token}`, {
        method: "DELETE"
    });
}

// Multi-sheet workbook (Orders, Shipments, Invoices, Buyers, Document Compliance).
// Fetched as an authenticated blob rather than linked to directly - the endpoint requires
// the Bearer token, which a plain <a href> navigation never sends.
export function downloadExportReport() {
    return apiRequest(`/export-manager/reports/excel`, { method: "GET" }, { asBlob: true });
}

// Global search (TopNavbar) - matches across all orders/shipments/invoices.
export function globalSearch(q) {
    return apiRequest(`/export-manager/search${buildQuery({ q })}`);
}

// Notifications API
export function getNotifications({ page = 0, size } = {}) {
    return apiRequest(`/export-manager/notifications${buildQuery({ page, size })}`);
}

export function markNotificationRead(id) {
    return apiRequest(`/export-manager/notifications/${id}/read`, { method: "POST" });
}
