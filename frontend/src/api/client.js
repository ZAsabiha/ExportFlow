// Thin fetch wrapper around the Spring Boot backend.
//
// - Reads the API base URL from VITE_API_BASE_URL.
// - Keeps the Access Token strictly IN MEMORY (never in localStorage/sessionStorage).
// - Relies on HTTP-Only cookies for Refresh Token storage and rotation.
// - On a 401 it tries silent refresh (via /api/auth/refresh) and replays the original request.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const USER_KEY = "ems_user";

let inMemoryAccessToken = null;

export function getAccessToken() {
    return inMemoryAccessToken;
}

export function setAccessToken(token) {
    inMemoryAccessToken = token;
}

export function getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function storeSession({ accessToken, ...user }) {
    if (accessToken) {
        inMemoryAccessToken = accessToken;
    }
    if (user && Object.keys(user).length > 0) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

export function clearSession() {
    inMemoryAccessToken = null;
    localStorage.removeItem(USER_KEY);
}

class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

// Only one refresh call should ever be in flight, even if several requests 401 at once.
let refreshPromise = null;

export async function doRefresh() {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        clearSession();
        throw new ApiError("Session expired", response.status);
    }

    const data = await response.json();
    setAccessToken(data.accessToken);

    const existingUser = getStoredUser();
    const updatedUser = {
        id: data.id ?? existingUser?.id,
        username: data.username ?? existingUser?.username,
        email: data.email ?? existingUser?.email,
        roles: data.roles ?? existingUser?.roles,
    };
    if (updatedUser.id) {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }

    return data;
}

/**
 * Calls the backend API.
 * @param {string} path - e.g. "/auth/login" (relative to API_BASE_URL)
 * @param {object} options - fetch options; `body` may be a plain object and will be JSON-encoded
 * @param {object} config - { auth: boolean, retryOn401: boolean }
 */
export async function apiRequest(path, options = {}, config = {}) {
    const { auth = true, retryOn401 = true } = config;
    const isFormData = options.body instanceof FormData;
    const headers = { ...(options.headers || {}) };

    if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (auth) {
        const token = getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const body =
        options.body && typeof options.body !== "string" && !isFormData
            ? JSON.stringify(options.body)
            : options.body;

    const fetchOptions = {
        ...options,
        headers,
        body,
        credentials: "include", // Sends & receives HTTP-Only refresh cookies
    };

    const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

    if (response.status === 401 && auth && retryOn401) {
        try {
            refreshPromise = refreshPromise || doRefresh();
            await refreshPromise;
            refreshPromise = null;
        } catch (err) {
            refreshPromise = null;
            clearSession();
            throw new ApiError("Session expired. Please sign in again.", 401);
        }
        // Replay the original request once, now with the refreshed token.
        return apiRequest(path, options, { auth, retryOn401: false });
    }

    return parseResponse(response, config);
}

async function parseResponse(response, config = {}) {
    if (config.asBlob) {
        if (!response.ok) {
            const data = await response.json().catch(() => null);
            const message = (data && data.message) || "Download failed";
            throw new ApiError(message, response.status, data);
        }
        return await response.blob();
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text();

    if (!response.ok) {
        const message = (data && data.message) || (typeof data === "string" && data) || "Request failed";
        throw new ApiError(message, response.status, data);
    }

    return data;
}

// Builds a "?page=0&size=20" style query string, dropping any undefined/null params
// (e.g. an omitted `size` so the backend's own per-feature default applies).
export function buildQuery(params = {}) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length === 0) return "";
    return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}`;
}

export function openEventStream(path, { onEvent, onOpen } = {}) {
    let controller = null;
    let retryTimer = null;
    let closed = false;
    let attempt = 0;
    let refreshedSinceOpen = false;

    const scheduleReconnect = () => {
        if (closed) return;
        const delay = Math.min(30000, 1000 * 2 ** attempt);
        attempt += 1;
        retryTimer = setTimeout(connect, delay);
    };

    const dispatch = (block) => {
        let event = "message";
        const data = [];
        for (const line of block.split(/\r?\n/)) {
            if (!line || line.startsWith(":")) continue;
            const idx = line.indexOf(":");
            const field = idx === -1 ? line : line.slice(0, idx);
            const value = idx === -1 ? "" : line.slice(idx + 1).replace(/^ /, "");
            if (field === "event") event = value;
            else if (field === "data") data.push(value);
        }
        if (data.length === 0) return;
        const raw = data.join("\n");
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            parsed = raw;
        }
        onEvent?.(event, parsed);
    };

    async function connect() {
        if (closed) return;
        controller = new AbortController();
        try {
            const headers = { Accept: "text/event-stream" };
            const token = getAccessToken();
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}${path}`, {
                headers,
                credentials: "include",
                signal: controller.signal,
            });

            if (response.status === 401) {
                if (refreshedSinceOpen) return;
                refreshedSinceOpen = true;
                refreshPromise = refreshPromise || doRefresh();
                try {
                    await refreshPromise;
                } finally {
                    refreshPromise = null;
                }
                attempt = 0;
                connect();
                return;
            }
            if (!response.ok || !response.body) throw new ApiError("Stream failed", response.status);

            attempt = 0;
            refreshedSinceOpen = false;
            onOpen?.();

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let buffer = "";
            for (;;) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += value;
                const blocks = buffer.split(/\r?\n\r?\n/);
                buffer = blocks.pop();
                blocks.forEach(dispatch);
            }
            scheduleReconnect();
        } catch (err) {
            if (closed || err?.name === "AbortError") return;
            if (err instanceof ApiError && err.status === 401) return;
            scheduleReconnect();
        }
    }

    connect();

    return () => {
        closed = true;
        clearTimeout(retryTimer);
        controller?.abort();
    };
}

export { ApiError, API_BASE_URL };

