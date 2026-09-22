import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Plus } from "lucide-react";
import "../../components/dashboard.css";
import { getOrders, requestOrder, acceptQuote, rejectQuote } from "../../api/clientApi";

const REQUEST_STATUS_STYLE = {
    PENDING: { background: "#fef3c7", color: "#92400e" },
    QUOTED: { background: "#dbeafe", color: "#1e40af" },
    ACCEPTED: { background: "#dcfce7", color: "#15803d" },
    REJECTED: { background: "#fee2e2", color: "#991b1b" }
};

const EMPTY_FORM = { productName: "", quantity: "", destination: "", targetPrice: "", neededByDate: "", itemsDescription: "" };

export default function ClientOrders() {
    const [showModal, setShowModal] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [decidingId, setDecidingId] = useState(null);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 20, totalElements: 0, totalPages: 0 });

    const [requestForm, setRequestForm] = useState(EMPTY_FORM);

    const loadOrders = (targetPage = page) => {
        setLoading(true);
        getOrders({ page: targetPage })
            .then((data) => {
                setOrders(Array.isArray(data.content) ? data.content : []);
                setPage(data.page ?? targetPage);
                setPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
            })
            .catch((err) => setError(err.message || "Unable to load orders."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadOrders(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRequestOrder = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const created = await requestOrder({
                ...requestForm,
                quantity: parseInt(requestForm.quantity, 10),
                targetPrice: parseFloat(requestForm.targetPrice)
            });
            setOrders((current) => [created, ...current]);
            setRequestForm(EMPTY_FORM);
            setShowModal(false);
        } catch (err) {
            setError(err.message || "Unable to request order.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async (id) => {
        setDecidingId(id);
        setError("");
        try {
            const updated = await acceptQuote(id);
            setOrders((current) => current.map((o) => (o.id === id ? updated : o)));
        } catch (err) {
            setError(err.message || "Unable to accept quote.");
        } finally {
            setDecidingId(null);
        }
    };

    const handleReject = async (id) => {
        setDecidingId(id);
        setError("");
        try {
            const updated = await rejectQuote(id);
            setOrders((current) => current.map((o) => (o.id === id ? updated : o)));
        } catch (err) {
            setError(err.message || "Unable to reject quote.");
        } finally {
            setDecidingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">My Purchase Orders</h1>
                    <p className="page-subtitle">Request a new order with full details, then track the export manager's response and pipeline progress</p>
                </div>
                <button
                    className="primary-action"
                    onClick={() => setShowModal(true)}
                    style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <Plus size={18} />
                    Request New Order
                </button>
            </div>

            <div className="panel table-panel" style={{ marginTop: "25px", overflowX: "auto" }}>
                {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Product / Qty</th>
                            <th>Destination</th>
                            <th>Target Price</th>
                            <th>Needed By</th>
                            <th>Request Status</th>
                            <th>Manager's Response</th>
                            <th>Pipeline Stage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="8">Loading orders...</td></tr>}
                        {!loading && orders.length === 0 && <tr><td colSpan="8">No orders found.</td></tr>}
                        {!loading && orders.map((o) => {
                            const statusStyle = REQUEST_STATUS_STYLE[o.requestStatus] || REQUEST_STATUS_STYLE.PENDING;
                            return (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: 700, color: "#1e293b" }}>{o.orderCode}</td>
                                    <td style={{ fontWeight: 600 }}>{o.productName} {o.quantity ? `(${o.quantity})` : ""}</td>
                                    <td style={{ color: "#64748b" }}>{o.destination}</td>
                                    <td style={{ color: "#64748b" }}>{o.targetPrice != null ? `$${Number(o.targetPrice).toLocaleString()}` : "-"}</td>
                                    <td style={{ color: "#64748b" }}>{o.neededByDate}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                                            ...statusStyle
                                        }}>
                                            {o.requestStatus}
                                        </span>
                                    </td>
                                    <td>
                                        {o.requestStatus === "QUOTED" && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <span style={{ fontWeight: 700, color: "#0f766e" }}>
                                                    ${Number(o.managerQuotedPrice).toLocaleString()} by {o.managerQuotedDeliveryDate}
                                                </span>
                                                {o.managerNote && <small style={{ color: "#64748b" }}>{o.managerNote}</small>}
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        onClick={() => handleAccept(o.id)}
                                                        disabled={decidingId === o.id}
                                                        style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#16a34a", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(o.id)}
                                                        disabled={decidingId === o.id}
                                                        style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {o.requestStatus === "REJECTED" && o.managerNote && (
                                            <small style={{ color: "#991b1b" }}>{o.managerNote}</small>
                                        )}
                                        {o.requestStatus === "ACCEPTED" && (
                                            <span style={{ fontWeight: 700, color: "#0f766e" }}>${Number(o.amount).toLocaleString()} agreed</span>
                                        )}
                                        {o.requestStatus === "PENDING" && <small style={{ color: "#64748b" }}>Awaiting review</small>}
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                                            background: o.stage === "COMPLETED" ? "#dcfce7" : "#dbeafe",
                                            color: o.stage === "COMPLETED" ? "#15803d" : "#1e40af"
                                        }}>
                                            {o.requestStatus === "ACCEPTED" || o.requestStatus === "REJECTED" ? o.stage : "-"}
                                        </span>
                                    </td>
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
                    onPageChange={(nextPage) => loadOrders(nextPage)}
                />
            </div>

            {/* Modal for buyer to request new order */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="panel" style={{ width: "480px", maxWidth: "90%" }}>
                        <h2>Request Purchase Order</h2>
                        <form onSubmit={handleRequestOrder} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Product Name</label>
                                <input
                                    type="text"
                                    required
                                    value={requestForm.productName}
                                    onChange={(e) => setRequestForm({ ...requestForm, productName: e.target.value })}
                                    placeholder="e.g. Raw Jute"
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={requestForm.quantity}
                                        onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                                        placeholder="e.g. 500"
                                        style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Destination</label>
                                    <input
                                        type="text"
                                        required
                                        value={requestForm.destination}
                                        onChange={(e) => setRequestForm({ ...requestForm, destination: e.target.value })}
                                        placeholder="e.g. Rotterdam, NL"
                                        style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Target Price ($ USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={requestForm.targetPrice}
                                        onChange={(e) => setRequestForm({ ...requestForm, targetPrice: e.target.value })}
                                        placeholder="e.g. 95000"
                                        style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Needed By</label>
                                    <input
                                        type="date"
                                        required
                                        value={requestForm.neededByDate}
                                        onChange={(e) => setRequestForm({ ...requestForm, neededByDate: e.target.value })}
                                        style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Additional Notes (optional)</label>
                                <textarea
                                    rows={3}
                                    value={requestForm.itemsDescription}
                                    onChange={(e) => setRequestForm({ ...requestForm, itemsDescription: e.target.value })}
                                    placeholder="Packaging, HS codes, special handling..."
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="submit" className="primary-action" disabled={submitting}>{submitting ? "Submitting..." : "Submit Request"}</button>
                                <button type="button" className="secondary-action" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
