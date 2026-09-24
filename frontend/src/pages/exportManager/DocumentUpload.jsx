import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { FileText, Download, Eye, UploadCloud, RefreshCw, X, Search, FileSpreadsheet, Archive, RotateCcw, AlertTriangle } from "lucide-react";
import {
    getAllDocuments,
    getOrders,
    uploadDocumentsBatch,
    downloadDocumentBlob,
    launchBulkDocumentImport,
    getBulkImportStatus,
    getBulkImportErrors,
    retryBulkImport
} from "../../api/exportManagerApi";
import { deadlineColors, deadlineTooltip, formatDeadline } from "../../utils/deadline";
import { DOC_TYPES } from "../../utils/documentTypes";
import "../../components/dashboard.css";

// Bulk import job statuses that mean the batch job is still running, so status polling
// should keep going until it lands on one outside this set.
const IN_PROGRESS_STATUSES = ["STARTING", "STARTED"];
const BULK_IMPORT_POLL_MS = 3000;

// Orders are only fetched here to populate the "purchase order" dropdown, so this pulls
// a generous bounded batch rather than the paginated order-history page size.
const ORDER_OPTIONS_SIZE = 500;

export default function DocumentUpload() {
    const [selectedOrder, setSelectedOrder] = useState("");
    const [docType, setDocType] = useState("COMMERCIAL_INVOICE");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 10, totalElements: 0, totalPages: 0 });
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Bulk import (Excel manifest + ZIP of files) state
    const [manifestFile, setManifestFile] = useState(null);
    const [documentsZipFile, setDocumentsZipFile] = useState(null);
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
            const [ordersData, docsData] = await Promise.all([
                getOrders({ size: ORDER_OPTIONS_SIZE }),
                getAllDocuments({ page: targetPage })
            ]);
            const ordersList = Array.isArray(ordersData.content) ? ordersData.content : [];
            const docsList = Array.isArray(docsData.content) ? docsData.content : [];
            setOrders(ordersList);
            setUploadedDocs(docsList);
            setPage(docsData.page ?? targetPage);
            setPageInfo({ size: docsData.size, totalElements: docsData.totalElements, totalPages: docsData.totalPages });
            if (ordersList.length > 0) {
                setSelectedOrder(prev => prev || ordersList[0].id.toString());
            }
        } catch (err) {
            setError(err.message || "Failed to load documents and orders");
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
                const updated = await getBulkImportStatus(bulkJob.jobExecutionId);
                setBulkJob(updated);
                if (!IN_PROGRESS_STATUSES.includes(updated.status)) {
                    fetchData(0);
                }
            } catch (err) {
                setBulkError(err.message || "Failed to refresh import status");
            }
        }, BULK_IMPORT_POLL_MS);
        return () => clearTimeout(pollTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bulkJob]);

    const handleManifestChange = (e) => {
        setManifestFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
    };

    const handleDocumentsZipChange = (e) => {
        setDocumentsZipFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
    };

    const handleBulkLaunch = async (e) => {
        e.preventDefault();
        if (!manifestFile || !documentsZipFile) {
            setBulkError("Please select both a manifest spreadsheet and a ZIP of documents.");
            return;
        }
        setBulkLaunching(true);
        setBulkError(null);
        setShowBulkErrors(false);
        setBulkErrors([]);
        try {
            const status = await launchBulkDocumentImport(manifestFile, documentsZipFile);
            setBulkJob(status);
            setManifestFile(null);
            setDocumentsZipFile(null);
        } catch (err) {
            setBulkError(err.message || "Failed to launch bulk import");
        } finally {
            setBulkLaunching(false);
        }
    };

    const fetchBulkErrors = async (targetPage = 0) => {
        if (!bulkJob) return;
        setBulkError(null);
        try {
            const data = await getBulkImportErrors(bulkJob.jobExecutionId, { page: targetPage });
            setBulkErrors(Array.isArray(data.content) ? data.content : []);
            setBulkErrorsPage(data.page ?? targetPage);
            setBulkErrorsPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
            setShowBulkErrors(true);
        } catch (err) {
            setBulkError(err.message || "Failed to load import errors");
        }
    };

    const handleBulkRetry = async () => {
        if (!bulkJob) return;
        setBulkRetrying(true);
        setBulkError(null);
        try {
            const status = await retryBulkImport(bulkJob.jobExecutionId);
            setBulkJob(status);
            setShowBulkErrors(false);
            setBulkErrors([]);
        } catch (err) {
            setBulkError(err.message || "Failed to retry import job");
        } finally {
            setBulkRetrying(false);
        }
    };

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

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const totalBatchSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

    const filteredDocs = uploadedDocs.filter((doc) => {
        const search = searchTerm.toLowerCase();
        const idStr = (doc.id ? `DOC-${doc.id}` : "").toLowerCase();
        const nameStr = (doc.fileName || "").toLowerCase();
        const codeStr = (doc.orderCode || "").toLowerCase();
        return idStr.includes(search) || nameStr.includes(search) || codeStr.includes(search);
    });

    const orderByCode = Object.fromEntries(orders.map((o) => [o.orderCode, o]));

    const handlePreview = async (doc) => {
        try {
            const blob = await downloadDocumentBlob(doc.id);
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
        } catch (err) {
            setError(`Failed to preview ${doc.fileName || doc.originalFileName || "document"}: ${err.message}`);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Trade Documents</h1>
                    <p className="page-subtitle">Upload the required trade documents (commercial invoice, packing list, B/L, COO, L/C) against export orders.</p>
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

            {successMsg && (
                <div style={{ background: "var(--green-100)", color: "var(--green-700)", padding: "12px 16px", borderRadius: "8px", marginTop: "15px", fontWeight: 600 }}>
                    {successMsg}
                </div>
            )}

            <div className="dashboard-grid" style={{ marginTop: "25px" }}>
                <div className="panel">
                    <h2>Upload Documents</h2>
                    <form onSubmit={handleUpload}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", margin: "15px 0" }}>
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
                                            {o.orderCode || `EXP-${o.id}`} - {o.buyerName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>Document Type</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid var(--slate-300)" }}
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
                                <UploadCloud size={40} color="var(--blue-500)" />
                                <h3>{selectedFiles.length > 0
                                    ? `${selectedFiles.length} file(s) selected`
                                    : "Select Document Files (Batch)"}</h3>
                                <p>{selectedFiles.length > 0 ? `Total batch size: ${formatBytes(totalBatchSize)} - Click to add/change` : "PDF, Images, or Office documents up to 25MB each"}</p>
                            </label>

                            {selectedFiles.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "15px" }}>
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--slate-100)", padding: "10px 15px", borderRadius: "6px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <FileText size={18} color="var(--blue-600)" />
                                                <span style={{ fontSize: "13px", fontWeight: 600 }}>{file.name}</span>
                                                <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>({formatBytes(file.size)})</span>
                                            </div>
                                            <button type="button" onClick={() => removeFile(idx)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                                <X size={16} color="var(--slate-500)" />
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


                <div className="panel" style={{ borderLeft: "4px solid var(--blue-500)" }}>
                    <h2>Document Compliance Note</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.6, marginTop: "10px" }}>
                        Export Managers can upload and view trade documents linked to purchase orders. Once uploaded, documents are safely stored in the backend repository.
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.6, marginTop: "10px" }}>
                        <strong> Download Tokens</strong> must be generated under <em>Token Center</em> to allow buyers (clients) to securely view and download these trade documents.
                    </p>
                </div>
            </div>

            <div className="panel" style={{ marginTop: "25px" }}>
                <h2>Bulk Import · Manifest and ZIP</h2>
                <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "6px" }}>
                    Attach documents to many orders in one submission: an Excel manifest listing
                    <code style={{ margin: "0 4px" }}>orderCode / documentType / fileName</code>
                    per row, plus a single ZIP containing those files.
                </p>
                <form onSubmit={handleBulkLaunch}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", margin: "15px 0" }}>
                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>Manifest (.xlsx)</label>
                            <div className="upload-box" style={{ padding: "20px", marginTop: "4px" }}>
                                <input
                                    type="file"
                                    id="manifestUpload"
                                    accept=".xlsx,.xls"
                                    onChange={handleManifestChange}
                                />
                                <label htmlFor="manifestUpload" style={{ cursor: "pointer" }}>
                                    <FileSpreadsheet size={28} color="var(--blue-500)" />
                                    <p style={{ marginTop: "8px", fontSize: "13px", fontWeight: 600 }}>
                                        {manifestFile ? manifestFile.name : "Select manifest spreadsheet"}
                                    </p>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>Documents (.zip)</label>
                            <div className="upload-box" style={{ padding: "20px", marginTop: "4px" }}>
                                <input
                                    type="file"
                                    id="documentsZipUpload"
                                    accept=".zip"
                                    onChange={handleDocumentsZipChange}
                                />
                                <label htmlFor="documentsZipUpload" style={{ cursor: "pointer" }}>
                                    <Archive size={28} color="var(--blue-500)" />
                                    <p style={{ marginTop: "8px", fontSize: "13px", fontWeight: 600 }}>
                                        {documentsZipFile ? documentsZipFile.name : "Select documents ZIP"}
                                    </p>
                                </label>
                            </div>
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
                        disabled={bulkLaunching || !manifestFile || !documentsZipFile}
                    >
                        {bulkLaunching ? "Launching Import..." : "Launch Bulk Import"}
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
                                <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>Documents Imported</div>
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
                                            <th>File Name</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkErrors.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: "center", padding: "16px", color: "var(--slate-500)" }}>No error rows found.</td>
                                            </tr>
                                        ) : (
                                            bulkErrors.map((err, idx) => (
                                                <tr key={`${err.rowNumber}-${idx}`}>
                                                    <td>{err.rowNumber}</td>
                                                    <td>{err.orderCode}</td>
                                                    <td>{err.fileName}</td>
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
                        placeholder="Search documents on this page by Doc ID, File Name, or Order Code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "20px" }}>
                <h2>Document Repository</h2>
                <table style={{ marginTop: "15px" }}>
                    <thead>
                        <tr>
                            <th>Doc ID</th>
                            <th>Document Name</th>
                            <th>Type</th>
                            <th>Order Code</th>
                            <th>Doc Deadline</th>
                            <th>Uploaded At</th>
                            <th>File Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>Loading document repository...</td>
                            </tr>
                        ) : filteredDocs.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "var(--slate-500)" }}>
                                    {uploadedDocs.length === 0 ? "No uploaded trade documents found." : "No matching documents found."}
                                </td>
                            </tr>
                        ) : (
                            filteredDocs.map((doc) => {
                                const relatedOrder = orderByCode[doc.orderCode];
                                const deadline = relatedOrder?.documentDeadline;
                                return (
                                <tr key={doc.id}>
                                    <td style={{ fontWeight: 600 }}>DOC-{doc.id}</td>
                                    <td style={{ fontWeight: 600, color: "var(--slate-800)" }}>{doc.fileName}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                                            background: "var(--indigo-100)", color: "var(--indigo-800)"
                                        }}>
                                            {doc.documentType}
                                        </span>
                                    </td>
                                    <td><span style={{ fontWeight: 600, color: "var(--blue-600)" }}>{doc.orderCode}</span></td>
                                    <td>
                                        {deadline ? (
                                            <span style={{
                                                padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                                                background: deadlineColors(deadline).bg, color: deadlineColors(deadline).text
                                            }} title={deadlineTooltip(relatedOrder)}>
                                                {formatDeadline(deadline)}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "var(--slate-400)" }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ color: "var(--slate-500)" }}>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}</td>
                                    <td style={{ color: "var(--slate-500)" }}>{formatBytes(doc.fileSizeBytes)}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={() => handlePreview(doc)}
                                                style={{ background: "none", border: "none", color: "var(--blue-500)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                                            >
                                                <Eye size={14} /> Preview
                                            </button>
                                        </div>
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
                    onPageChange={(nextPage) => fetchData(nextPage)}
                />
            </div>
        </DashboardLayout>
    );
}