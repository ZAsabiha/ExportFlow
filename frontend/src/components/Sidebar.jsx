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
    ShieldCheck,
    History,
    LogOut
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
            { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={20} /> },
            { name: "Users", path: "/admin/users", icon: <Users size={20} /> },
            { name: "Roles", path: "/admin/roles", icon: <ShieldCheck size={20} /> },
            { name: "Audit Logs", path: "/admin/audit-logs", icon: <History size={20} /> },
            { name: "Reports", path: "/admin/reports", icon: <BarChart3 size={20} /> },
        ],
        "Export Manager": [
            { name: "Dashboard", path: "/manager", icon: <LayoutDashboard size={20} /> },
            { name: "Orders", path: "/manager/orders", icon: <ShoppingCart size={20} /> },
            { name: "Shipments", path: "/manager/shipments", icon: <Package size={20} /> },
            { name: "Documents", path: "/manager/documents", icon: <FileText size={20} /> },
            { name: "Token Generation", path: "/manager/tokens", icon: <KeyRound size={20} /> },
        ],
        Client: [
            { name: "Dashboard", path: "/client", icon: <LayoutDashboard size={20} /> },
            { name: "Orders", path: "/client/orders", icon: <ShoppingCart size={20} /> },
            { name: "Shipments", path: "/client/shipments", icon: <Package size={20} />, permission: "VIEW_SHIPMENTS" },
            { name: "Invoices", path: "/client/invoices", icon: <Receipt size={20} /> },
            { name: "Documents", path: "/client/documents", icon: <FileText size={20} /> },
        ],
    };

    // An item with a `permission` only shows up if the logged-in user actually has it -
    // this is what makes an admin's per-user permission toggle hide the page for that user.
    const currentMenu = (menuConfigs[currentRole] || menuConfigs["Export Manager"]).filter(
        (item) => !item.permission || hasPermission(permissions, item.permission)
    );

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">EXPORT FLOW</div>

            <div className="sidebar-role" style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Portal</span>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#60a5fa", marginTop: "2px" }}>{currentRole}</div>
            </div>

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

            <button className="logout" onClick={handleLogout} style={{ cursor: "pointer", marginTop: "auto", paddingTop: "20px" }}>
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </aside>
    );
}