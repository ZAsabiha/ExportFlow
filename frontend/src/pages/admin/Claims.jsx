import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { AlertCircle } from "lucide-react";
import "../../components/dashboard.css";
import { getClaims, downloadClaimProofBlob, resolveClaim, rejectClaim } from "../../api/adminApi";
import { ApiError } from "../../api/client";
import { DOC_TYPES, docTypeLabels, toggleDocType } from "../../utils/documentTypes";

const STATUS_STYLE = {
    OPEN: { background: "#fef3c7", color: "#92400e" },
    RESOLVED: { background: "#dcfce7", color: "#15803d" },
    REJECTED: { background: "#fee2e2", color: "#991b1b" }
};

function errorMessage(err, fallback) {
    return err instanceof ApiError && err.message ? err.message : fallback;
}

export default function Claims() {
    const [claims, setClaims] = useState([]);
    const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0, size: 20 });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("OPEN");
    const [page, setPage] = useState(0);

    const [reviewing, setReviewing] = useState(null);
    const [rowError, setRowError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [adminResponse, setAdminResponse] = useState("");
    const [markVerified, setMarkVerified] = useState(true);
    const [deadline, setDeadline] = useState("");
    const [deadlineNote, setDeadlineNote] = useState("");
    const [requiredDocuments, setRequiredDocuments] = useState([]);

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getClaims({ page, status: statusFilter === "ALL" ? undefined : statusFilter });
            setClaims(data.content);
            setPageInfo({ totalElements: data.totalElements, totalPages: data.totalPages, size: data.size });
        } catch (err) {
            setClaims([]);
            setLoadError(errorMessage(err, "Couldn't load claims. Please try again."));
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const openReview = (claim) => {
        setReviewing(claim);
        setRowError(null);
        setAdminResponse("");
        setMarkVerified(true);
        setDeadline("");
        setDeadlineNote("");
        setRequiredDocuments(claim.requestedDocuments || []);
    };

    const handleViewProof = async (claim) => {
        try {
            const blob = await downloadClaimProofBlob(claim.id);
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
        } catch (err) {
            setRowError(errorMessage(err, "Unable to open proof attachment."));
        }
    };

    const handleResolve = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setRowError(null);
        try {
            await resolveClaim(reviewing.id, {
                adminResponse,
                markGovernmentVerified: markVerified,
                documentDeadline: deadline || null,
                deadlineNote: deadlineNote || null,
                requiredDocuments: deadline ? requiredDocuments : null
            });
            setReviewing(null);
            fetchClaims();
        } catch (err) {
            setRowError(errorMessage(err, "Unable to resolve this claim."));
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!adminResponse.trim()) {
            setRowError("Enter a response before rejecting.");
            return;
        }
        setSubmitting(true);
        setRowError(null);
        try {
            await rejectClaim(reviewing.id, { adminResponse });
            setReviewing(null);
            fetchClaims();
        } catch (err) {
            setRowError(errorMessage(err, "Unable to reject this claim."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div>
                <h1 className="page-title">Claims</h1>
                <p className="page-subtitle">Review client complaints about stalled orders. Resolving a claim can verify the order’s documents and set the export manager’s upload deadline.</p>
            </div>

            <div className="panel users-toolbar" style={{ marginTop: "25px" }}>
                <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                >
                    <option value="ALL">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {rowError && !reviewing && (
                <div className="inline-banner error">
                    <AlertCircle size={16} />
                    {rowError}
                </div>
            )}

            <div className="panel table-panel" style={{ marginTop: "20px" }}>
                <table>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Client</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Filed</th>
                            <th className="col-action">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="empty-state">Loading claims...</td></tr>
                        ) : loadError ? (
                            <tr><td colSpan={6} className="empty-state"><p>{loadError}</p></td></tr>
                        ) : claims.length === 0 ? (
                            <tr><td colSpan={6} className="empty-state">No claims found.</td></tr>
                        ) : (
                            claims.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 700, color: "#1e293b" }}>{c.orderCode}</td>
                                    <td>{c.submittedByName || c.submittedByEmail}</td>
                                    <td style={{ maxWidth: "280px", color: "#475569" }}>
                                        {c.message}
                                        {docTypeLabels(c.requestedDocuments).length > 0 && (
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                                Documents: {docTypeLabels(c.requestedDocuments).join(", ")}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                                            ...(STATUS_STYLE[c.status] || STATUS_STYLE.OPEN)
                                        }}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td style={{ color: "#64748b" }}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                                    <td className="col-action">
                                        <button className="status-toggle activate" onClick={() => openReview(c)}>
                                            Review
                                        </button>
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
                    onPageChange={(next) => setPage(next)}
                />
            </div>

            {reviewing && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="panel" style={{ width: "520px", maxWidth: "90%" }}>
                        <h2>Review claim · {reviewing.orderCode}</h2>
                        <p style={{ color: "#475569", marginTop: "8px" }}>{reviewing.message}</p>
                        {docTypeLabels(reviewing.requestedDocuments).length > 0 && (
                            <p style={{ color: "#475569", marginTop: "6px", fontSize: "13px" }}>
                                <strong>Client needs:</strong> {docTypeLabels(reviewing.requestedDocuments).join(", ")}
                            </p>
                        )}
                        {reviewing.hasProofAttachment && (
                            <button
                                onClick={() => handleViewProof(reviewing)}
                                style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, fontSize: "13px", marginTop: "6px" }}
                            >
                                View proof: {reviewing.proofOriginalFileName}
                            </button>
                        )}

                        {rowError && (
                            <div className="inline-banner error" style={{ marginTop: "12px" }}>
                                <AlertCircle size={16} />
                                {rowError}
                            </div>
                        )}

                        {reviewing.status !== "OPEN" ? (
                            <p style={{ marginTop: "16px", color: "#64748b" }}>
                                This claim was already {reviewing.status.toLowerCase()}: {reviewing.adminResponse}
                            </p>
                        ) : (
                            <form onSubmit={handleResolve} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Response to Client</label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        placeholder="e.g. Checked with customs - documents are verified, deadline set for the export manager."
                                        style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>

                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                                    <input type="checkbox" checked={markVerified} onChange={(e) => setMarkVerified(e.target.checked)} />
                                    Mark order's documents as government-verified
                                </label>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Document Upload Deadline (optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            disabled={!markVerified}
                                            style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                                {deadline && (
                                    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                                        <legend style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Documents Required by Deadline</legend>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 6px" }}>
                                            Pre-filled from the client's claim. These are listed in the Export Manager's deadline notification and reminder.
                                        </p>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px" }}>
                                            {DOC_TYPES.map((t) => (
                                                <label key={t.value} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={requiredDocuments.includes(t.value)}
                                                        onChange={() => setRequiredDocuments((current) => toggleDocType(current, t.value))}
                                                    />
                                                    {t.label}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                )}
                                {deadline && (
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Deadline Note (optional)</label>
                                        <input
                                            type="text"
                                            value={deadlineNote}
                                            onChange={(e) => setDeadlineNote(e.target.value)}
                                            placeholder="e.g. Confirmed with customs, please prioritize this order"
                                            style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                    <button type="submit" className="primary-action" disabled={submitting}>
                                        {submitting ? "Saving..." : "Resolve Claim"}
                                    </button>
                                    <button type="button" className="secondary-action" onClick={handleReject} disabled={submitting}>
                                        Reject Claim
                                    </button>
                                    <button type="button" className="secondary-action" onClick={() => setReviewing(null)}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
