import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Search, Plus, MapPin, RefreshCw } from "lucide-react";
import { getAllShipments, getOrders, createShipment } from "../../api/exportManagerApi";
import "../../components/dashboard.css";

// Orders are only fetched here to populate the "linked purchase order" dropdown, so
// this pulls a generous bounded batch rather than the paginated order-history page size.
const ORDER_OPTIONS_SIZE = 500;

export default function Shipments() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [shipments, setShipments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ size: 20, totalElements: 0, totalPages: 0 });
    const [error, setError] = useState(null);

    const [newShipment, setNewShipment] = useState({
        orderId: "",
        carrier: "",
        trackingNumber: "",
        originPort: "Chittagong (BDCGP)",
        destinationPort: "",
        estimatedArrival: ""
    });

    const fetchData = async (targetPage = page) => {
        setLoading(true);
        setError(null);
        try {
            const [shipmentsData, ordersData] = await Promise.all([
                getAllShipments({ page: targetPage }),
                getOrders({ size: ORDER_OPTIONS_SIZE })
            ]);
            const shipmentsList = Array.isArray(shipmentsData.content) ? shipmentsData.content : [];
            const ordersList = Array.isArray(ordersData.content) ? ordersData.content : [];
            setShipments(shipmentsList);
            setPage(shipmentsData.page ?? targetPage);
            setPageInfo({ size: shipmentsData.size, totalElements: shipmentsData.totalElements, totalPages: shipmentsData.totalPages });
            setOrders(ordersList);
            if (ordersList.length > 0) {
                setNewShipment(prev => ({ ...prev, orderId: prev.orderId || ordersList[0].id.toString() }));
            }
        } catch (err) {
            setError(err.message || "Failed to load shipments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddShipment = async (e) => {
        e.preventDefault();
        if (!newShipment.orderId || !newShipment.carrier) return;

        setSubmitting(true);
        setError(null);
        try {
            const created = await createShipment({
                orderId: parseInt(newShipment.orderId, 10),
                carrier: newShipment.carrier,
                trackingNumber: newShipment.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
                originPort: newShipment.originPort || "Chittagong (BDCGP)",
                destinationPort: newShipment.destinationPort || "Rotterdam (NLRTM)",
                estimatedArrival: newShipment.estimatedArrival || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
            });
            setShipments([created, ...shipments]);
            setShowModal(false);
            setNewShipment({
                orderId: orders.length > 0 ? orders[0].id.toString() : "",
                carrier: "",
                trackingNumber: "",
                originPort: "Chittagong (BDCGP)",
                destinationPort: "",
                estimatedArrival: ""
            });
        } catch (err) {
            setError(err.message || "Failed to create shipment booking");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredShipments = shipments.filter(s => {
        const idStr = (s.id ? `SHP-${s.id}` : "").toLowerCase();
        const codeStr = (s.orderCode || "").toLowerCase();
        const carrierStr = (s.carrier || "").toLowerCase();
        const trackStr = (s.trackingNumber || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        return idStr.includes(search) || codeStr.includes(search) || carrierStr.includes(search) || trackStr.includes(search);
    });

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Shipments</h1>
                    <p className="page-subtitle">Carrier bookings, vessel tracking, container milestones and arrival estimates.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        className="secondary-action"
                        onClick={() => fetchData()}
                        style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button
                        className="primary-action"
                        onClick={() => setShowModal(true)}
                        style={{ marginTop: 0, width: "auto", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <Plus size={18} />
                        Create Shipment Booking
                    </button>
                </div>
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
                        placeholder="Search shipments by Order Code, Carrier, or Tracking Number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="panel table-panel" style={{ marginTop: "20px" }}>
                <table>
                    <thead>
                        <tr>
                            <th>Shipment ID</th>
                            <th>Order Code</th>
                            <th>Carrier Line</th>
                            <th>Port Route (Origin &rarr; Destination)</th>
                            <th>Tracking / B/L No.</th>
                            <th>Estimated Arrival (ETA)</th>
                            <th>Logistics Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Loading shipment records...</td>
                            </tr>
                        ) : filteredShipments.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No shipment bookings found.</td>
                            </tr>
                        ) : (
                            filteredShipments.map((shipment) => (
                                <tr key={shipment.id}>
                                    <td style={{ fontWeight: 700, color: "#1e293b" }}>SHP-{shipment.id}</td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: "#2563eb" }}>{shipment.orderCode}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{shipment.carrier}</div>
                                    </td>
                                    <td style={{ fontSize: "13px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#334155", fontWeight: 600 }}>
                                            <MapPin size={14} color="#059669" /> {shipment.originPort || "Chittagong"} &rarr; {shipment.destinationPort || "Rotterdam"}
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{shipment.trackingNumber || "N/A"}</td>
                                    <td style={{ fontWeight: 600, color: "#0f766e" }}>{shipment.estimatedArrival || "TBD"}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            background: shipment.status === "CUSTOMS_CLEARED" || shipment.status === "DELIVERED" ? "#dcfce7" : shipment.status === "IN_TRANSIT" ? "#dbeafe" : "#fef3c7",
                                            color: shipment.status === "CUSTOMS_CLEARED" || shipment.status === "DELIVERED" ? "#15803d" : shipment.status === "IN_TRANSIT" ? "#1e40af" : "#92400e"
                                        }}>
                                            {shipment.status || "BOOKED"}
                                        </span>
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
                    onPageChange={(nextPage) => fetchData(nextPage)}
                />
            </div>

            {/* Create Shipment Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="panel" style={{ width: "450px", maxWidth: "90%" }}>
                        <h2>New Shipment Booking</h2>
                        <form onSubmit={handleAddShipment} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Linked Purchase Order</label>
                                <select
                                    required
                                    value={newShipment.orderId}
                                    onChange={(e) => setNewShipment({ ...newShipment, orderId: e.target.value })}
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="">Select an Order</option>
                                    {orders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.orderCode || `EXP-${o.id}`} - {o.buyerName} (${Number(o.amount).toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Shipping Line / Carrier</label>
                                <input
                                    type="text"
                                    required
                                    value={newShipment.carrier}
                                    onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })}
                                    placeholder="e.g. Maersk / MSC / Hapag-Lloyd"
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Tracking / Container / B/L No.</label>
                                <input
                                    type="text"
                                    value={newShipment.trackingNumber}
                                    onChange={(e) => setNewShipment({ ...newShipment, trackingNumber: e.target.value })}
                                    placeholder="e.g. MSKU9048120"
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Destination Port</label>
                                <input
                                    type="text"
                                    required
                                    value={newShipment.destinationPort}
                                    onChange={(e) => setNewShipment({ ...newShipment, destinationPort: e.target.value })}
                                    placeholder="e.g. Rotterdam (NLRTM)"
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Estimated Arrival (ETA)</label>
                                <input
                                    type="date"
                                    value={newShipment.estimatedArrival}
                                    onChange={(e) => setNewShipment({ ...newShipment, estimatedArrival: e.target.value })}
                                    style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="submit" className="primary-action" disabled={submitting}>
                                    {submitting ? "Booking..." : "Create Booking"}
                                </button>
                                <button type="button" className="secondary-action" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}