import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle, BriefcaseBusiness, Package, Shield } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import PublicNavbar from "../components/PublicNavbar";

import "./LoginPage.css";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState("Client");
    const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const roles = [
        { name: "Client", key: "CLIENT", icon: <BriefcaseBusiness size={20} />, text: "Access client portal to view orders, invoices & shipment tracking." },
        { name: "Export Manager", key: "EXPORT_MANAGER", icon: <Package size={20} />, text: "Manage export operations, shipments, documentation & invoices." },
        { name: "Admin", key: "ADMIN", icon: <Shield size={20} />, text: "Full administrative access for system configuration & user management." },
    ];

    const currentRoleObj = roles.find((r) => r.name === selectedRole) || roles[0];

    const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.username || !form.email || !form.password) {
            setError("Please fill in every field.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password should be at least 6 characters.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);
        try {
            await register(form.username, form.email, form.password, currentRoleObj.key);
            navigate("/", { state: { registered: true, email: form.email, role: selectedRole } });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper">
            <PublicNavbar />

            <div className="login-page">
                <div className="brand-section">
                    <div className="grid-bg"></div>
                    <div className="brand-content">
                        <div className="logo-circle">
                            <UserPlus size={40} color="white" />
                        </div>
                        <div className="brand-title">JOIN THE EXPORT FLOW PLATFORM</div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-box">
                        <h4>REGISTER AS</h4>

                        <div className="role-container">
                            {roles.map((item) => (
                                <button
                                    type="button"
                                    key={item.name}
                                    onClick={() => setSelectedRole(item.name)}
                                    className={selectedRole === item.name ? "role-card active" : "role-card"}
                                >
                                    <div className="role-icon">{item.icon}</div>
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </div>

                        <p className="access-text">
                            {currentRoleObj.text}
                        </p>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="login-alert">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <label htmlFor="username">Full name</label>
                            <input id="username" value={form.username} onChange={update("username")} placeholder="Jane Doe" />

                            <label htmlFor="email">Email</label>
                            <input id="email" type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" />

                            <label htmlFor="password">Password</label>
                            <input id="password" type="password" value={form.password} onChange={update("password")} placeholder="••••••••" />

                            <label htmlFor="confirmPassword">Confirm password</label>
                            <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="••••••••" />

                            <button className="signin" type="submit" disabled={submitting}>
                                {submitting ? `Registering as ${selectedRole}…` : `Register as ${selectedRole}`}
                            </button>
                        </form>

                        <div className="footer">
                            Already have an account? <Link to="/">Sign in</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}