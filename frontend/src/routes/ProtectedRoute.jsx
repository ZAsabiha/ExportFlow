import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, hasPermission } from "../context/AuthContext";
import { primaryPortalForRoles, roleToPortal } from "../utils/authUtils";

/**
 * Wrap a portal's routes with <ProtectedRoute portal="admin">...</ProtectedRoute>.
 * - Not logged in -> bounce to the login page (and remember where they were headed).
 * - Logged in but lacking the role for this portal -> send them to the portal they DO have.
 * - Pass `permission="VIEW_SHIPMENTS"` to also gate a single page behind an admin-assigned
 *   permission, on top of the role check - sends them to their portal home if missing.
 */
export default function ProtectedRoute({ portal, permission, children }) {
    const { isAuthenticated, roles, permissions, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", color: "#53698f" }}>
                Loading your session…
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    const allowedPortals = roles.map(roleToPortal);
    if (portal && !allowedPortals.includes(portal)) {
        const fallback = primaryPortalForRoles(roles);
        return <Navigate to={fallback ? `/${fallback}` : "/"} replace />;
    }

    if (permission && !hasPermission(permissions, permission)) {
        return <Navigate to={portal ? `/${portal}` : "/"} replace />;
    }

    return children;
}