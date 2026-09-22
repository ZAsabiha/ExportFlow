import { apiRequest } from "./client";

export function login(email, password) {
    return apiRequest("/auth/login", { method: "POST", body: { email, password } }, { auth: false });
}

export function register(username, email, password, role = "CLIENT") {
    return apiRequest("/auth/register", { method: "POST", body: { username, email, password, role } }, { auth: false });
}

export function refresh() {
    return apiRequest("/auth/refresh", { method: "POST" }, { auth: false });
}

export function logout() {
    return apiRequest("/auth/logout", { method: "POST" }, { auth: false });
}

export function fetchCurrentUser() {
    return apiRequest("/auth/me", { method: "GET" });
}

