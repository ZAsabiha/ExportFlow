import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Search, Filter } from "lucide-react";
import { getAuditLogs } from "../../api/adminApi";
import { ApiError } from "../../api/client";
import "../../components/dashboard.css";

const ROLE_BADGE_STYLES = {
    ADMIN: { background: "var(--red-100)", color: "var(--red-800)" },
    EXPORT_MANAGER: { background: "var(--blue-100)", color: "var(--blue-800)" },
    CLIENT: { background: "var(--amber-100)", color: "var(--amber-800)" },
};

// Matches the action labels AuditLogServiceImpl callers actually log - see backend.
const ACTIONS = [
    "Login", "Order Requested", "Quote Sent", "Order Declined", "Quote Accepted",
    "Quote Rejected", "Token Generated", "Documents Unlocked", "User Activated",
    "User Deactivated", "Permissions Updated",
];

function errorMessage(err, fallback) {
    return err instanceof ApiError && err.message ? err.message : fallback;
}

export default function AuditLogs() {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState(""); // debounced value actually sent to the server
    const [actionFilter, setActionFilter] = useState("ALL");

    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 });

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Debounce free-text search so we don't fire a request on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(0);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getAuditLogs({
                page,
                size: pageSize,
                search: search || undefined,
                action: actionFilter === "ALL" ? undefined : actionFilter,
            });
            setLogs(data.content);
            setPageInfo({ totalElements: data.totalElements, totalPages: data.totalPages });
        } catch (err) {
            setLogs([]);
            setLoadError(errorMessage(err, "Couldn't load audit logs. Please try again."));
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, actionFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const hasActiveFilters = search !== "" || actionFilter !== "ALL";

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setActionFilter("ALL");
        setPage(0);
    };

    return (
        <DashboardLayout>
            <div>
                <h1 className="page-title">Audit Logs</h1>
                <p className="page-subtitle">Sign-ins, administrative actions and order, document and token activity across the platform.</p>
            </div>

            <div className="panel" style={{ marginTop: "25px", padding: "20px" }}>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="search-box" style={{ flex: 1, minWidth: "280px" }}>
                        <Search size={18} color="var(--slate-500)" />
                        <input
                            type="text"
                            placeholder="Search logs by user or activity details..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Filter size={18} color="var(--slate-500)" />
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value);
                                setPage(0);
                            }}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--slate-300)", outline: "none" }}
                        >
                            <option value="ALL">All Actions</option>
                            {ACTIONS.map((action) => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "20px" }}>
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Role</th>
                            <th>Action</th>
                            <th>Details</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", color: "var(--slate-400)", padding: "20px" }}>
                                    Loading logs...
                                </td>
                            </tr>
                        ) : loadError ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", color: "var(--slate-400)", padding: "20px" }}>
                                    <p>{loadError}</p>
                                    <button
                                        onClick={fetchLogs}
                                        style={{ marginTop: "8px", background: "none", border: "none", color: "var(--blue-600)", cursor: "pointer", fontSize: "13px" }}
                                    >
                                        Retry
                                    </button>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", color: "var(--slate-400)", padding: "20px" }}>
                                    {hasActiveFilters ? (
                                        <>
                                            No logs match your search/filter.{" "}
                                            <button
                                                onClick={clearFilters}
                                                style={{ background: "none", border: "none", color: "var(--blue-600)", cursor: "pointer", fontSize: "13px" }}
                                            >
                                                Clear filters
                                            </button>
                                        </>
                                    ) : (
                                        "No audit log entries yet."
                                    )}
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ fontSize: "13px", color: "var(--slate-500)" }}>{log.timestamp?.slice(0, 19).replace("T", " ")}</td>
                                    <td>{log.user || "—"}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            ...(ROLE_BADGE_STYLES[log.role] || { background: "var(--slate-100)", color: "var(--slate-600)" }),
                                        }}>
                                            {log.role}
                                        </span>
                                    </td>
                                    <td><span style={{ fontWeight: 600, color: "var(--slate-700)" }}>{log.action}</span></td>
                                    <td style={{ fontSize: "13px", color: "var(--slate-600)" }}>{log.details}</td>
                                    <td style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--slate-500)" }}>{log.ip || "—"}</td>
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
                    pageSizeOptions={[10, 20, 50]}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setPage(0);
                    }}
                    onPageChange={setPage}
                />
            </div>
        </DashboardLayout>
    );
}
