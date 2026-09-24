import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import "../../components/dashboard.css";
import { getShipments } from "../../api/clientApi";

export default function ClientShipments() {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 20, totalElements: 0, totalPages: 0 });

    const loadShipments = (targetPage = page) => {
        setLoading(true);
        getShipments({ page: targetPage })
            .then((data) => {
                setShipments(Array.isArray(data.content) ? data.content : []);
                setPage(data.page ?? targetPage);
                setPageInfo({ size: data.size, totalElements: data.totalElements, totalPages: data.totalPages });
            })
            .catch((err) => setError(err.message || "Unable to load shipments."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadShipments(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <DashboardLayout>
            <h1 className="page-title">Shipments</h1>
            <p className="page-subtitle">Carrier details, routes and estimated arrival dates for your cargo.</p>

            <div className="panel table-panel" style={{ marginTop: "25px" }}>
                {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
                <table>
                    <thead>
                        <tr>
                            <th>Shipment ID</th>
                            <th>Order Ref</th>
                            <th>Ocean Carrier & Vessel</th>
                            <th>Port Route</th>
                            <th>Container No.</th>
                            <th>ETA Hamburg</th>
                            <th>Tracking Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="7">Loading shipments...</td></tr>}
                        {!loading && shipments.length === 0 && <tr><td colSpan="7">No shipments found.</td></tr>}
                        {!loading && shipments.map((s) => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: 700, color: "#1e293b" }}>{s.id}</td>
                                <td><span style={{ fontWeight: 600, color: "#2563eb" }}>{s.orderCode}</span></td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{s.carrier}</div>
                                    <small style={{ color: "#64748b" }}>{s.trackingNumber || "Tracking pending"}</small>
                                </td>
                                <td style={{ fontSize: "13px", fontWeight: 600 }}>{s.originPort} → {s.destinationPort}</td>
                                <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{s.trackingNumber || "-"}</td>
                                <td style={{ fontWeight: 600, color: "#0f766e" }}>{s.estimatedArrival || "-"}</td>
                                <td>
                                    <span style={{ padding: "4px 10px", borderRadius: "12px", background: "#dbeafe", color: "#1e40af", fontWeight: 700, fontSize: "12px" }}>
                                        {s.status?.replace("_", " ")}
                                    </span>
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
                    onPageChange={(nextPage) => loadShipments(nextPage)}
                />
            </div>
        </DashboardLayout>
    );
}
