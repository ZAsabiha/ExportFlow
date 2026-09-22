import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";
import { clearSession, getAccessToken, getStoredUser, storeSession } from "../api/client";
import { isTokenExpired } from "../utils/authUtils";

// A permission is a helper for reading useAuth().permissions in components -
// e.g. hasPermission(permissions, "VIEW_SHIPMENTS").
export function hasPermission(permissions, name) {
    return Array.isArray(permissions) && permissions.includes(name);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => getStoredUser());
    // "loading" covers the initial session check on page load/refresh.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function hydrate() {
            try {
                // Perform silent refresh using the HTTP-Only refresh cookie.
                // The backend validates, rotates the refresh token (setting a new cookie),
                // and returns a fresh access token in memory.
                const data = await authApi.refresh();
                const nextUser = {
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    roles: data.roles || [],
                    permissions: data.permissions || [],
                };
                storeSession({ accessToken: data.accessToken, ...nextUser });
                setUser(nextUser);
            } catch {
                clearSession();
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        hydrate();
    }, []);

    const login = async (email, password) => {
        const data = await authApi.login(email, password);
        const nextUser = {
            id: data.id,
            username: data.username,
            email: data.email,
            roles: data.roles || [],
            permissions: data.permissions || [],
        };
        storeSession({ accessToken: data.accessToken, ...nextUser });
        setUser(nextUser);
        return nextUser;
    };

    const register = async (username, email, password, role) => {
        return authApi.register(username, email, password, role);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // silent catch on network error during logout
        } finally {
            clearSession();
            setUser(null);
        }
    };

    const value = useMemo(
        () => ({
            user,
            roles: user?.roles || [],
            permissions: user?.permissions || [],
            isAuthenticated: !!user && !isTokenExpired(getAccessToken()),
            loading,
            login,
            register,
            logout,
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}