import React, { useEffect, useRef, useState } from "react";
import { Search, Bell, UserCircle, X, Tag, CheckCircle2, XCircle, FileCheck2, Info } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { primaryPortalForRoles } from "../utils/authUtils";
import * as clientApi from "../api/clientApi";
import * as exportManagerApi from "../api/exportManagerApi";

import "./dashboard.css";

const PORTAL_LABELS = {
    admin: "Admin",
    manager: "Export Manager",
    client: "Client",
};

// Notifications only exist for the client and export-manager portals right now.
const NOTIFICATION_API = {
    client: clientApi,
    manager: exportManagerApi,
};

// Icon + accent color per Notification.type (backend enum). Falls back to a generic
// info icon for anything unrecognized so new/legacy types never render blank.
const NOTIFICATION_TYPE_META = {
    QUOTE: { icon: Tag, className: "notif-icon-quote" },
    ACCEPTANCE: { icon: CheckCircle2, className: "notif-icon-acceptance" },
    REJECTION: { icon: XCircle, className: "notif-icon-rejection" },
    DOCUMENT: { icon: FileCheck2, className: "notif-icon-document" },
};

function NotificationIcon({ type }) {
    const meta = NOTIFICATION_TYPE_META[type] || { icon: Info, className: "notif-icon-default" };
    const Icon = meta.icon;
    return (
        <span className={`notification-item-icon ${meta.className}`}>
            <Icon size={16} />
        </span>
    );
}

export default function TopNavbar() {
    const { user, roles } = useAuth();
    const portal = primaryPortalForRoles(roles);
    const displayName = user?.username || user?.email || "Signed-in user";
    const displayRole = PORTAL_LABELS[portal] || "Member";
    const [searchQuery, setSearchQuery] = useState("");

    const notificationApi = NOTIFICATION_API[portal];
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);

    const loadNotifications = () => {
        if (!notificationApi) return;
        notificationApi.getNotifications()
            .then((data) => setNotifications(Array.isArray(data.content) ? data.content : []))
            .catch(() => {});
    };

    useEffect(() => {
        loadNotifications();
        if (!notificationApi) return undefined;
        const interval = setInterval(loadNotifications, 45000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [portal]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleOpenNotification = async (n) => {
        if (n.read || !notificationApi) return;
        try {
            const updated = await notificationApi.markNotificationRead(n.id);
            setNotifications((current) => current.map((item) => (item.id === n.id ? updated : item)));
        } catch {
            // non-critical - leave it as unread if the request fails
        }
    };

    return (
        <header className="dashboard-navbar">
            <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders, buyers, shipments..."
                />
                {searchQuery ? (
                    <button type="button" className="search-clear-btn" onClick={() => setSearchQuery("")} title="Clear search">
                        <X size={14} />
                    </button>
                ) : (
                    <kbd className="search-kbd">Ctrl K</kbd>
                )}
            </div>

            <div className="navbar-actions">
                <div className="notification-wrapper" ref={notifRef}>
                    <button
                        type="button"
                        className="notification-btn"
                        title="Notifications"
                        onClick={() => setNotifOpen((open) => !open)}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="notification-dot"></span>}
                    </button>

                    {notifOpen && (
                        <div className="notification-panel">
                            <div className="notification-panel-header">
                                <strong>Notifications</strong>
                                {unreadCount > 0 && <span>{unreadCount} new</span>}
                            </div>
                            <div className="notification-panel-body">
                                {!notificationApi && <p className="notification-empty">No notifications for this account.</p>}
                                {notificationApi && notifications.length === 0 && (
                                    <p className="notification-empty">You're all caught up.</p>
                                )}
                                {notificationApi && notifications.map((n) => (
                                    <button
                                        type="button"
                                        key={n.id}
                                        className={`notification-item${n.read ? "" : " unread"}`}
                                        onClick={() => handleOpenNotification(n)}
                                    >
                                        <NotificationIcon type={n.type} />
                                        <span className="notification-item-body">
                                            <p>{n.message}</p>
                                            <small>{n.orderCode} &bull; {n.createdAt?.slice(0, 16).replace("T", " ")}</small>
                                        </span>
                                        {!n.read && <span className="notification-item-dot" aria-label="Unread" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile">
                    <div className="profile-avatar">
                        <UserCircle size={32} />
                    </div>
                    <div className="profile-info">
                        <strong>{displayName}</strong>
                        <small>{displayRole}</small>
                    </div>
                </div>
            </div>
        </header>
    );
}
