import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Search, Filter, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getOrders, quoteOrder, declineOrder, advanceOrderStage } from "../../api/exportManagerApi";
import { deadlineColors, deadlineTooltip, formatDeadline } from "../../utils/deadline";
import { docTypeLabels } from "../../utils/documentTypes";
import "../../components/dashboard.css";

const STAGES = ["CREATED", "APPROVED", "DOCUMENTS", "PAID", "SHIPMENT", "COMPLETED"];

const REQUEST_STATUS_STYLE = {
    PENDING: { background: "#fef3c7", color: "#92400e" },
    QUOTED: { background: "#dbeafe", color: "#1e40af" },
    ACCEPTED: { background: "#dcfce7", color: "#15803d" },
    REJECTED: { background: "#fee2e2", color: "#991b1b" }
};

export default function Orders() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("PENDING");

    const [loading, setLoading] = useState(true);
    const [orderList, setOrderList] = useState([]);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 20, totalElements: 0, totalPages: 0 });
    const [error, setError] = useState(null);

    const [quoteTarget, setQuoteTarget] = useState(null); // order being quoted
    const [quoteForm, setQuoteForm] = useState({ quotedPrice: "", quotedDeliveryDate: "", managerNote: "" });
    const [submitting, setSubmitting] = useState(false);

    const [declineTarget, setDeclineTarget] = useState(null);
    const [declineReason, setDeclineReason] = useState("");

    const fetchOrdersList = async (targetPage = page) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getOrders({ page: targetPage });
            setOrderList(Array.isArray(data.content) ? data.content : []);
            setPage(data.page ?? targetPage);
            setPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
        } catch (err) {
            setError(err.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdersList(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openQuoteModal = (order) => {
        setQuoteTarget(order);
        setQuoteForm({ quotedPrice: order.targetPrice || "", quotedDeliveryDate: order.neededByDate || "", managerNote: "" });
    };

    const handleSubmitQuote = async (e) => {
        e.preventDefault();
        if (!quoteTarget) return;
        setSubmitting(true);
        setError(null);
        try {
            const updated = await quoteOrder(quoteTarget.id, {
                quotedPrice: parseFloat(quoteForm.quotedPrice),
                quotedDeliveryDate: quoteForm.quotedDeliveryDate,
                managerNote: quoteForm.managerNote
            });
            setOrderList((current) => current.map((o) => (o.id === updated.id ? updated : o)));
            setQuoteTarget(null);
        } catch (err) {
            setError(err.message || "Failed to send quote");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitDecline = async (e) => {
        e.preventDefault();
        if (!declineTarget) return;
        setSubmitting(true);
        setError(null);
        try {
            const updated = await declineOrder(declineTarget.id, declineReason);
            setOrderList((current) => current.map((o) => (o.id === updated.id ? updated : o)));
            setDeclineTarget(null);
            setDeclineReason("");
        } catch (err) {
            setError(err.message || "Failed to decline request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartProcessing = async (id) => {
        try {
            const updated = await advanceOrderStage(id, "APPROVED");
            setOrderList((current) => current.map((o) => (o.id === id ? updated : o)));
        } catch (err) {
            setError(err.message || "Failed to start processing order");
        }
    };

    const handleAdvanceStage = async (id, currentStage) => {
        const currentIdx = STAGES.indexOf(currentStage);
        if (currentIdx === -1 || currentIdx >= STAGES.length - 1) return;
        const nextStage = STAGES[currentIdx + 1];

        try {
            const updated = await advanceOrderStage(id, nextStage);
            setOrderList((current) => current.map((o) => (o.id === id ? updated : o)));
        } catch (err) {
            setError(err.message || `Failed to advance order stage to ${nextStage}`);
        }
    };

    const filteredOrders = orderList.filter(o => {
        const codeStr = (o.orderCode || `EXP-${o.id}`).toLowerCase();
        const buyerStr = (o.buyerName || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        const matchesSearch = codeStr.includes(search) || buyerStr.includes(search);
        const matchesStatus = statusFilter === "ALL" || o.requestStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Export Orders</h1>
                    <p className="page-subtitle">Review client requests, respond with quotes and move accepted orders through the pipeline.</p>
                </div>
                <button
                    className="secondary-action"
                    onClick={() => fetchOrdersList()}
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

            <div className="panel" style={{ marginTop: "25px", padding: "20px" }}>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="search-box" style={{ flex: 1, minWidth: "280px" }}>
                        <Search size={18} color="#64748b" />
                        <input
                            type="text"
                            placeholder="Search orders on this page by Order Code or Buyer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Filter size={18} color="#64748b" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                        >
                            <option value="ALL">All Requests</option>
                            <option value="PENDING">Pending Review</option>
                            <option value="QUOTED">Awaiting Client Decision</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "20px", overflowX: "auto" }}>
                <table>
                    <thead>
                        <tr>
                            <th>Order Code</th>
                            <th>Buyer</th>
                            <th>Product / Qty</th>
                            <th>Destination</th>
                            <th>Target Price</th>
                            <th>Needed By</th>
                            <th>Request Status</th>
                            <th>Pipeline Stage</th>
                            <th>Doc Deadline</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>Loading orders...</td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="10" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No matching orders found.</td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => {
                                const currentIdx = STAGES.indexOf(order.stage);
                                const isLastStage = currentIdx === STAGES.length - 1;
                                const statusStyle = REQUEST_STATUS_STYLE[order.requestStatus] || REQUEST_STATUS_STYLE.PENDING;
                                const canProcessPipeline = order.requestStatus === "ACCEPTED";
                                return (
                                    <tr key={order.id}>
                                        <td style={{ fontWeight: 700, color: "#1e293b" }}>{order.orderCode || `EXP-${order.id}`}</td>
                                        <td style={{ fontWeight: 600 }}>{order.buyerName}</td>
                                        <td style={{ color: "#475569" }}>{order.productName} {order.quantity ? `(${order.quantity})` : ""}</td>
                                        <td style={{ color: "#475569" }}>{order.destination}</td>
                                        <td style={{ fontWeight: 700, color: "#0f766e" }}>{order.targetPrice != null ? `$${Number(order.targetPrice).toLocaleString()}` : "-"}</td>
                                        <td style={{ color: "#475569" }}>{order.neededByDate}</td>
                                        <td>
                                            <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, ...statusStyle }}>
                                                {order.requestStatus}
                                            </span>
                                        </td>
                                        <td>
                                            {canProcessPipeline ? (
                                                <span style={{
                                                    padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                                                    background: order.stage === "COMPLETED" ? "#dcfce7" : "#dbeafe",
                                                    color: order.stage === "COMPLETED" ? "#15803d" : "#1e40af"
                                                }}>
                                                    {order.stage}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {order.documentDeadline ? (
                                                <span style={{
                                                    padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                                                    background: deadlineColors(order.documentDeadline).bg,
                                                    color: deadlineColors(order.documentDeadline).text
                                                }} title={deadlineTooltip(order)}>
                                                    {formatDeadline(order.documentDeadline)}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>-</span>
                                            )}
                                            {order.documentDeadline && docTypeLabels(order.requiredDocuments).length > 0 && (
                                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", maxWidth: "200px" }}>
                                                    Due: {docTypeLabels(order.requiredDocuments).join(", ")}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {order.requestStatus === "PENDING" && (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        onClick={() => openQuoteModal(order)}
                                                        style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                    >
                                                        Respond
                                                    </button>
                                                    <button
                                                        onClick={() => setDeclineTarget(order)}
                                                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                            {order.requestStatus === "QUOTED" && (
                                                <span style={{ fontSize: "12px", color: "#64748b" }}>Waiting on client</span>
                                            )}
                                            {order.requestStatus === "ACCEPTED" && order.stage === "CREATED" && (
                                                <button
                                                    onClick={() => handleStartProcessing(order.id)}
                                                    style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#16a34a", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                >
                                                    Start Processing
                                                </button>
                                            )}
                                            {canProcessPipeline && order.stage !== "CREATED" && !isLastStage && (
                                                <button
                                                    onClick={() => handleAdvanceStage(order.id, order.stage)}
                                                    style={{
                                                        padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white",
                                                        cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px"
                                                    }}
                                                >
                                                    Next Stage <ArrowRight size={12} />
                                                </button>
                                            )}
                                            {canProcessPipeline && isLastStage && (
                                                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>Completed</span>
                                            )}
                                            {order.requestStatus === "REJECTED" && (
                                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Closed</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <Pagination
                    page={page}
                    size={pageInfo.size}
                    totalElements={pageInfo.totalElements}
                    totalPages={pageInfo.totalPages}
                    onPageChange={(nextPage) => fetchOrdersList(nextPage)}
                />
            </div>

            {/* Modal: respond with a quote */}
            {quoteTarget && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="panel" style={{ width: "450px", maxWidth: "90%" }}>
                        <h2>Respond to {quoteTarget.orderCode}</h2>
                        <p style={{ fontSize: "13px", color: "#64748b", marginTop: "6px" }}>
                            {quoteTarget.productName} ({quoteTarget.quantity}) to {quoteTarget.destination} &bull; client target ${Number(quoteTarget.targetPrice).toLocaleString()} by {quoteTarget.neededByDate}
                        </p>
                        <form onSubmit={handleSubmitQuote} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Quoted Price ($ USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={quoteForm.quotedPrice}
                                    onChange={(e) => setQuoteForm({ ...quoteForm, quotedPrice: e.target.value })}
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Delivery Date</label>
                                <input
                                    type="date"
                                    required
                                    value={quoteForm.quotedDeliveryDate}
                                    onChange={(e) => setQuoteForm({ ...quoteForm, quotedDeliveryDate: e.target.value })}
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Note to Client (optional)</label>
                                <textarea
                                    rows={3}
                                    value={quoteForm.managerNote}
                                    onChange={(e) => setQuoteForm({ ...quoteForm, managerNote: e.target.value })}
                                    placeholder="e.g. Confirmed with supplier, can meet this timeline."
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="submit" className="primary-action" disabled={submitting}>{submitting ? "Sending..." : "Send Quote"}</button>
                                <button type="button" className="secondary-action" onClick={() => setQuoteTarget(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: decline request outright */}
            {declineTarget && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="panel" style={{ width: "420px", maxWidth: "90%" }}>
                        <h2>Decline {declineTarget.orderCode}</h2>
                        <form onSubmit={handleSubmitDecline} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Reason</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder="e.g. No supplier available for this quantity within the timeline."
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="submit" className="primary-action" disabled={submitting}>{submitting ? "Declining..." : "Decline Request"}</button>
                                <button type="button" className="secondary-action" onClick={() => setDeclineTarget(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
