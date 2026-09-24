import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { KeyRound, Copy, CheckCircle2, ShieldCheck, Clock, RefreshCw, Trash2, Search, FileSpreadsheet, RotateCcw, AlertTriangle } from "lucide-react";
import {
    getAllTokens,
    getOrders,
    generateToken,
    revokeToken,
    launchBulkTokenGeneration,
    getBulkTokenGenerationStatus,
    getBulkTokenGenerationErrors,
    retryBulkTokenGeneration
} from "../../api/exportManagerApi";
import "../../components/dashboard.css";

// Orders are only fetched here to populate the "purchase order" dropdown, so this pulls
// a generous bounded batch rather than the paginated order-history page size.
const ORDER_OPTIONS_SIZE = 500;

// Bulk generation job statuses that mean the batch job is still running, so status
// polling should keep going until it lands on one outside this set.
const IN_PROGRESS_STATUSES = ["STARTING", "STARTED"];
const BULK_GENERATION_POLL_MS = 3000;

export default function TokenCenter() {
    const [selectedOrder, setSelectedOrder] = useState("");
    const [buyerEmail, setBuyerEmail] = useState("");
    const [expiryDays, setExpiryDays] = useState("7");
    const [copiedToken, setCopiedToken] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 10, totalElements: 0, totalPages: 0 });
    const [error, setError] = useState(null);

    // Bulk token generation (Excel manifest) state
    const [manifestFile, setManifestFile] = useState(null);
    const [bulkLaunching, setBulkLaunching] = useState(false);
    const [bulkJob, setBulkJob] = useState(null);
    const [bulkError, setBulkError] = useState(null);
    const [bulkErrors, setBulkErrors] = useState([]);
    const [bulkErrorsPage, setBulkErrorsPage] = useState(0);
    const [bulkErrorsPageInfo, setBulkErrorsPageInfo] = useState({ size: 10, totalElements: 0, totalPages: 0 });
    const [showBulkErrors, setShowBulkErrors] = useState(false);
    const [bulkRetrying, setBulkRetrying] = useState(false);
    const pollTimerRef = useRef(null);

    const fetchData = async (targetPage = page) => {
        setLoading(true);
        setError(null);
        try {
            const [tokensData, ordersData] = await Promise.all([
                getAllTokens({ page: targetPage }),
                getOrders({ size: ORDER_OPTIONS_SIZE })
            ]);
            const tokensList = Array.isArray(tokensData.content) ? tokensData.content : [];
            const ordersList = Array.isArray(ordersData.content) ? ordersData.content : [];
            setTokens(tokensList);
            setPage(tokensData.page ?? targetPage);
            setPageInfo({ size: tokensData.size, totalElements: tokensData.totalElements, totalPages: tokensData.totalPages });
            setOrders(ordersList);
            if (ordersList.length > 0) {
                setSelectedOrder(prev => prev || ordersList[0].id.toString());
            }
        } catch (err) {
            setError(err.message || "Failed to load download tokens");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Poll the batch job's status while it's still running, then stop once it lands on
    // a terminal state (COMPLETED / FAILED / STOPPED / ABANDONED).
    useEffect(() => {
        if (!bulkJob || !IN_PROGRESS_STATUSES.includes(bulkJob.status)) {
            return undefined;
        }
        pollTimerRef.current = setTimeout(async () => {
            try {
                const updated = await getBulkTokenGenerationStatus(bulkJob.jobExecutionId);
                setBulkJob(updated);
                if (!IN_PROGRESS_STATUSES.includes(updated.status)) {
                    fetchData(0);
                }
            } catch (err) {
                setBulkError(err.message || "Failed to refresh generation status");
            }
        }, BULK_GENERATION_POLL_MS);
        return () => clearTimeout(pollTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bulkJob]);

    const handleManifestChange = (e) => {
        setManifestFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
    };

    const handleBulkLaunch = async (e) => {
        e.preventDefault();
        if (!manifestFile) {
            setBulkError("Please select a manifest spreadsheet.");
            return;
        }
        setBulkLaunching(true);
        setBulkError(null);
        setShowBulkErrors(false);
        setBulkErrors([]);
        try {
            const status = await launchBulkTokenGeneration(manifestFile);
            setBulkJob(status);
            setManifestFile(null);
        } catch (err) {
            setBulkError(err.message || "Failed to launch bulk token generation");
        } finally {
            setBulkLaunching(false);
        }
    };

    const fetchBulkErrors = async (targetPage = 0) => {
        if (!bulkJob) return;
        setBulkError(null);
        try {
            const data = await getBulkTokenGenerationErrors(bulkJob.jobExecutionId, { page: targetPage });
            setBulkErrors(Array.isArray(data.content) ? data.content : []);
            setBulkErrorsPage(data.page ?? targetPage);
            setBulkErrorsPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
            setShowBulkErrors(true);
        } catch (err) {
            setBulkError(err.message || "Failed to load generation errors");
        }
    };

    const handleBulkRetry = async () => {
        if (!bulkJob) return;
        setBulkRetrying(true);
        setBulkError(null);
        try {
            const status = await retryBulkTokenGeneration(bulkJob.jobExecutionId);
            setBulkJob(status);
            setShowBulkErrors(false);
            setBulkErrors([]);
        } catch (err) {
            setBulkError(err.message || "Failed to retry generation job");
        } finally {
            setBulkRetrying(false);
        }
    };

    const statusColors = (status) => {
        switch (status) {
            case "COMPLETED":
                return { bg: "var(--green-100)", text: "var(--green-700)" };
            case "FAILED":
            case "ABANDONED":
                return { bg: "var(--red-100)", text: "var(--red-800)" };
            case "STARTING":
            case "STARTED":
                return { bg: "var(--blue-100)", text: "var(--blue-700)" };
            default:
                return { bg: "var(--slate-100)", text: "var(--slate-600)" };
        }
    };

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

    const filteredTokens = tokens.filter((t) => {
        const search = searchTerm.toLowerCase();
        const tokenStr = (t.token || "").toLowerCase();
        const codeStr = (t.orderCode || "").toLowerCase();
        const emailStr = (t.buyerEmail || "").toLowerCase();
        return tokenStr.includes(search) || codeStr.includes(search) || emailStr.includes(search);
    });

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Download Tokens</h1>
                    <p className="page-subtitle">Issue and manage the secure tokens clients use to download their trade documents.</p>
                </div>
                <button
                    className="secondary-action"
                    onClick={() => fetchData()}
                    style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "6px" }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {error && (
                <div style={{ background: "var(--red-100)", color: "var(--red-800)", padding: "12px 16px", borderRadius: "8px", marginTop: "15px" }}>
                    {error}
                </div>
            )}

            <div className="dashboard-grid" style={{ marginTop: "25px" }}>
                <div className="panel">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        <KeyRound size={22} color="var(--blue-600)" />
                        <h2 style={{ margin: 0 }}>Generate New Token</h2>
                    </div>

                    <form onSubmit={handleGenerateToken} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>Select Purchase Order</label>
                            <select
                                required
                                value={selectedOrder}
                                onChange={(e) => setSelectedOrder(e.target.value)}
                                style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid var(--slate-300)" }}
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
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>Buyer Email (Optional Notification)</label>
                            <input
                                type="email"
                                value={buyerEmail}
                                onChange={(e) => setBuyerEmail(e.target.value)}
                                placeholder="e.g. buyer@clientcompany.com"
                                style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid var(--slate-300)" }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>Token Validity (Days)</label>
                            <select
                                value={expiryDays}
                                onChange={(e) => setExpiryDays(e.target.value)}
                                style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid var(--slate-300)" }}
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

                <div className="panel" style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)" }}>
                    <h2>How Tokens Work</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px", fontSize: "13px", color: "var(--slate-600)" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <ShieldCheck size={18} color="var(--emerald-600)" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <div><strong>Cryptographic Security:</strong> Each token is uniquely generated and stored against the purchase order.</div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <Clock size={18} color="var(--blue-500)" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <div><strong>Time-Bound Access:</strong> Tokens automatically expire once the designated validity window passes.</div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <CheckCircle2 size={18} color="var(--violet-500)" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <div><strong>Client Portal Integration:</strong> Buyers enter token in <code>/client/documents</code> to download trade documents.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel" style={{ marginTop: "25px" }}>
                <h2>Bulk Generate · Excel Manifest</h2>
                <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "6px" }}>
                    Issue a download token for many orders in one submission: an Excel manifest listing
                    <code style={{ margin: "0 4px" }}>orderCode / buyerEmail / expiryDays</code>
                    per row (buyerEmail and expiryDays are optional; expiryDays defaults to 7).
                </p>
                <form onSubmit={handleBulkLaunch}>
                    <div style={{ maxWidth: "360px", margin: "15px 0" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>Manifest (.xlsx)</label>
                        <div className="upload-box" style={{ padding: "20px", marginTop: "4px" }}>
                            <input
                                type="file"
                                id="tokenManifestUpload"
                                accept=".xlsx,.xls"
                                onChange={handleManifestChange}
                            />
                            <label htmlFor="tokenManifestUpload" style={{ cursor: "pointer" }}>
                                <FileSpreadsheet size={28} color="var(--blue-500)" />
                                <p style={{ marginTop: "8px", fontSize: "13px", fontWeight: 600 }}>
                                    {manifestFile ? manifestFile.name : "Select manifest spreadsheet"}
                                </p>
                            </label>
                        </div>
                    </div>

                    {bulkError && (
                        <div style={{ background: "var(--red-100)", color: "var(--red-800)", padding: "10px 14px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px" }}>
                            {bulkError}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-action"
                        disabled={bulkLaunching || !manifestFile}
                    >
                        {bulkLaunching ? "Launching Generation..." : "Launch Bulk Token Generation"}
                    </button>
                </form>

                {bulkJob && (
                    <div style={{ marginTop: "20px", padding: "16px", borderRadius: "8px", background: "var(--slate-50)", border: "1px solid var(--slate-200)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontWeight: 700, color: "var(--slate-800)" }}>Job #{bulkJob.jobExecutionId}</span>
                                <span style={{
                                    padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700,
                                    background: statusColors(bulkJob.status).bg, color: statusColors(bulkJob.status).text
                                }}>
                                    {bulkJob.status}
                                    {IN_PROGRESS_STATUSES.includes(bulkJob.status) ? "..." : ""}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                {bulkJob.skippedCount > 0 && (
                                    <button
                                        type="button"
                                        className="secondary-action"
                                        style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "6px" }}
                                        onClick={() => (showBulkErrors ? setShowBulkErrors(false) : fetchBulkErrors(0))}
                                    >
                                        <AlertTriangle size={14} /> {showBulkErrors ? "Hide" : "View"} Errors ({bulkJob.skippedCount})
                                    </button>
                                )}
                                {bulkJob.status === "FAILED" && (
                                    <button
                                        type="button"
                                        className="secondary-action"
                                        style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "6px" }}
                                        onClick={handleBulkRetry}
                                        disabled={bulkRetrying}
                                    >
                                        <RotateCcw size={14} /> {bulkRetrying ? "Retrying..." : "Retry"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "14px" }}>
                            <div>
                                <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>Rows Read</div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-800)" }}>{bulkJob.readCount}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>Tokens Generated</div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--green-700)" }}>{bulkJob.successCount}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>Skipped / Failed Rows</div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: bulkJob.skippedCount > 0 ? "var(--red-700)" : "var(--slate-800)" }}>{bulkJob.skippedCount}</div>
                            </div>
                        </div>

                        {bulkJob.exitDescription && (
                            <p style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "10px", whiteSpace: "pre-wrap" }}>
                                {bulkJob.exitDescription}
                            </p>
                        )}

                        {showBulkErrors && (
                            <div style={{ marginTop: "16px" }}>
                                <table style={{ marginTop: "0" }}>
                                    <thead>
                                        <tr>
                                            <th>Row</th>
                                            <th>Order Code</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkErrors.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: "center", padding: "16px", color: "var(--slate-500)" }}>No error rows found.</td>
                                            </tr>
                                        ) : (
                                            bulkErrors.map((err, idx) => (
                                                <tr key={`${err.rowNumber}-${idx}`}>
                                                    <td>{err.rowNumber}</td>
                                                    <td>{err.orderCode}</td>
                                                    <td style={{ color: "var(--red-700)" }}>{err.message}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <Pagination
                                    page={bulkErrorsPage}
                                    size={bulkErrorsPageInfo.size}
                                    totalElements={bulkErrorsPageInfo.totalElements}
                                    totalPages={bulkErrorsPageInfo.totalPages}
                                    onPageChange={(nextPage) => fetchBulkErrors(nextPage)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="panel" style={{ marginTop: "25px", padding: "20px" }}>
                <div className="search-box" style={{ width: "100%" }}>
                    <Search size={18} color="var(--slate-500)" />
                    <input
                        type="text"
                        placeholder="Search tokens on this page by Token Key, Order Code, or Buyer Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "20px" }}>
                <h2>Token History</h2>
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
                        ) : filteredTokens.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "var(--slate-500)" }}>
                                    {tokens.length === 0 ? "No download tokens generated yet." : "No matching tokens found."}
                                </td>
                            </tr>
                        ) : (
                            filteredTokens.map((tokenObj) => (
                                <tr key={tokenObj.token}>
                                    <td style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--blue-600)", fontSize: "14px" }}>
                                        {tokenObj.token}
                                    </td>
                                    <td><span style={{ fontWeight: 600, color: "var(--slate-800)" }}>{tokenObj.orderCode}</span></td>
                                    <td>{tokenObj.buyerEmail || "Not specified"}</td>
                                    <td style={{ color: "var(--slate-500)" }}>{tokenObj.issuedAt ? new Date(tokenObj.issuedAt).toLocaleString() : "N/A"}</td>
                                    <td style={{ color: "var(--slate-500)" }}>{tokenObj.expiresAt ? new Date(tokenObj.expiresAt).toLocaleString() : "N/A"}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            background: tokenObj.status === "ACTIVE" ? "var(--green-100)" : "var(--red-100)",
                                            color: tokenObj.status === "ACTIVE" ? "var(--green-700)" : "var(--red-800)"
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
                                                    border: "1px solid var(--slate-300)",
                                                    background: copiedToken === tokenObj.token ? "var(--green-100)" : "var(--surface)",
                                                    color: copiedToken === tokenObj.token ? "var(--green-700)" : "var(--slate-800)",
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
                                                        border: "1px solid var(--red-300)",
                                                        background: "var(--red-25)",
                                                        color: "var(--red-600)",
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
                <Pagination
                    page={page}
                    size={pageInfo.size}
                    totalElements={pageInfo.totalElements}
                    totalPages={pageInfo.totalPages}
                    onPageChange={(nextPage) => fetchData(nextPage)}
                />
            </div>
        </DashboardLayout>
    );
}