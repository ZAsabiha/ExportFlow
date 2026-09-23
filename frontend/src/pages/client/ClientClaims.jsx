import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Plus } from "lucide-react";
import "../../components/dashboard.css";
import { getOrders, fileClaim, getMyClaims, downloadMyClaimProofBlob } from "../../api/clientApi";

const STATUS_STYLE = {
    OPEN: { background: "#fef3c7", color: "#92400e" },
    RESOLVED: { background: "#dcfce7", color: "#15803d" },
    REJECTED: { background: "#fee2e2", color: "#991b1b" }
};

const EMPTY_FORM = { orderId: "", message: "" };

export default function ClientClaims() {
    const [showModal, setShowModal] = useState(false);
    const [claims, setClaims] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 20, totalElements: 0, totalPages: 0 });

    const [form, setForm] = useState(EMPTY_FORM);
    const [proofFile, setProofFile] = useState(null);

    const loadClaims = (targetPage = page) => {
        setLoading(true);
        getMyClaims({ page: targetPage })
            .then((data) => {
                setClaims(Array.isArray(data.content) ? data.content : []);
                setPage(data.page ?? targetPage);
                setPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
            })
            .catch((err) => setError(err.message || "Unable to load claims."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadClaims(0);
        getOrders({ size: 100 })
            .then((data) => setOrders(Array.isArray(data.content) ? data.content : []))
            .catch(() => setOrders([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileClaim = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const created = await fileClaim({ orderId: form.orderId, message: form.message, proofFile });
            setClaims((current) => [created, ...current]);
            setForm(EMPTY_FORM);
            setProofFile(null);
            setShowModal(false);
        } catch (err) {
            setError(err.message || "Unable to file claim.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewProof = async (claim) => {
        try {
            const blob = await downloadMyClaimProofBlob(claim.id);
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
        } catch (err) {
            setError(err.message || "Unable to open proof attachment.");
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">My Claims</h1>
                    <p className="page-subtitle">Raise a complaint about an order that hasn't moved, with optional proof, and track Admin's response here.</p>
                </div>
                <button
                    className="primary-action"
                    onClick={() => setShowModal(true)}
                    style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <Plus size={18} />
                    File a Claim
                </button>
            </div>

            <div className="panel table-panel" style={{ marginTop: "25px", overflowX: "auto" }}>
                {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
                <table>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Admin Response</th>
                            <th>Filed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="5">Loading claims...</td></tr>}
                        {!loading && claims.length === 0 && <tr><td colSpan="5">You haven't filed any claims.</td></tr>}
                        {!loading && claims.map((c) => {
                            const statusStyle = STATUS_STYLE[c.status] || STATUS_STYLE.OPEN;
                            return (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 700, color: "#1e293b" }}>{c.orderCode}</td>
                                    <td style={{ color: "#475569", maxWidth: "280px" }}>
                                        {c.message}
                                        {c.hasProofAttachment && (
                                            <div>
                                                <button
                                                    className="link-button"
                                                    onClick={() => handleViewProof(c)}
                                                    style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, fontSize: "12px" }}
                                                >
                                                    View proof: {c.proofOriginalFileName}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                                            ...statusStyle
                                        }}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td style={{ color: "#64748b", maxWidth: "280px" }}>
                                        {c.adminResponse || (c.status === "OPEN" ? "Awaiting review" : "-")}
                                    </td>
                                    <td style={{ color: "#64748b" }}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <Pagination
                    page={page}
                    size={pageInfo.size}
                    totalElements={pageInfo.totalElements}
                    totalPages={pageInfo.totalPages}
                    onPageChange={(nextPage) => loadClaims(nextPage)}
                />
            </div>

            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="panel" style={{ width: "480px", maxWidth: "90%" }}>
                        <h2>File a Claim</h2>
                        <form onSubmit={handleFileClaim} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Order</label>
                                <select
                                    required
                                    value={form.orderId}
                                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="" disabled>Select an order...</option>
                                    {orders.map((o) => (
                                        <option key={o.id} value={o.id}>{o.orderCode} - {o.productName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Your Complaint</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    placeholder="e.g. I requested this order weeks ago and it still hasn't been processed..."
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Proof Attachment (optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    style={{ width: "100%", marginTop: "4px" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="submit" className="primary-action" disabled={submitting}>{submitting ? "Submitting..." : "Submit Claim"}</button>
                                <button type="button" className="secondary-action" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
