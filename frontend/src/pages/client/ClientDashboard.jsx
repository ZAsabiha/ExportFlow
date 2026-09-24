import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { ShoppingCart, Package, Receipt, FileText, ArrowUpRight, KeyRound } from "lucide-react";
import "../../components/dashboard.css";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../../api/clientApi";

const STAGES = ["CREATED", "APPROVED", "DOCUMENTS", "PAID", "SHIPMENT", "COMPLETED"];
const STAGE_LABELS = { CREATED: "Created", APPROVED: "Approved", DOCUMENTS: "Documents", PAID: "Paid", SHIPMENT: "Shipment", COMPLETED: "Completed" };
const REQUEST_STATUS_BADGE = {
    PENDING: { background: "var(--amber-100)", color: "var(--amber-800)" },
    QUOTED: { background: "var(--blue-100)", color: "var(--blue-800)" },
    REJECTED: { background: "var(--red-100)", color: "var(--red-800)" }
};

export default function ClientDashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getDashboard()
            .then(setDashboard)
            .catch((err) => setError(err.message || "Unable to load dashboard."));
    }, []);

    const money = (value) => value == null ? "$0" : `$${Number(value).toLocaleString()}`;

    // Prefer an order that's actually moving through the pipeline; fall back to the
    // most recent order of any kind so the panel still has something to show.
    const activeOrder = dashboard?.recentOrders?.find((o) => o.requestStatus === "ACCEPTED" && o.stage !== "COMPLETED")
        || dashboard?.recentOrders?.[0]
        || null;
    const activeStageIdx = activeOrder && activeOrder.requestStatus === "ACCEPTED" ? STAGES.indexOf(activeOrder.stage) : -1;
    const stats = [
        { title: "My Purchase Orders", value: `${dashboard?.activeOrdersCount ?? 0} Active`, subtitle: `${dashboard?.ordersInFulfillmentCount ?? 0} In Fulfillment`, icon: <ShoppingCart size={24} /> },
        { title: "Active Shipments", value: `${dashboard?.shipmentsInTransitCount ?? 0} In Transit`, subtitle: dashboard?.nearestShipmentEta ? `ETA ${dashboard.nearestShipmentEta}` : "No upcoming shipment", icon: <Package size={24} /> },
        { title: "Invoices", value: `${dashboard?.invoicesPaidCount ?? 0} Paid / ${dashboard?.invoicesDueCount ?? 0} Due`, subtitle: `${money(dashboard?.totalPaidAmount)} Paid`, icon: <Receipt size={24} /> },
        { title: "Trade Documents", value: `${dashboard?.unlockedTokensCount ?? 0} Unlocked`, subtitle: `${dashboard?.ordersAwaitingTokenCount ?? 0} Pending Token`, icon: <FileText size={24} /> }
    ];

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Overview</h1>
                    <p className="page-subtitle">Track your orders, shipments and invoices, and unlock trade documents with your secure tokens.</p>
                </div>
                <button 
                    className="primary-action" 
                    onClick={() => navigate("/client/documents")}
                    style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <KeyRound size={18} />
                    Enter Download Token
                </button>
            </div>
            {error && <p role="alert" style={{ color: "var(--red-700)" }}>{error}</p>}

            <div className="stats-grid">
                {stats.map((item, idx) => (
                    <div className="stat-card" key={idx}>
                        {item.icon}
                        <h3>{item.value}</h3>
                        <p style={{ fontWeight: 600, color: "var(--slate-800)", margin: 0 }}>{item.title}</p>
                        <small style={{ color: "var(--slate-500)" }}>{item.subtitle}</small>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <h2>Active Order Progress</h2>
                    <div style={{ marginTop: "20px", border: "1px solid var(--slate-200)", borderRadius: "10px", padding: "16px", background: "var(--slate-50)" }}>
                        {!activeOrder ? (
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--slate-500)" }}>No orders yet - request one to see its progress here.</p>
                        ) : (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div>
                                        <span style={{ fontWeight: 700, color: "var(--slate-800)" }}>{activeOrder.orderCode}</span>
                                        <small style={{ display: "block", color: "var(--slate-500)" }}>
                                            {activeOrder.productName}{activeOrder.quantity ? ` (${activeOrder.quantity})` : ""}
                                            {activeOrder.requestStatus === "ACCEPTED" && ` • ${money(activeOrder.amount)}`}
                                        </small>
                                    </div>
                                    <span style={{
                                        padding: "4px 10px", borderRadius: "12px", fontWeight: 700, fontSize: "12px",
                                        ...(activeOrder.requestStatus === "ACCEPTED"
                                            ? { background: activeOrder.stage === "COMPLETED" ? "var(--green-100)" : "var(--blue-100)", color: activeOrder.stage === "COMPLETED" ? "var(--green-700)" : "var(--blue-800)" }
                                            : REQUEST_STATUS_BADGE[activeOrder.requestStatus] || REQUEST_STATUS_BADGE.PENDING)
                                    }}>
                                        {activeOrder.requestStatus === "ACCEPTED" ? (STAGE_LABELS[activeOrder.stage] || activeOrder.stage) : activeOrder.requestStatus}
                                    </span>
                                </div>

                                <div className="pipeline" style={{ marginTop: "15px" }}>
                                    {STAGES.map((stage, idx) => {
                                        let style;
                                        if (activeStageIdx === -1) {
                                            style = { background: "var(--slate-200)", color: "var(--slate-500)" };
                                        } else if (idx < activeStageIdx) {
                                            style = { background: "var(--green-100)", color: "var(--green-700)", fontWeight: 700 };
                                        } else if (idx === activeStageIdx) {
                                            style = { background: "var(--blue-500)", color: "white", fontWeight: 700 };
                                        } else {
                                            style = { background: "var(--slate-200)", color: "var(--slate-500)" };
                                        }
                                        return <span key={stage} style={style}>{idx + 1}. {STAGE_LABELS[stage]}</span>;
                                    })}
                                </div>
                                {activeOrder.requestStatus !== "ACCEPTED" && (
                                    <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--slate-400)" }}>
                                        Processing starts once this request is accepted.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="panel" style={{ borderLeft: "4px solid var(--blue-500)" }}>
                    <h2>Trade Documents</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", margin: "12px 0", lineHeight: 1.5 }}>
                        Received a Download Token from Export Manager? Use your token to unlock and download official Commercial Invoice, Bill of Lading, Certificate of Origin, and Packing List.
                    </p>
                    <button className="secondary-action" onClick={() => navigate("/client/documents")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Go to Documents & Tokens</span>
                        <ArrowUpRight size={16} />
                    </button>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "30px" }}>
                <h2>Recent Orders</h2>
                <table style={{ marginTop: "15px" }}>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Product</th>
                            <th>Request Status</th>
                            <th>Amount</th>
                            <th>Current Stage</th>
                            <th>Document Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!dashboard && <tr><td colSpan="6">Loading orders...</td></tr>}
                        {dashboard?.recentOrders?.length === 0 && <tr><td colSpan="6">No orders found.</td></tr>}
                        {dashboard?.recentOrders?.map((order) => (
                            <tr key={order.id}>
                                <td style={{ fontWeight: 700 }}>{order.orderCode}</td>
                                <td>{order.productName} {order.quantity ? `(${order.quantity})` : ""}</td>
                                <td><span style={{ fontWeight: 600, color: "var(--slate-600)" }}>{order.requestStatus}</span></td>
                                <td style={{ fontWeight: 700, color: "var(--teal-700)" }}>{order.requestStatus === "ACCEPTED" ? money(order.amount) : "Quote pending"}</td>
                                <td><span style={{ fontWeight: 600, color: "var(--blue-600)" }}>{order.requestStatus === "ACCEPTED" ? order.stage : "-"}</span></td>
                                <td><span style={{ color: order.paymentStatus === "PAID" ? "var(--green-600)" : "var(--slate-500)", fontWeight: 700, fontSize: "13px" }}>{order.paymentStatus}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
