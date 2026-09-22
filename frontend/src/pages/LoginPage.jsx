import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, BriefcaseBusiness, Package, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

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
        location.state?.registered ? "Account created! Sign in with your new credentials below." : ""
    );
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Clear the router state so refreshing the page doesn't keep showing the banner.
        if (location.state?.registered) {
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const roles = [
        { name: "Client", icon: <BriefcaseBusiness size={20} /> },
        { name: "Export Manager", icon: <Package size={20} /> },
        { name: "Admin", icon: <Shield size={20} /> },
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
                {/* LEFT SIDE */}
                <div className="brand-section">
                    <div className="grid-bg"></div>

                    <div className="brand-content">
                        <div className="logo-circle">
                            <div className="diamond"></div>
                        </div>

                        <svg className="route-line" width="450" height="140">
                            <path
                                d="
              M20 100
              C120 20,
              210 110,
              320 50
              C370 25,
              420 50,
              440 25
              "
                                fill="none"
                                stroke="#9ab5ef"
                                strokeWidth="2"
                                strokeDasharray="5 8"
                            />
                            <circle cx="20" cy="100" r="5" fill="white" />
                            <circle cx="440" cy="25" r="5" fill="white" />
                        </svg>

                        <div className="brand-title">EXPORT & SHIPPING MANAGEMENT</div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="form-section">
                    <div className="form-box">
                        <h4>SIGN IN AS</h4>

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
                                ? "Full system access — users, workflows, and audit trail."
                                : role === "Export Manager"
                                    ? "Manage orders, shipments, invoices and documents."
                                    : "View your orders and shipment information."}
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
                            Need an account? <Link to="/register">Create an account (Client / Manager / Admin)</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
