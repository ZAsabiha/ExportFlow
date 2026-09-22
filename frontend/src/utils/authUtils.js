// Maps a backend role name (e.g. "ADMIN", "EXPORT_MANAGER", "CLIENT") to the portal path
// prefix used in App.jsx's routes. Normalizes case/spacing so "Export Manager",
// "EXPORT_MANAGER" or "export-manager" all resolve the same way.
export function roleToPortal(roleName = "") {
    const normalized = roleName.toUpperCase().replace(/[^A-Z]/g, "");
    if (normalized.includes("ADMIN")) return "admin";
    if (normalized.includes("MANAGER")) return "manager";
    if (normalized.includes("CLIENT")) return "client";
    return null;
}

// Given the set of role names a user has, pick the highest-privilege portal to land on.
export function primaryPortalForRoles(roles = []) {
    const portals = roles.map(roleToPortal).filter(Boolean);
    if (portals.includes("admin")) return "admin";
    if (portals.includes("manager")) return "manager";
    if (portals.includes("client")) return "client";
    return null;
}

// Decodes a JWT's payload without verifying the signature (verification happens server-side).
// Used only to read the `exp` claim so the UI can react to an expired token proactively.
export function decodeJwtPayload(token) {
    if (!token) return null;
    try {
        const [, payload] = token.split(".");
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(normalized)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
}
