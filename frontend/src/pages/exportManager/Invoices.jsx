import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Search, Download, RefreshCw } from "lucide-react";
import { getAllInvoices } from "../../api/exportManagerApi";
import "../../components/dashboard.css";

export default function Invoices() {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 20, totalElements: 0, totalPages: 0 });
    const [error, setError] = useState(null);

    const fetchInvoicesList = async (targetPage = page) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllInvoices({ page: targetPage });
            setInvoices(Array.isArray(data.content) ? data.content : []);
            setPage(data.page ?? targetPage);
            setPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
        } catch (err) {
            setError(err.message || "Failed to load commercial invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoicesList(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredInvoices = invoices.filter(inv => {
        const invNum = (inv.invoiceNumber || `INV-${inv.id}`).toLowerCase();
        const code = (inv.orderCode || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        return invNum.includes(search) || code.includes(search);
    });

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Commercial Invoices</h1>
                    <p className="page-subtitle">Generate export commercial invoices, track payment status, and export official PDF documents</p>
                </div>
                <button
                    className="secondary-action"
                    onClick={() => fetchInvoicesList()}
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
                <div className="search-box" style={{ width: "100%" }}>
                    <Search size={18} color="#64748b" />
                    <input
                        type="text"
                        placeholder="Search invoices by Invoice No. or Order Code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "20px" }}>
                <table>
                    <thead>
                        <tr>
                            <th>Invoice No.</th>
                            <th>Order Reference</th>
                            <th>Total Amount</th>
                            <th>Currency</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Payment Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>Loading invoices...</td>
                            </tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No commercial invoices found.</td>
                            </tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 700, color: "#1e293b" }}>{inv.invoiceNumber || `INV-${inv.id}`}</td>
                                    <td><span style={{ fontWeight: 600, color: "#2563eb" }}>{inv.orderCode}</span></td>
                                    <td style={{ fontWeight: 700, color: "#0f766e" }}>
                                        ${Number(inv.amount || 0).toLocaleString()}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{inv.currency || "USD"}</td>
                                    <td style={{ color: "#64748b" }}>{inv.issueDate || "N/A"}</td>
                                    <td style={{ color: "#64748b" }}>{inv.dueDate || "N/A"}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            background: inv.status === "PAID" ? "#dcfce7" : "#fef3c7",
                                            color: inv.status === "PAID" ? "#15803d" : "#92400e"
                                        }}>
                                            {inv.status || "PENDING"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => alert(`Viewing Commercial Invoice ${inv.invoiceNumber || inv.id}`)}
                                            style={{
                                                padding: "5px 10px", borderRadius: "6px", border: "none",
                                                background: "#e0e7ff", color: "#3730a3", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                                                display: "inline-flex", alignItems: "center", gap: "4px"
                                            }}
                                        >
                                            <Download size={14} /> View Document
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
                    onPageChange={(nextPage) => fetchInvoicesList(nextPage)}
                />
            </div>
        </DashboardLayout>
    );
}