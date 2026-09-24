import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Search, Filter, Download, DollarSign, Package, Truck, Clock3 } from "lucide-react";
import { getAdminReports, getAdminReportSummary, downloadAdminReportPdf } from "../../api/adminApi";
import { downloadBlob } from "../../utils/blobView";
import { ApiError } from "../../api/client";
import "../../components/dashboard.css";

const STAGES = ["CREATED", "APPROVED", "DOCUMENTS", "PAID", "SHIPMENT", "COMPLETED"];
const PAYMENT_STATUSES = ["PENDING", "PAID"];

const REQUEST_STATUS_STYLE = {
    PENDING: { background: "#fef3c7", color: "#92400e" },
    QUOTED: { background: "#dbeafe", color: "#1e40af" },
    ACCEPTED: { background: "#dcfce7", color: "#15803d" },
    REJECTED: { background: "#fee2e2", color: "#991b1b" },
};

const PAYMENT_STATUS_STYLE = {
    PENDING: { background: "#fef3c7", color: "#92400e" },
    PAID: { background: "#dcfce7", color: "#15803d" },
};

const SHIPMENT_STATUS_STYLE = {
    PENDING: { background: "#f1f5f9", color: "#475569" },
    IN_TRANSIT: { background: "#dbeafe", color: "#1e40af" },
    DELIVERED: { background: "#dcfce7", color: "#15803d" },
    DELAYED: { background: "#fee2e2", color: "#991b1b" },
};

function errorMessage(err, fallback) {
    return err instanceof ApiError && err.message ? err.message : fallback;
}

function badge(value, styleMap) {
    if (!value) return "—";
    const style = styleMap[value] || { background: "#f1f5f9", color: "#475569" };
    return (
        <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, ...style }}>
            {value.replace(/_/g, " ")}
        </span>
    );
}

export default function SystemReports() {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState("ALL");
    const [paymentFilter, setPaymentFilter] = useState("ALL");

    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 });

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [summary, setSummary] = useState(null);
    const [summaryError, setSummaryError] = useState(null);

    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(0);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getAdminReports({
                page,
                size: pageSize,
                search: search || undefined,
                stage: stageFilter === "ALL" ? undefined : stageFilter,
                paymentStatus: paymentFilter === "ALL" ? undefined : paymentFilter,
            });
            setRows(data.content);
            setPageInfo({ totalElements: data.totalElements, totalPages: data.totalPages });
        } catch (err) {
            setRows([]);
            setLoadError(errorMessage(err, "Couldn't load the report. Please try again."));
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, stageFilter, paymentFilter]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    useEffect(() => {
        (async () => {
            try {
                setSummary(await getAdminReportSummary());
                setSummaryError(null);
            } catch (err) {
                setSummaryError(errorMessage(err, "Couldn't load report summary."));
            }
        })();
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        setDownloadError(null);
        try {
            await downloadBlob(() => downloadAdminReportPdf(), "admin-system-report.pdf");
        } catch (err) {
            setDownloadError(errorMessage(err, "Failed to download the report"));
        } finally {
            setDownloading(false);
        }
    };

    const hasActiveFilters = search !== "" || stageFilter !== "ALL" || paymentFilter !== "ALL";

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setStageFilter("ALL");
        setPaymentFilter("ALL");
        setPage(0);
    };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">Export performance, volume breakdown and financial summaries across the platform.</p>
                </div>
                <div>
                    <button
                        className="primary-action"
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <Download size={18} />
                        {downloading ? "Preparing PDF..." : "Download Full Report (PDF)"}
                    </button>
                    {downloadError && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px", textAlign: "right" }}>{downloadError}</p>}
                </div>
            </div>

            {summaryError && (
                <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{summaryError}</p>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <DollarSign size={24} color="#10b981" />
                    </div>
                    <h3>${Number(summary?.totalExportValue ?? 0).toLocaleString()}</h3>
                    <p style={{ fontWeight: 600, margin: 0 }}>Total Export Value</p>
                </div>

                <div className="stat-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Package size={24} color="#3b82f6" />
                        <span style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 700 }}>{Number(summary?.totalOrders ?? 0).toLocaleString()} Orders</span>
                    </div>
                    <h3>{Number(summary?.exportedVolume ?? 0).toLocaleString()} units</h3>
                    <p style={{ fontWeight: 600, margin: 0 }}>Exported Volume</p>
                </div>

                <div className="stat-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Truck size={24} color="#8b5cf6" />
                    </div>
                    <h3>{Number(summary?.activeShipments ?? 0).toLocaleString()}</h3>
                    <p style={{ fontWeight: 600, margin: 0 }}>Active Shipments</p>
                </div>

                <div className="stat-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Clock3 size={24} color="#f59e0b" />
                        <span style={{ color: "#f59e0b", fontSize: "12px", fontWeight: 700 }}>{Number(summary?.pendingRequests ?? 0).toLocaleString()} pending</span>
                    </div>
                    <h3>{(summary?.onTimeDeliveryRate ?? 100).toFixed(1)}%</h3>
                    <p style={{ fontWeight: 600, margin: 0 }}>On-Time Delivery Rate</p>
                </div>
            </div>

            <div className="panel" style={{ marginTop: "25px", padding: "20px" }}>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="search-box" style={{ flex: 1, minWidth: "280px" }}>
                        <Search size={18} color="#64748b" />
                        <input
                            type="text"
                            placeholder="Search by order code, buyer, product, or client..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <Filter size={18} color="#64748b" />
                        <select
                            value={stageFilter}
                            onChange={(e) => { setStageFilter(e.target.value); setPage(0); }}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                        >
                            <option value="ALL">All Stages</option>
                            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            value={paymentFilter}
                            onChange={(e) => { setPaymentFilter(e.target.value); setPage(0); }}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                        >
                            <option value="ALL">All Payment Status</option>
                            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "20px" }}>
                <table>
                    <thead>
                        <tr>
                            <th>Order Code</th>
                            <th>Buyer</th>
                            <th>Created By</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Request</th>
                            <th>Stage</th>
                            <th>Payment</th>
                            <th>Invoice</th>
                            <th>Shipment</th>
                            <th>ETA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={11} style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                    Loading report...
                                </td>
                            </tr>
                        ) : loadError ? (
                            <tr>
                                <td colSpan={11} style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                    <p>{loadError}</p>
                                    <button
                                        onClick={fetchRows}
                                        style={{ marginTop: "8px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "13px" }}
                                    >
                                        Retry
                                    </button>
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={11} style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                    {hasActiveFilters ? (
                                        <>
                                            No orders match your search/filter.{" "}
                                            <button
                                                onClick={clearFilters}
                                                style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "13px" }}
                                            >
                                                Clear filters
                                            </button>
                                        </>
                                    ) : (
                                        "No orders yet."
                                    )}
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.orderId}>
                                    <td style={{ fontWeight: 600, color: "#334155" }}>{r.orderCode}</td>
                                    <td>{r.buyerName}</td>
                                    <td style={{ fontSize: "13px", color: "#64748b" }}>{r.createdByUsername || "—"}</td>
                                    <td>{r.productName}</td>
                                    <td style={{ fontWeight: 700, color: "#0f766e" }}>${Number(r.orderAmount || 0).toLocaleString()}</td>
                                    <td>{badge(r.requestStatus, REQUEST_STATUS_STYLE)}</td>
                                    <td>{r.orderStage}</td>
                                    <td>{badge(r.paymentStatus, PAYMENT_STATUS_STYLE)}</td>
                                    <td style={{ fontSize: "13px", color: "#64748b" }}>{r.invoiceStatus || "—"}</td>
                                    <td>{badge(r.shipmentStatus, SHIPMENT_STATUS_STYLE)}</td>
                                    <td style={{ fontSize: "13px", color: "#64748b" }}>{r.shipmentEstimatedArrival || "—"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <Pagination
                    page={page}
                    size={pageSize}
                    totalElements={pageInfo.totalElements}
                    totalPages={pageInfo.totalPages}
                    pageSizeOptions={[20, 50, 100]}
                    onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                    onPageChange={setPage}
                />
            </div>
        </DashboardLayout>
    );
}
