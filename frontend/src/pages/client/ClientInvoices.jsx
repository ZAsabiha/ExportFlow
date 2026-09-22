import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Download, Eye } from "lucide-react";
import "../../components/dashboard.css";
import { downloadInvoicePdfBlob, getInvoices } from "../../api/clientApi";
import { downloadBlob, previewBlob } from "../../utils/blobView";

export default function ClientInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 20, totalElements: 0, totalPages: 0 });

    const loadInvoices = (targetPage = page) => {
        setLoading(true);
        getInvoices({ page: targetPage })
            .then((data) => {
                setInvoices(Array.isArray(data.content) ? data.content : []);
                setPage(data.page ?? targetPage);
                setPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
            })
            .catch((err) => setError(err.message || "Unable to load invoices."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadInvoices(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePreview = async (inv) => {
        setError("");
        try {
            await previewBlob(() => downloadInvoicePdfBlob(inv.id));
        } catch (err) {
            setError(err.message || "Unable to preview invoice.");
        }
    };

    const handleDownload = async (inv) => {
        setError("");
        try {
            await downloadBlob(() => downloadInvoicePdfBlob(inv.id), `invoice-${inv.invoiceNumber}.pdf`);
        } catch (err) {
            setError(err.message || "Unable to download invoice.");
        }
    };

    return (
        <DashboardLayout>
            <h1 className="page-title">My Invoices</h1>
            <p className="page-subtitle">View billing details, payment confirmations, and download commercial invoice PDFs</p>

            <div className="panel table-panel" style={{ marginTop: "25px" }}>
                {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
                <table>
                    <thead>
                        <tr>
                            <th>Invoice No.</th>
                            <th>Order ID</th>
                            <th>Total Amount ($ USD)</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Payment Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="7">Loading invoices...</td></tr>}
                        {!loading && invoices.length === 0 && <tr><td colSpan="7">No invoices found.</td></tr>}
                        {!loading && invoices.map((inv) => (
                            <tr key={inv.id}>
                                <td style={{ fontWeight: 700, color: "#1e293b" }}>{inv.id}</td>
                                <td><span style={{ fontWeight: 600, color: "#2563eb" }}>{inv.orderCode}</span></td>
                                <td style={{ fontWeight: 700, color: "#0f766e" }}>{inv.amount} {inv.currency || ""}</td>
                                <td style={{ color: "#64748b" }}>{inv.issueDate}</td>
                                <td style={{ color: "#64748b" }}>{inv.dueDate}</td>
                                <td>
                                    <span style={{
                                        padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                                        background: inv.status === "PAID" ? "#dcfce7" : "#fef3c7",
                                        color: inv.status === "PAID" ? "#15803d" : "#92400e"
                                    }}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            onClick={() => handlePreview(inv)}
                                            style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                                        >
                                            <Eye size={14} /> Preview
                                        </button>
                                        <button
                                            onClick={() => handleDownload(inv)}
                                            style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                                        >
                                            <Download size={14} /> Download
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    page={page}
                    size={pageInfo.size}
                    totalElements={pageInfo.totalElements}
                    totalPages={pageInfo.totalPages}
                    onPageChange={(nextPage) => loadInvoices(nextPage)}
                />
            </div>
        </DashboardLayout>
    );
}
