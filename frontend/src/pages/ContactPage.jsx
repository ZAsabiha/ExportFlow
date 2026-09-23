import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import { submitContactForm } from "../api/contactApi";
import { ApiError } from "../api/client";
import "./InfoPages.css";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await submitContactForm(form.name, form.email, form.message);
            setSent(true);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper">
            <PublicNavbar />

            <div className="info-page">
                <div className="info-card">
                    <h2>Contact Us</h2>
                    <p className="info-subtext">
                        Questions about onboarding, pricing, or an existing shipment? Send us a
                        message and our team will get back to you.
                    </p>

                    <div className="contact-details">
                        <div><Mail size={18} /> support@exportflow.example</div>
                        <div><Phone size={18} /> +1 (555) 010-2938</div>
                        <div><MapPin size={18} /> 400 Harbor Way, Suite 12, Dhaka</div>
                    </div>

                    {sent ? (
                        <div className="info-success">
                            Thanks, {form.name || "there"} — we've received your message and will
                            reply to {form.email} shortly.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="contact-form">
                            {error && <div className="info-error">{error}</div>}

                            <label>Name</label>
                            <input value={form.name} onChange={update("name")} placeholder="Your name" required />

                            <label>Email</label>
                            <input type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" required />

                            <label>Message</label>
                            <textarea rows={5} value={form.message} onChange={update("message")} placeholder="How can we help?" required />

                            <button type="submit" className="info-submit" disabled={submitting}>
                                <Send size={16} /> {submitting ? "Sending..." : "Send message"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}