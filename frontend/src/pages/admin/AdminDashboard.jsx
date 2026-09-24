import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, ShieldCheck, FileText, KeyRound, ArrowUpRight, Activity } from "lucide-react";
import "../../components/dashboard.css";
import { useNavigate } from "react-router-dom";
import { getAdminDashboardSummary, getAuditLogs } from "../../api/adminApi";
import { ApiError } from "../../api/client";

const ROLE_META = {
    ADMIN: { label: "Admin", color: "var(--blue-600)", description: "Manages users and roles, reviews claims and audits system activity." },
    EXPORT_MANAGER: { label: "Export Manager", color: "var(--emerald-600)", description: "Processes orders and shipments, uploads documents and issues download tokens." },
    CLIENT: { label: "Client (Buyer)", color: "var(--amber-600)", description: "Tracks their own orders and invoices and unlocks documents with tokens." },
};

const ROLE_LABEL = { ADMIN: "Admin", EXPORT_MANAGER: "Export Manager", CLIENT: "Client" };

const ROLE_BADGE_STYLE = {
    ADMIN: { background: "var(--red-100)", color: "var(--red-800)" },
    EXPORT_MANAGER: { background: "var(--blue-100)", color: "var(--blue-800)" },
    CLIENT: { background: "var(--amber-100)", color: "var(--amber-800)" },
};

function errorMessage(err, fallback) {
    return err instanceof ApiError && err.message ? err.message : fallback;
}

function timeAgo(isoString) {
    if (!isoString) return "No logs yet";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Last log just now";
    if (minutes < 60) return `Last log ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Last log ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Last log ${days}d ago`;
}

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [summaryError, setSummaryError] = useState(null);

    const [recentLogs, setRecentLogs] = useState([]);
    const [logsError, setLogsError] = useState(null);
    const [logsLoading, setLogsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setSummary(await getAdminDashboardSummary());
                setSummaryError(null);
            } catch (err) {
                setSummaryError(errorMessage(err, "Couldn't load dashboard summary."));
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setLogsLoading(true);
            try {
                const data = await getAuditLogs({ page: 0, size: 4 });
                setRecentLogs(data.content);
                setLogsError(null);
            } catch (err) {
                setRecentLogs([]);
                setLogsError(errorMessage(err, "Couldn't load audit logs."));
            } finally {
                setLogsLoading(false);
            }
        })();
    }, []);

    const activeAccountsByRole = summary?.activeAccountsByRole ?? {};
    const rolesActive = Object.keys(activeAccountsByRole).length;

    const stats = [
        { title: "Total Users", value: Number(summary?.totalUsers ?? 0).toLocaleString(), subtitle: `${rolesActive} roles active`, icon: <Users size={24} /> },
        { title: "Active Tokens", value: Number(summary?.activeTokens ?? 0).toLocaleString(), subtitle: `${(summary?.activeTokenRate ?? 0).toFixed(1)}% of all tokens`, icon: <KeyRound size={24} /> },
        { title: "Audit Log Entries", value: Number(summary?.totalAuditLogs ?? 0).toLocaleString(), subtitle: timeAgo(summary?.lastAuditLogAt), icon: <FileText size={24} /> },
        { title: "Access Control", value: "100%", subtitle: "Role-based access enforced", icon: <ShieldCheck size={24} /> }
    ];

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Oversee users, security activity and platform-wide reporting.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="primary-action" onClick={() => navigate("/admin/users")} style={{ marginTop: 0, width: "auto" }}>
                        Manage Users
                    </button>
                    <button className="secondary-action" onClick={() => navigate("/admin/audit-logs")} style={{ marginTop: 0, width: "auto" }}>
                        View Audit Logs
                    </button>
                </div>
            </div>

            {summaryError && (
                <p style={{ color: "var(--red-600)", fontSize: "13px", marginTop: "10px" }}>{summaryError}</p>
            )}

            <div className="stats-grid">
                {stats.map((item, idx) => (
                    <div className="stat-card" key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {item.icon}
                            <Activity size={16} style={{ color: "var(--emerald-500)" }} />
                        </div>
                        <h3>{item.value}</h3>
                        <p style={{ fontWeight: 600, color: "var(--slate-800)", margin: 0 }}>{item.title}</p>
                        <small style={{ color: "var(--slate-500)" }}>{item.subtitle}</small>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2>Role Access Summary</h2>
                        <span style={{ fontSize: "12px", background: "var(--indigo-100)", color: "var(--indigo-800)", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>
                            RBAC Active
                        </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                        {Object.entries(ROLE_META).map(([roleKey, meta]) => (
                            <div key={roleKey} style={{ border: "1px solid var(--slate-200)", padding: "16px", borderRadius: "10px", background: "var(--slate-50)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "var(--slate-800)" }}>
                                    {roleKey === "ADMIN" ? <ShieldCheck size={18} color={meta.color} /> : <Users size={18} color={meta.color} />} {meta.label}
                                </div>
                                <p style={{ fontSize: "13px", color: "var(--slate-500)", margin: "8px 0" }}>{meta.description}</p>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: meta.color }}>
                                    {Number(activeAccountsByRole[roleKey] ?? 0).toLocaleString()} active accounts
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="panel">
                    <h2>Quick Links</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                        <button className="secondary-action" onClick={() => navigate("/admin/users")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 0 }}>
                            <span>User Management</span>
                            <ArrowUpRight size={16} />
                        </button>
                        <button className="secondary-action" onClick={() => navigate("/admin/audit-logs")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 0 }}>
                            <span>Audit & Security Logs</span>
                            <ArrowUpRight size={16} />
                        </button>
                        <button className="secondary-action" onClick={() => navigate("/admin/reports")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 0 }}>
                            <span>Reports & Analytics</span>
                            <ArrowUpRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h2>Recent Audit Logs</h2>
                    <button onClick={() => navigate("/admin/audit-logs")} style={{ background: "none", border: "none", color: "var(--blue-600)", fontWeight: 600, cursor: "pointer" }}>
                        View all logs &rarr;
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Log ID</th>
                            <th>User</th>
                            <th>Role</th>
                            <th>Action</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logsLoading ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", color: "var(--slate-400)", padding: "20px" }}>
                                    Loading recent logs…
                                </td>
                            </tr>
                        ) : logsError ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", color: "var(--slate-400)", padding: "20px" }}>
                                    {logsError}
                                </td>
                            </tr>
                        ) : recentLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", color: "var(--slate-400)", padding: "20px" }}>
                                    No audit logs yet.
                                </td>
                            </tr>
                        ) : (
                            recentLogs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ fontWeight: 600 }}>LOG-{log.id}</td>
                                    <td>{log.user || "—"}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            ...(ROLE_BADGE_STYLE[log.role] || { background: "var(--slate-100)", color: "var(--slate-600)" })
                                        }}>
                                            {ROLE_LABEL[log.role] || log.role || "—"}
                                        </span>
                                    </td>
                                    <td>{log.action}</td>
                                    <td style={{ color: "var(--slate-500)" }}>{new Date(log.timestamp).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
