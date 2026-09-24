import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, X, Tag, CheckCircle2, XCircle, FileCheck2, Info, Package, Truck, Receipt, Users as UsersIcon } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { primaryPortalForRoles } from "../utils/authUtils";
import * as clientApi from "../api/clientApi";
import * as exportManagerApi from "../api/exportManagerApi";
import * as adminApi from "../api/adminApi";

import "./dashboard.css";

const PORTAL_LABELS = {
    admin: "Admin",
    manager: "Export Manager",
    client: "Client",
};

const NOTIFICATION_API = {
    client: clientApi,
    manager: exportManagerApi,
};

const SEARCH_API = {
    client: clientApi,
    manager: exportManagerApi,
    admin: adminApi,
};

const SEARCH_ROUTES = {
    client: { ORDER: "/client/orders", SHIPMENT: "/client/shipments", INVOICE: "/client/invoices" },
    manager: { ORDER: "/manager/orders", SHIPMENT: "/manager/shipments", INVOICE: "/manager/invoices" },
    admin: { ORDER: "/admin/reports", SHIPMENT: "/admin/reports", INVOICE: "/admin/reports", USER: "/admin/users" },
};

const SEARCH_TYPE_META = {
    ORDER: { label: "Orders", icon: Package },
    SHIPMENT: { label: "Shipments", icon: Truck },
    INVOICE: { label: "Invoices", icon: Receipt },
    USER: { label: "Users", icon: UsersIcon },
};

const SEARCH_PLACEHOLDER = {
    client: "Search orders, shipments, invoices…",
    manager: "Search orders, buyers, shipments…",
    admin: "Search orders, shipments, invoices, users…",
};

const NOTIFICATION_TYPE_META = {
    QUOTE: { icon: Tag, className: "notif-icon-quote" },
    ACCEPTANCE: { icon: CheckCircle2, className: "notif-icon-acceptance" },
    REJECTION: { icon: XCircle, className: "notif-icon-rejection" },
    DOCUMENT: { icon: FileCheck2, className: "notif-icon-document" },
};

function initialsFor(name) {
    const parts = String(name).split("@")[0].split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

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
    const navigate = useNavigate();
    const portal = primaryPortalForRoles(roles);
    const displayName = user?.username || user?.email || "Signed-in user";
    const displayRole = PORTAL_LABELS[portal] || "Member";

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchApi = SEARCH_API[portal];

    useEffect(() => {
        const term = searchQuery.trim();
        if (!searchApi || term.length < 2) {
            setSearchResults([]);
            setSearchLoading(false);
            return undefined;
        }
        setSearchLoading(true);
        let cancelled = false;
        const timer = setTimeout(() => {
            searchApi.globalSearch(term)
                .then((data) => {
                    if (!cancelled) setSearchResults(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    if (!cancelled) setSearchResults([]);
                })
                .finally(() => {
                    if (!cancelled) setSearchLoading(false);
                });
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, portal]);

    useEffect(() => {
        const handleShortcut = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
                setSearchOpen(true);
            } else if (e.key === "Escape") {
                setSearchOpen(false);
            }
        };
        document.addEventListener("keydown", handleShortcut);
        return () => document.removeEventListener("keydown", handleShortcut);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const groupedResults = searchResults.reduce((groups, r) => {
        (groups[r.type] = groups[r.type] || []).push(r);
        return groups;
    }, {});

    const handleClearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleResultClick = (result) => {
        const route = SEARCH_ROUTES[portal]?.[result.type];
        setSearchOpen(false);
        handleClearSearch();
        if (route) navigate(route);
    };

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
        if (!notificationApi?.streamNotifications) return undefined;
        let opened = false;
        return notificationApi.streamNotifications({
            onOpen: () => {
                if (opened) loadNotifications();
                opened = true;
            },
            onEvent: (event, data) => {
                if (event !== "notification" || !data?.id) return;
                setNotifications((current) => [data, ...current.filter((item) => item.id !== data.id)]);
            },
        });
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
            return;
        }
    };

    return (
        <header className="dashboard-navbar">
            <div className="search-wrapper" ref={searchRef}>
                <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchOpen(true)}
                        placeholder={SEARCH_PLACEHOLDER[portal] || "Search…"}
                    />
                    {searchQuery ? (
                        <button type="button" className="search-clear-btn" onClick={handleClearSearch} title="Clear search">
                            <X size={14} />
                        </button>
                    ) : (
                        <kbd className="search-kbd">Ctrl K</kbd>
                    )}
                </div>

                {searchOpen && searchQuery.trim().length >= 2 && (
                    <div className="search-results-panel">
                        {searchLoading && <p className="search-results-empty">Searching…</p>}
                        {!searchLoading && searchResults.length === 0 && (
                            <p className="search-results-empty">No results for “{searchQuery.trim()}”</p>
                        )}
                        {!searchLoading && Object.entries(groupedResults).map(([type, items]) => {
                            const meta = SEARCH_TYPE_META[type] || { label: type, icon: Info };
                            const TypeIcon = meta.icon;
                            return (
                                <div className="search-results-group" key={type}>
                                    <div className="search-results-group-label">{meta.label}</div>
                                    {items.map((r) => (
                                        <button
                                            type="button"
                                            key={`${r.type}-${r.id}`}
                                            className="search-result-item"
                                            onClick={() => handleResultClick(r)}
                                        >
                                            <span className="search-result-icon">
                                                <TypeIcon size={15} />
                                            </span>
                                            <span className="search-result-body">
                                                <strong>{r.title}</strong>
                                                <small>{r.subtitle}</small>
                                            </span>
                                            {r.status && <span className="search-result-status">{r.status.replace(/_/g, " ").toLowerCase()}</span>}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="navbar-actions">
                <div className="notification-wrapper" ref={notifRef}>
                    <button
                        type="button"
                        className="notification-btn"
                        title="Notifications"
                        aria-label="Notifications"
                        onClick={() => setNotifOpen((open) => !open)}
                    >
                        <Bell size={17} />
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
                                    <p className="notification-empty">You’re all caught up.</p>
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

                <div className="navbar-divider" />

                <div className="profile">
                    <div className="profile-avatar" aria-hidden="true">
                        {initialsFor(displayName)}
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
