import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { ShoppingCart, Package, Receipt, FileCheck, Download, RefreshCw } from "lucide-react";
import { getOrders, getAllShipments, getAllInvoices, getAllDocuments, downloadExportReport } from "../../api/exportManagerApi";
import { downloadBlob } from "../../utils/blobView";
import "../../components/dashboard.css";

export default function ExportManagerDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [shipmentsCount, setShipmentsCount] = useState(0);
    const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
    const [documentsCount, setDocumentsCount] = useState(0);
    const [error, setError] = useState(null);
    const [downloadingReport, setDownloadingReport] = useState(false);

    const [totalOrdersCount, setTotalOrdersCount] = useState(0);

    // Dashboard-only fallback for a status breakdown the backend doesn't expose a count
    // endpoint for; bounded rather than truly unpaged so this stays a request, not a
    // full-table scan, even if it can undercount past this many invoices.
    const INVOICE_SCAN_SIZE = 500;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ordersPage, shipmentsPage, invoicesPage, docsPage] = await Promise.all([
                getOrders({ size: 5 }).catch(() => ({ content: [], totalElements: 0 })),
                getAllShipments({ size: 1 }).catch(() => ({ totalElements: 0 })),
                getAllInvoices({ size: INVOICE_SCAN_SIZE }).catch(() => ({ content: [] })),
                getAllDocuments({ size: 1 }).catch(() => ({ totalElements: 0 }))
            ]);

            setOrders(Array.isArray(ordersPage.content) ? ordersPage.content : []);
            setTotalOrdersCount(ordersPage.totalElements ?? 0);
            setShipmentsCount(shipmentsPage.totalElements ?? 0);
            setDocumentsCount(docsPage.totalElements ?? 0);

            const invoiceList = Array.isArray(invoicesPage.content) ? invoicesPage.content : [];
            const pendingInvoices = invoiceList.filter(
                i => i.status === "UNPAID" || i.status === "PENDING" || i.status === "Pending"
            ).length;
            setPendingInvoicesCount(pendingInvoices);
        } catch (err) {
            setError(err.message || "Failed to load dashboard metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDownloadReport = async () => {
        setDownloadingReport(true);
        setError(null);
        try {
            await downloadBlob(() => downloadExportReport(), "Export_Manager_Report.xlsx");
        } catch (err) {
            setError(err.message || "Failed to download the export report");
        } finally {
            setDownloadingReport(false);
        }
    };

    const stats = [
        { title: "Total Orders", value: totalOrdersCount.toString(), icon: <ShoppingCart /> },
        { title: "Active Shipments", value: shipmentsCount.toString(), icon: <Package /> },
        { title: "Pending Invoices", value: pendingInvoicesCount.toString(), icon: <Receipt /> },
        { title: "Trade Documents", value: documentsCount.toString(), icon: <FileCheck /> }
    ];

    const recentOrders = orders.slice(0, 5);

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Overview</h1>
                    <p className="page-subtitle">Purchase orders, shipments, invoices and trade documents at a glance.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        className="secondary-action"
                        onClick={fetchData}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button
                        className="primary-action"
                        onClick={handleDownloadReport}
                        disabled={downloadingReport}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <Download size={16} /> {downloadingReport ? "Preparing..." : "Excel Report"}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginTop: "15px" }}>
                    {error}
                </div>
            )}

            <div className="stats-grid" style={{ marginTop: "20px" }}>
                {stats.map((item, idx) => (
                    <div key={idx} className="stat-card">
                        <div>{item.icon}</div>
                        <h3>{loading ? "..." : item.value}</h3>
                        <p>{item.title}</p>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <h2>Order Pipeline</h2>
                    <div className="pipeline">
                        <span>CREATED</span>
                        <span>APPROVED</span>
                        <span>DOCUMENTS</span>
                        <span>PAID</span>
                        <span>SHIPMENT</span>
                        <span>COMPLETED</span>
                    </div>
                </div>

                <div className="panel">
                    <h2>Quick Actions</h2>
                    <button className="primary-action" onClick={() => navigate("/manager/documents")}>
                        Upload Documents
                    </button>
                    <button className="secondary-action" onClick={() => navigate("/manager/tokens")}>
                        Generate Download Token
                    </button>
                </div>
            </div>

            <div className="panel table-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Recent Orders</h2>
                    <button
                        onClick={() => navigate("/manager/orders")}
                        style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
                    >
                        View All Orders &rarr;
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Order Code</th>
                            <th>Buyer Name</th>
                            <th>Items / Cargo</th>
                            <th>Amount ($ USD)</th>
                            <th>Stage</th>
                            <th>Payment Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>Loading recent orders...</td>
                            </tr>
                        ) : recentOrders.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No orders found yet - client requests will appear here.</td>
                            </tr>
                        ) : (
                            recentOrders.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 700, color: "#1e293b" }}>{order.orderCode || `EXP-${order.id}`}</td>
                                    <td style={{ fontWeight: 600 }}>{order.buyerName}</td>
                                    <td style={{ color: "#475569" }}>{order.productName ? `${order.productName} (${order.quantity})` : "General Export Cargo"}</td>
                                    <td style={{ fontWeight: 700, color: "#0f766e" }}>${Number(order.amount).toLocaleString()}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            background: order.stage === "COMPLETED" ? "#dcfce7" : "#dbeafe",
                                            color: order.stage === "COMPLETED" ? "#15803d" : "#1e40af"
                                        }}>
                                            {order.stage}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: order.paymentStatus === "PAID" ? "#16a34a" : "#d97706"
                                        }}>
                                            {order.paymentStatus}
                                        </span>
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