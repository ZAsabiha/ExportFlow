import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { FileText, Download, Eye, UploadCloud, RefreshCw, X } from "lucide-react";
import {
    getAllDocuments,
    getOrders,
    uploadDocumentsBatch
} from "../../api/exportManagerApi";
import "../../components/dashboard.css";

const DOC_TYPES = [
    { label: "Commercial Invoice", value: "COMMERCIAL_INVOICE" },
    { label: "Packing List", value: "PACKING_LIST" },
    { label: "Bill of Lading (B/L)", value: "BILL_OF_LADING" },
    { label: "Certificate of Origin (COO)", value: "CERTIFICATE_OF_ORIGIN" },
    { label: "Letter of Credit (L/C)", value: "LETTER_OF_CREDIT" },
    { label: "Other Document", value: "OTHER" }
];

export default function DocumentUpload() {
    const [selectedOrder, setSelectedOrder] = useState("");
    const [docType, setDocType] = useState("COMMERCIAL_INVOICE");
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ordersData, docsData] = await Promise.all([
                getOrders(),
                getAllDocuments()
            ]);
            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setUploadedDocs(Array.isArray(docsData) ? docsData : []);
            if (Array.isArray(ordersData) && ordersData.length > 0) {
                setSelectedOrder(prev => prev || ordersData[0].id.toString());
            }
        } catch (err) {
            setError(err.message || "Failed to load documents and orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedOrder || selectedFiles.length === 0) {
            setError("Please select a purchase order and choose files to upload.");
            return;
        }

        setUploading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const res = await uploadDocumentsBatch(
                parseInt(selectedOrder, 10),
                docType,
                selectedFiles
            );

            const newlyUploaded = res.uploaded || [];
            setUploadedDocs(prev => [...newlyUploaded, ...prev]);
            setSelectedFiles([]);

            const count = res.successCount ?? newlyUploaded.length;
            setSuccessMsg(
                `${count} document${count > 1 ? "s" : ""} uploaded successfully!`
            );
            if (res.errors && res.errors.length > 0) {
                setError(`Some files failed: ${res.errors.join(", ")}`);
            }
        } catch (err) {
            setError(err.message || "Failed to upload document(s)");
        } finally {
            setUploading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const totalBatchSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Trade Document Center</h1>
                    <p className="page-subtitle">Upload and attach required trade documentation (Commercial Invoice, Packing List, B/L, COO, L/C) against export orders</p>
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

            {successMsg && (
                <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "8px", marginTop: "15px", fontWeight: 600 }}>
                    {successMsg}
                </div>
            )}

            <div className="dashboard-grid" style={{ marginTop: "25px" }}>
                <div className="panel">
                    <h2>Upload Document to Purchase Order</h2>
                    <form onSubmit={handleUpload}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", margin: "15px 0" }}>
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
                                            {o.orderCode || `EXP-${o.id}`} - {o.buyerName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Document Type</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                >
                                    {DOC_TYPES.map(dt => (
                                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="upload-box" style={{ marginTop: "15px" }}>
                            <input
                                type="file"
                                id="fileUpload"
                                multiple
                                onChange={handleFileChange}
                            />
                            <label htmlFor="fileUpload" style={{ cursor: "pointer" }}>
                                <UploadCloud size={40} color="#3b82f6" />
                                <h3>{selectedFiles.length > 0
                                    ? `${selectedFiles.length} file(s) selected`
                                    : "Select Document Files (Batch)"}</h3>
                                <p>{selectedFiles.length > 0 ? `Total batch size: ${formatBytes(totalBatchSize)} - Click to add/change` : "PDF, Images, or Office documents up to 25MB each"}</p>
                            </label>

                            {selectedFiles.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "15px" }}>
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f1f5f9", padding: "10px 15px", borderRadius: "6px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <FileText size={18} color="#2563eb" />
                                                <span style={{ fontSize: "13px", fontWeight: 600 }}>{file.name}</span>
                                                <span style={{ fontSize: "12px", color: "#64748b" }}>({formatBytes(file.size)})</span>
                                            </div>
                                            <button type="button" onClick={() => removeFile(idx)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                                <X size={16} color="#64748b" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="primary-action"
                                disabled={uploading || selectedFiles.length === 0 || !selectedOrder}
                                style={{ marginTop: "15px", width: "100%" }}
                            >
                                {uploading ? "Uploading Document(s)..." : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ""} Document(s)`}
                            </button>
                        </div>
                    </form>
                </div>


                <div className="panel" style={{ borderLeft: "4px solid #3b82f6" }}>
                    <h2>Document Compliance Note</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, marginTop: "10px" }}>
                        Export Managers can upload and view trade documents linked to purchase orders. Once uploaded, documents are safely stored in the backend repository.
                    </p>
                    <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, marginTop: "10px" }}>
                        <strong> Download Tokens</strong> must be generated under <em>Token Center</em> to allow buyers (clients) to securely view and download these trade documents.
                    </p>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "30px" }}>
                <h2>Uploaded Document Repository</h2>
                <table style={{ marginTop: "15px" }}>
                    <thead>
                        <tr>
                            <th>Doc ID</th>
                            <th>Document Name</th>
                            <th>Type</th>
                            <th>Order Code</th>
                            <th>Uploaded At</th>
                            <th>File Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Loading document repository...</td>
                            </tr>
                        ) : uploadedDocs.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No uploaded trade documents found.</td>
                            </tr>
                        ) : (
                            uploadedDocs.map((doc) => (
                                <tr key={doc.id}>
                                    <td style={{ fontWeight: 600 }}>DOC-{doc.id}</td>
                                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{doc.fileName}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                                            background: "#e0e7ff", color: "#3730a3"
                                        }}>
                                            {doc.documentType}
                                        </span>
                                    </td>
                                    <td><span style={{ fontWeight: 600, color: "#2563eb" }}>{doc.orderCode}</span></td>
                                    <td style={{ color: "#64748b" }}>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}</td>
                                    <td style={{ color: "#64748b" }}>{formatBytes(doc.fileSizeBytes)}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={() => alert(`Viewing document ${doc.fileName}...`)}
                                                style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                                            >
                                                <Eye size={14} /> Preview
                                            </button>
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