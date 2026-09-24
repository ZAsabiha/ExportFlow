import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, BriefcaseBusiness, Package, Eye, EyeOff, AlertCircle, CheckCircle2, Ship, FileLock2, Route } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { primaryPortalForRoles, roleToPortal } from "../utils/authUtils";
import PublicNavbar from "../components/PublicNavbar";

import "./LoginPage.css";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [role, setRole] = useState(location.state?.role || "Admin");
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState(location.state?.email || "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(
        location.state?.registered ? "Your account has been created. Sign in with your new credentials." : ""
    );
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (location.state?.registered) {
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const roles = [
        { name: "Client", icon: <BriefcaseBusiness size={20} /> },
        { name: "Export Manager", icon: <Package size={20} /> },
        { name: "Admin", icon: <ShieldCheck size={20} /> },
    ];

    const portalForSelectedRole = roleToPortal(role);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!email || !password) {
            setError("Please enter both your email and password.");
            return;
        }

        setSubmitting(true);
        try {
            const loggedInUser = await login(email, password);
            const actualPortal = primaryPortalForRoles(loggedInUser.roles);

            if (!actualPortal) {
                setError("Your account has no portal access assigned yet. Contact your administrator.");
                return;
            }

            if (portalForSelectedRole && actualPortal !== portalForSelectedRole) {
                const label = actualPortal === "admin" ? "Admin" : actualPortal === "manager" ? "Export Manager" : "Client";
                setError(`Signed in — this account is provisioned for the ${label} portal, redirecting you there.`);
            }

            const redirectTo = location.state?.from?.pathname;
            const destination = redirectTo && redirectTo.startsWith(`/${actualPortal}`) ? redirectTo : `/${actualPortal}`;
            navigate(destination, { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
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
                            <Ship size={30} />
                        </div>

                        <h1 className="brand-headline">Export operations, from order to delivery.</h1>
                        <p className="brand-tagline">
                            One workspace for purchase orders, shipments, invoices and secure trade documents.
                        </p>

                        <ul className="brand-features">
                            <li><span className="feature-icon"><Route size={19} /></span>Real-time order and shipment tracking</li>
                            <li><span className="feature-icon"><FileLock2 size={19} /></span>Token-secured document delivery</li>
                            <li><span className="feature-icon"><ShieldCheck size={19} /></span>Role-based access with full audit trail</li>
                        </ul>

                        <div className="brand-title">Export & Shipping Management</div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-box">
                        <h2 className="form-heading">Welcome back</h2>
                        <p className="form-subheading">Sign in to your ExportFlow workspace.</p>

                        <h4>Sign in as</h4>

                        <div className="role-container">
                            {roles.map((item) => (
                                <button
                                    type="button"
                                    key={item.name}
                                    onClick={() => setRole(item.name)}
                                    className={role === item.name ? "role-card active" : "role-card"}
                                >
                                    <div className="role-icon">{item.icon}</div>
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </div>

                        <p className="access-text">
                            {role === "Admin"
                                ? "Full system access: users, workflows and audit trail."
                                : role === "Export Manager"
                                    ? "Manage orders, shipments, invoices and documents."
                                    : "Track your orders, shipments and trade documents."}
                        </p>

                        <form onSubmit={handleSubmit}>
                            {successMessage && (
                                <div className="login-alert login-alert-success">
                                    <CheckCircle2 size={16} />
                                    <span>{successMessage}</span>
                                </div>
                            )}
                            {error && (
                                <div className="login-alert">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <label htmlFor="email">Email or username</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                            />

                            <label htmlFor="password">Password</label>
                            <div className="password-box">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="options">
                                <label>
                                    <input type="checkbox" />
                                    Remember me
                                </label>
                                <button type="button">Forgot password?</button>
                            </div>

                            <button className="signin" type="submit" disabled={submitting}>
                                {submitting ? "Signing in…" : "Sign in"}
                            </button>
                        </form>

                        <div className="footer">
                            Don’t have an account? <Link to="/register">Create one</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
