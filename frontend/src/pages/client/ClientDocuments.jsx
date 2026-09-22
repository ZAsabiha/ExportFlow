import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { KeyRound, Download, Eye, ShieldCheck } from "lucide-react";
import "../../components/dashboard.css";
import { downloadDocumentBlob, unlockDocuments } from "../../api/clientApi";
import { downloadBlob, previewBlob } from "../../utils/blobView";

export default function ClientDocuments() {
    const [tokenInput, setTokenInput] = useState("");
    const [unlockedOrder, setUnlockedOrder] = useState("");
    const [verificationMessage, setVerificationMessage] = useState("");
    const [unlockedDocuments, setUnlockedDocuments] = useState([]);
    const [activeToken, setActiveToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    const handleVerifyToken = async (e) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;

        setLoading(true);
        setVerificationMessage("");
        try {
            const result = await unlockDocuments(tokenInput.trim());
            setActiveToken(result.token || tokenInput.trim());
            setUnlockedOrder(result.orderCode);
            setUnlockedDocuments(result.documents || []);
            setVerificationMessage(`Token validated. Trade documents unlocked for Order ${result.orderCode}.`);
        } catch (err) {
            setUnlockedDocuments([]);
            setUnlockedOrder("");
            setVerificationMessage(err.message || "Invalid or expired download token.");
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (doc) => {
        setDownloadError("");
        try {
            await previewBlob(() => downloadDocumentBlob(doc.id, activeToken));
        } catch (err) {
            setDownloadError(err.message || "Unable to preview document.");
        }
    };

    const handleDownload = async (doc) => {
        setDownloadError("");
        try {
            await downloadBlob(() => downloadDocumentBlob(doc.id, activeToken), doc.fileName);
        } catch (err) {
            setDownloadError(err.message || "Unable to download document.");
        }
    };

    return (
        <DashboardLayout>
            <h1 className="page-title">Client Trade Documents & Download Tokens</h1>
            <p className="page-subtitle">Enter your secure Download Token issued by the Export Manager to unlock and download trade documents</p>

            <div className="dashboard-grid" style={{ marginTop: "25px" }}>
                <div className="panel" style={{ border: "2px solid #3b82f6", background: "#f8fafc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        <KeyRound size={24} color="#2563eb" />
                        <h2 style={{ margin: 0 }}>Unlock Documents via Token</h2>
                    </div>

                    <form onSubmit={handleVerifyToken} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <input 
                            type="text" 
                            placeholder="Enter Download Token (e.g. TOK-EXP-9921)" 
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "monospace", fontWeight: 700 }}
                        />
                        <button type="submit" className="primary-action" disabled={loading} style={{ marginTop: 0, width: "auto", padding: "12px 20px" }}>
                            {loading ? "Checking..." : "Unlock Docs"}
                        </button>
                    </form>

                    {verificationMessage && (
                        <div style={{
                            marginTop: "15px",
                            padding: "12px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 600,
                            background: verificationMessage.startsWith("Token validated") ? "#dcfce7" : "#fee2e2",
                            color: verificationMessage.startsWith("Token validated") ? "#15803d" : "#991b1b"
                        }}>
                            {verificationMessage}
                        </div>
                    )}
                </div>

                <div className="panel">
                    <h2>How Download Tokens Work</h2>
                    <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, marginTop: "10px" }}>
                        <p style={{ margin: "0 0 8px 0" }}>
                            <ShieldCheck size={16} color="#059669" style={{ verticalAlign: "middle", marginRight: "6px" }} />
                            Download Tokens guarantee that only authorized buyers can view sensitive shipping papers.
                        </p>
                        <p style={{ margin: 0 }}>
                            Once your payment or Letter of Credit is confirmed, your Export Manager issues a token (e.g. <code>TOK-EXP-9921</code>).
                        </p>
                    </div>
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Unlocked Documents{unlockedOrder && ` for ${unlockedOrder}`}</h2>
                    {activeToken && <span style={{ fontSize: "12px", background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "12px", fontWeight: 700 }}>
                        Active Token Verified
                    </span>}
                </div>

                {downloadError && <p role="alert" style={{ color: "#b91c1c" }}>{downloadError}</p>}

                <table style={{ marginTop: "15px" }}>
                    <thead>
                        <tr>
                            <th>Document Name</th>
                            <th>Type</th>
                            <th>Order ID</th>
                            <th>File Size</th>
                            <th>Release Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unlockedDocuments.length === 0 && <tr><td colSpan="6">Unlock a valid token to view documents.</td></tr>}
                        {unlockedDocuments.map((doc) => (
                            <tr key={doc.id}>
                                <td style={{ fontWeight: 700, color: "#1e293b" }}>{doc.fileName}</td>
                                <td>
                                    <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "#e0e7ff", color: "#3730a3" }}>
                                        {doc.documentType?.replaceAll("_", " ")}
                                    </span>
                                </td>
                                <td><span style={{ fontWeight: 600, color: "#2563eb" }}>{doc.orderCode}</span></td>
                                <td style={{ color: "#64748b" }}>{doc.fileSizeBytes ? `${Math.ceil(doc.fileSizeBytes / 1024)} KB` : "-"}</td>
                                <td style={{ color: "#64748b" }}>{doc.uploadedAt?.slice(0, 10)}</td>
                                <td>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            onClick={() => handlePreview(doc)}
                                            style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                                        >
                                            <Eye size={14} /> Preview
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                                        >
                                            <Download size={14} /> Download File
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
