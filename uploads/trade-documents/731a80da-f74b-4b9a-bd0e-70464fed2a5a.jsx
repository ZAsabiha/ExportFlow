import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { KeyRound, Copy, CheckCircle2, ShieldCheck, Clock, RefreshCw, Trash2 } from "lucide-react";
import { getAllTokens, getOrders, generateToken, revokeToken } from "../../api/exportManagerApi";
import "../../components/dashboard.css";

export default function TokenCenter() {
    const [selectedOrder, setSelectedOrder] = useState("");
    const [buyerEmail, setBuyerEmail] = useState("");
    const [expiryDays, setExpiryDays] = useState("7");
    const [copiedToken, setCopiedToken] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [tokensData, ordersData] = await Promise.all([
                getAllTokens(),
                getOrders()
            ]);
            setTokens(Array.isArray(tokensData) ? tokensData : []);
            setOrders(Array.isArray(ordersData) ? ordersData : []);
            if (Array.isArray(ordersData) && ordersData.length > 0) {
                setSelectedOrder(prev => prev || ordersData[0].id.toString());
            }
        } catch (err) {
            setError(err.message || "Failed to load download tokens");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerateToken = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return;

        setSubmitting(true);
        setError(null);
        try {
            const created = await generateToken({
                orderId: parseInt(selectedOrder, 10),
                buyerEmail: buyerEmail || undefined,
                expiryDays: parseInt(expiryDays, 10)
            });
            setTokens([created, ...tokens]);
            setBuyerEmail("");
        } catch (err) {
            setError(err.message || "Failed to generate download token");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (tokenKey) => {
        if (!window.confirm(`Are you sure you want to revoke token ${tokenKey}?`)) return;
        try {
            await revokeToken(tokenKey);
            setTokens(tokens.map(t => t.token === tokenKey ? { ...t, status: "REVOKED" } : t));
        } catch (err) {
            alert(err.message || "Failed to revoke token");
        }
    };

    const handleCopy = (tokenKey) => {
        navigator.clipboard.writeText(tokenKey);
        setCopiedToken(tokenKey);
        setTimeout(() => setCopiedToken(""), 3000);
    };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Download Token Center</h1>
                    <p className="page-subtitle">Generate and manage secure download tokens connecting Export Operations with Client Document Downloads</p>
                </div>
                <button
                    className="secondary-action"
                    onClick={fetchData}
                    style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "6px" }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {error && (
                <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginTop: "15px" }}>
                    {error}
                </div>
            )}

            <div className="dashboard-grid" style={{ marginTop: "25px" }}>
                <div className="panel">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        <KeyRound size={22} color="#2563eb" />
                        <h2 style={{ margin: 0 }}>Generate New Token</h2>
                    </div>

                    <form onSubmit={handleGenerateToken} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Select Purchase Order</label>
                            <select
                                required
                                value={selectedOrder}
                                onChange={(e) => setSelectedOrder(e.target.value)}
                                style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                            >
                                <option value="">Select an Order</option>
                                {orders.map(o => (
                                    <option key={o.id} value={o.id}>
                                        {o.orderCode || `EXP-${o.id}`} - {o.buyerName} (${Number(o.amount).toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Buyer Email (Optional Notification)</label>
                            <input
                                type="email"
                                value={buyerEmail}
                                onChange={(e) => setBuyerEmail(e.target.value)}
                                placeholder="e.g. buyer@clientcompany.com"
                                style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Token Validity (Days)</label>
                            <select
                                value={expiryDays}
                                onChange={(e) => setExpiryDays(e.target.value)}
                                style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                            >
                                <option value="3">3 Days (Express Release)</option>
                                <option value="7">7 Days (Standard Release)</option>
                                <option value="14">14 Days (Extended Access)</option>
                                <option value="30">30 Days (Customs Clearance Window)</option>
                            </select>
                        </div>

                        <button type="submit" className="primary-action" disabled={submitting || !selectedOrder} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <KeyRound size={18} />
                            {submitting ? "Generating Token..." : "Generate Secure Download Token"}
                        </button>
                    </form>
                </div>

                <div className="panel" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <h2>Token Security & Workflow</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px", fontSize: "13px", color: "#475569" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <div><strong>Cryptographic Security:</strong> Each token is uniquely generated and stored against the purchase order.</div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <Clock size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <div><strong>Time-Bound Access:</strong> Tokens automatically expire once the designated validity window passes.</div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <CheckCircle2 size={18} color="#8b5cf6" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <div><strong>Client Portal Integration:</strong> Buyers enter token in <code>/client/documents</code> to download trade documents.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "30px" }}>
                <h2>Active & History Download Tokens</h2>
                <table style={{ marginTop: "15px" }}>
                    <thead>
                        <tr>
                            <th>Token Key</th>
                            <th>Order Code</th>
                            <th>Buyer Email</th>
                            <th>Issued At</th>
                            <th>Expires At</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Loading download tokens...</td>
                            </tr>
                        ) : tokens.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No download tokens generated yet.</td>
                            </tr>
                        ) : (
                            tokens.map((tokenObj) => (
                                <tr key={tokenObj.token}>
                                    <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb", fontSize: "14px" }}>
                                        {tokenObj.token}
                                    </td>
                                    <td><span style={{ fontWeight: 600, color: "#1e293b" }}>{tokenObj.orderCode}</span></td>
                                    <td>{tokenObj.buyerEmail || "Not specified"}</td>
                                    <td style={{ color: "#64748b" }}>{tokenObj.issuedAt ? new Date(tokenObj.issuedAt).toLocaleString() : "N/A"}</td>
                                    <td style={{ color: "#64748b" }}>{tokenObj.expiresAt ? new Date(tokenObj.expiresAt).toLocaleString() : "N/A"}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            background: tokenObj.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                                            color: tokenObj.status === "ACTIVE" ? "#15803d" : "#991b1b"
                                        }}>
                                            {tokenObj.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => handleCopy(tokenObj.token)}
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: "6px",
                                                    border: "1px solid #cbd5e1",
                                                    background: copiedToken === tokenObj.token ? "#dcfce7" : "white",
                                                    color: copiedToken === tokenObj.token ? "#15803d" : "#1e293b",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}
                                            >
                                                {copiedToken === tokenObj.token ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                                {copiedToken === tokenObj.token ? "Copied!" : "Copy Token"}
                                            </button>
                                            {tokenObj.status === "ACTIVE" && (
                                                <button
                                                    onClick={() => handleRevoke(tokenObj.token)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                        border: "1px solid #fca5a5",
                                                        background: "#fff5f5",
                                                        color: "#dc2626",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Revoke
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}