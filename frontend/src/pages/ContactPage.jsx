import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import "./InfoPages.css";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [sent, setSent] = useState(false);

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        // No backend endpoint for this yet — swap this for a real POST /api/contact call
        // once one exists. For now it just confirms receipt in the UI.
        setSent(true);
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
                            <label>Name</label>
                            <input value={form.name} onChange={update("name")} placeholder="Your name" required />

                            <label>Email</label>
                            <input type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" required />

                            <label>Message</label>
                            <textarea rows={5} value={form.message} onChange={update("message")} placeholder="How can we help?" required />

                            <button type="submit" className="info-submit">
                                <Send size={16} /> Send message
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}