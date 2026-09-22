import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";


import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";


import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import AuditLogs from "./pages/admin/AuditLogs";
import SystemReports from "./pages/admin/SystemReports";


import ExportManagerDashboard from "./pages/exportManager/ExportManagerDashboard";
import Orders from "./pages/exportManager/Orders";
import Shipments from "./pages/exportManager/Shipments";
import DocumentUpload from "./pages/exportManager/DocumentUpload";
import TokenCenter from "./pages/exportManager/TokenCenter";
import Invoices from "./pages/exportManager/Invoices";

// Client Pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientOrders from "./pages/client/ClientOrders";
import ClientShipments from "./pages/client/ClientShipments";
import ClientInvoices from "./pages/client/ClientInvoices";
import ClientDocuments from "./pages/client/ClientDocuments";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Auth / Login */}
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/about" element={<AboutPage />} />

                    {/* Admin Portal Routes */}
                    <Route path="/admin" element={<ProtectedRoute portal="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute portal="admin"><Users /></ProtectedRoute>} />
                    <Route path="/admin/roles" element={<ProtectedRoute portal="admin"><Roles /></ProtectedRoute>} />
                    <Route path="/admin/audit-logs" element={<ProtectedRoute portal="admin"><AuditLogs /></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute portal="admin"><SystemReports /></ProtectedRoute>} />

                    {/* Export Manager Portal Routes */}
                    <Route path="/manager" element={<ProtectedRoute portal="manager"><ExportManagerDashboard /></ProtectedRoute>} />
                    <Route path="/manager/orders" element={<ProtectedRoute portal="manager"><Orders /></ProtectedRoute>} />
                    <Route path="/manager/shipments" element={<ProtectedRoute portal="manager"><Shipments /></ProtectedRoute>} />
                    <Route path="/manager/documents" element={<ProtectedRoute portal="manager"><DocumentUpload /></ProtectedRoute>} />
                    <Route path="/manager/tokens" element={<ProtectedRoute portal="manager"><TokenCenter /></ProtectedRoute>} />
                    <Route path="/manager/invoices" element={<ProtectedRoute portal="manager"><Invoices /></ProtectedRoute>} />

                    {/* Client Portal Routes */}
                    <Route path="/client" element={<ProtectedRoute portal="client"><ClientDashboard /></ProtectedRoute>} />
                    <Route path="/client/orders" element={<ProtectedRoute portal="client"><ClientOrders /></ProtectedRoute>} />
                    <Route path="/client/shipments" element={<ProtectedRoute portal="client" permission="VIEW_SHIPMENTS"><ClientShipments /></ProtectedRoute>} />
                    <Route path="/client/invoices" element={<ProtectedRoute portal="client"><ClientInvoices /></ProtectedRoute>} />
                    <Route path="/client/documents" element={<ProtectedRoute portal="client"><ClientDocuments /></ProtectedRoute>} />

                    {/* Catch-all fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;