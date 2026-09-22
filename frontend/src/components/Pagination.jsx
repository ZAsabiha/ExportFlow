import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Shared pager for every paginated list view (orders, documents, invoices,
// shipments, tokens, users, audit logs...).
// Expects: { page, size, totalElements, totalPages, onPageChange, pageSizeOptions, onPageSizeChange }.
export default function Pagination({
    page = 0,
    size = 10,
    totalElements = 0,
    totalPages = 0,
    onPageChange,
    pageSizeOptions,
    onPageSizeChange
}) {
    if (totalElements === 0) return null;

    const safeTotalPages = Math.max(totalPages, 1);
    const canPrev = page > 0;
    const canNext = page < safeTotalPages - 1;
    const from = Math.min(page * size + 1, totalElements);
    const to = Math.min((page + 1) * size, totalElements);

    // Build page buttons window
    const getPageNumbers = () => {
        if (safeTotalPages <= 7) {
            return Array.from({ length: safeTotalPages }, (_, i) => i);
        }
        const pages = [];
        const left = Math.max(1, page - 1);
        const right = Math.min(safeTotalPages - 2, page + 1);

        pages.push(0);
        if (left > 1) pages.push("...");
        for (let i = left; i <= right; i++) {
            pages.push(i);
        }
        if (right < safeTotalPages - 2) pages.push("...");
        pages.push(safeTotalPages - 1);
        return pages;
    };

    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "12px", padding: "14px 4px 4px"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Showing <strong style={{ color: "#334155" }}>{from}–{to}</strong> of <strong style={{ color: "#334155" }}>{totalElements}</strong>
                </span>

                {pageSizeOptions && onPageSizeChange && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>Per page:</span>
                        <select
                            value={size}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "white",
                                fontSize: "13px",
                                color: "#334155",
                                cursor: "pointer",
                                outline: "none"
                            }}
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {safeTotalPages > 1 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                        type="button"
                        onClick={() => canPrev && onPageChange && onPageChange(page - 1)}
                        disabled={!canPrev}
                        style={navButtonStyle(canPrev)}
                        aria-label="Previous page"
                        title="Previous page"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {getPageNumbers().map((p, idx) => {
                        if (p === "...") {
                            return (
                                <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "#94a3b8", fontSize: "13px" }}>
                                    ...
                                </span>
                            );
                        }
                        const isCurrent = p === page;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange && onPageChange(p)}
                                style={pageNumberButtonStyle(isCurrent)}
                                aria-label={`Page ${p + 1}`}
                                aria-current={isCurrent ? "page" : undefined}
                            >
                                {p + 1}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => canNext && onPageChange && onPageChange(page + 1)}
                        disabled={!canNext}
                        style={navButtonStyle(canNext)}
                        aria-label="Next page"
                        title="Next page"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            ) : (
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                    Page 1 of 1
                </span>
            )}
        </div>
    );
}

function navButtonStyle(enabled) {
    return {
        padding: "6px 10px",
        borderRadius: "6px",
        border: "1px solid #cbd5e1",
        background: enabled ? "white" : "#f1f5f9",
        color: enabled ? "#334155" : "#94a3b8",
        cursor: enabled ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        transition: "all 0.15s ease"
    };
}

function pageNumberButtonStyle(isCurrent) {
    return {
        minWidth: "32px",
        height: "32px",
        padding: "0 6px",
        borderRadius: "6px",
        border: isCurrent ? "1px solid #2563eb" : "1px solid #cbd5e1",
        background: isCurrent ? "#2563eb" : "white",
        color: isCurrent ? "#ffffff" : "#334155",
        cursor: isCurrent ? "default" : "pointer",
        fontSize: "13px",
        fontWeight: isCurrent ? 700 : 500,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease"
    };
}

