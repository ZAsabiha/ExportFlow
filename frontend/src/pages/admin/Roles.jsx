import React from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { ShieldCheck, Check, X, Info } from "lucide-react";
import "../../components/dashboard.css";

export default function Roles() {
    const permissions = [
        { name: "Manage Users & Deactivate Accounts", admin: true, manager: false, client: false },
        { name: "Assign System Roles", admin: true, manager: false, client: false },
        { name: "Access System Audit Logs", admin: true, manager: false, client: false },
        { name: "Create & Update Purchase Orders", admin: true, manager: true, client: false },
        { name: "Delete Orders / Audit Correction", admin: true, manager: false, client: false },
        { name: "Create & Update Shipments", admin: true, manager: true, client: false },
        { name: "Upload Trade Documents (BL, Invoice, COO)", admin: true, manager: true, client: false },
        { name: "Generate Secure Download Tokens", admin: true, manager: true, client: false },
        { name: "View Own Purchase Orders & Pipeline Stage", admin: true, manager: true, client: true },
        { name: "Unlock & Download Documents via Token", admin: true, manager: true, client: true },
        { name: "Generate & Download Invoices PDF", admin: true, manager: true, client: true },
    ];

    return (
        <DashboardLayout>
            <h1 className="page-title">Roles & Access Control</h1>
            <p className="page-subtitle">Role-Based Access Control (RBAC) matrix enforced via Spring Security & JWT</p>

            <div className="panel" style={{ marginTop: "25px", borderLeft: "4px solid #3b82f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Info size={20} color="#3b82f6" />
                    <div>
                        <h3 style={{ margin: 0, fontSize: "16px" }}>Security Protocol</h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                            All API endpoints enforce authority constraints `@PreAuthorize("hasRole('ADMIN')")` or `@PreAuthorize("hasRole('EXPORT_MANAGER')")`. Clients have scoped read-only access.
                        </p>
                    </div>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "25px" }}>
                <h2>Permission Matrix</h2>
                <table style={{ marginTop: "15px" }}>
                    <thead>
                        <tr>
                            <th>Permission Capability</th>
                            <th style={{ textAlign: "center" }}>Admin</th>
                            <th style={{ textAlign: "center" }}>Export Manager</th>
                            <th style={{ textAlign: "center" }}>Client (Buyer)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissions.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ fontWeight: 600, color: "#334155" }}>{item.name}</td>
                                <td style={{ textAlign: "center" }}>
                                    {item.admin ? <Check size={18} color="#16a34a" style={{ strokeWidth: 3 }} /> : <X size={18} color="#94a3b8" />}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                    {item.manager ? <Check size={18} color="#16a34a" style={{ strokeWidth: 3 }} /> : <X size={18} color="#94a3b8" />}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                    {item.client ? <Check size={18} color="#16a34a" style={{ strokeWidth: 3 }} /> : <X size={18} color="#94a3b8" />}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
