import React from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, ShieldCheck, FileText, KeyRound, ArrowUpRight, Activity } from "lucide-react";
import "../../components/dashboard.css";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const stats = [
        { title: "Total Users", value: "42", subtitle: "3 Roles Active", icon: <Users size={24} /> },
        { title: "Active Tokens", value: "128", subtitle: "99.4% Verified", icon: <KeyRound size={24} /> },
        { title: "System Audit Logs", value: "1,840", subtitle: "Last log 2m ago", icon: <FileText size={24} /> },
        { title: "Role Security Score", value: "100%", subtitle: "Spring Security Active", icon: <ShieldCheck size={24} /> }
    ];

    const recentLogs = [
        { id: "LOG-501", user: "manager@exportflow.com", role: "Export Manager", action: "Generated Download Token TOK-EXP-9921", time: "10 mins ago" },
        { id: "LOG-502", user: "buyer@globaltrade.com", role: "Client", action: "Downloaded Commercial Invoice PDF", time: "25 mins ago" },
        { id: "LOG-503", user: "admin@exportflow.com", role: "Admin", action: "Updated user role for sales@exportflow.com", time: "1 hour ago" },
        { id: "LOG-504", user: "manager@exportflow.com", role: "Export Manager", action: "Uploaded Bill of Lading (BL-8849)", time: "3 hours ago" }
    ];

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">System-wide oversight, user management, audit logs, and reports</p>
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

            <div className="stats-grid">
                {stats.map((item, idx) => (
                    <div className="stat-card" key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {item.icon}
                            <Activity size={16} style={{ color: "#10b981" }} />
                        </div>
                        <h3>{item.value}</h3>
                        <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>{item.title}</p>
                        <small style={{ color: "#64748b" }}>{item.subtitle}</small>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2>Role Access Summary</h2>
                        <span style={{ fontSize: "12px", background: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>
                            RBAC Active
                        </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                        <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", background: "#f8fafc" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#1e293b" }}>
                                <ShieldCheck size={18} color="#2563eb" /> Admin
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0" }}>Full CRUD control, user & role management, audit log access, data override.</p>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb" }}>4 Active Accounts</span>
                        </div>

                        <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", background: "#f8fafc" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#059669" }}>
                                <Users size={18} color="#059669" /> Export Manager
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0" }}>Create/update orders & shipments, generate download tokens, upload docs.</p>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#059669" }}>14 Active Accounts</span>
                        </div>

                        <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", background: "#f8fafc" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#d97706" }}>
                                <Users size={18} color="#d97706" /> Client (Buyer)
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0" }}>Read-only access to own orders/invoices, unlock docs using tokens.</p>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#d97706" }}>24 Active Accounts</span>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h2>Quick Links</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                        <button className="secondary-action" onClick={() => navigate("/admin/users")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 0 }}>
                            <span>User Management</span>
                            <ArrowUpRight size={16} />
                        </button>
                        <button className="secondary-action" onClick={() => navigate("/admin/roles")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 0 }}>
                            <span>Roles & Permissions</span>
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
                    <button onClick={() => navigate("/admin/audit-logs")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>
                        View All Logs &rarr;
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Log ID</th>
                            <th>User</th>
                            <th>Role</th>
                            <th>Action Performed</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentLogs.map((log) => (
                            <tr key={log.id}>
                                <td style={{ fontWeight: 600 }}>{log.id}</td>
                                <td>{log.user}</td>
                                <td>
                                    <span style={{
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        background: log.role === "Admin" ? "#fee2e2" : log.role === "Export Manager" ? "#dbeafe" : "#fef3c7",
                                        color: log.role === "Admin" ? "#991b1b" : log.role === "Export Manager" ? "#1e40af" : "#92400e"
                                    }}>
                                        {log.role}
                                    </span>
                                </td>
                                <td>{log.action}</td>
                                <td style={{ color: "#64748b" }}>{log.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
