import { apiRequest } from "./client";

export function submitContactForm(name, email, message) {
    return apiRequest("/contact", { method: "POST", body: { name, email, message } }, { auth: false });
}
