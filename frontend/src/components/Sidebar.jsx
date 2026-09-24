import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    FileText,
    Users,
    Receipt,
    KeyRound,
    BarChart3,
    History,
    MessageSquareWarning,
    LogOut,
    Ship
} from "lucide-react";

import { useAuth, hasPermission } from "../context/AuthContext";

import "./dashboard.css";

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, permissions } = useAuth();
    const pathname = location.pathname;

    let currentRole = "Export Manager";
    let rolePrefix = "/manager";

    if (pathname.startsWith("/admin")) {
        currentRole = "Admin";
        rolePrefix = "/admin";
    } else if (pathname.startsWith("/client")) {
        currentRole = "Client";
        rolePrefix = "/client";
    }

    const menuConfigs = {
        Admin: [
            { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
            { name: "Users", path: "/admin/users", icon: <Users size={18} /> },
            { name: "Audit Logs", path: "/admin/audit-logs", icon: <History size={18} /> },
            { name: "Reports", path: "/admin/reports", icon: <BarChart3 size={18} /> },
            { name: "Claims", path: "/admin/claims", icon: <MessageSquareWarning size={18} /> },
        ],
        "Export Manager": [
            { name: "Dashboard", path: "/manager", icon: <LayoutDashboard size={18} /> },
            { name: "Orders", path: "/manager/orders", icon: <ShoppingCart size={18} /> },
            { name: "Shipments", path: "/manager/shipments", icon: <Package size={18} /> },
            { name: "Documents", path: "/manager/documents", icon: <FileText size={18} /> },
            { name: "Download Tokens", path: "/manager/tokens", icon: <KeyRound size={18} /> },
        ],
        Client: [
            { name: "Dashboard", path: "/client", icon: <LayoutDashboard size={18} /> },
            { name: "Orders", path: "/client/orders", icon: <ShoppingCart size={18} /> },
            { name: "Shipments", path: "/client/shipments", icon: <Package size={18} />, permission: "VIEW_SHIPMENTS" },
            { name: "Invoices", path: "/client/invoices", icon: <Receipt size={18} /> },
            { name: "Documents", path: "/client/documents", icon: <FileText size={18} /> },
            { name: "Claims", path: "/client/claims", icon: <MessageSquareWarning size={18} /> },
        ],
    };

    const currentMenu = (menuConfigs[currentRole] || menuConfigs["Export Manager"]).filter(
        (item) => !item.permission || hasPermission(permissions, item.permission)
    );

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-mark">
                    <Ship size={18} />
                </div>
                <div className="brand-text">
                    <div className="sidebar-logo">ExportFlow</div>
                    <div className="sidebar-role">{currentRole} Portal</div>
                </div>
            </div>

            <div className="sidebar-section-label">Workspace</div>

            <nav className="sidebar-menu">
                {currentMenu.map((item) => (
                    <NavLink
                        to={item.path}
                        key={item.name}
                        end={item.path === rolePrefix}
                        className={({ isActive }) => (isActive ? "sidebar-item active" : "sidebar-item")}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    );
}