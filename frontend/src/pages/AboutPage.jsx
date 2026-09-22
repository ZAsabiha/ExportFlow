import React from "react";
import { Shield, BriefcaseBusiness, Package } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import "./InfoPages.css";

export default function AboutPage() {
    const portals = [
        { title: "Admin", icon: <Shield size={22} />, text: "Full system oversight — manage users, roles, and audit the entire platform." },
        { title: "Export Manager", icon: <Package size={22} />, text: "Run day-to-day operations: orders, shipments, documents, invoices and access tokens." },
        { title: "Client", icon: <BriefcaseBusiness size={22} />, text: "Track your own orders and shipments, view invoices, and access shared trade documents." },
    ];

    return (
        <div className="page-wrapper">
            <PublicNavbar />

            <div className="info-page">
                <div className="info-card wide">
                    <h2>About Export Flow</h2>
                    <p className="info-subtext">
                        Export Flow is a single platform for managing export orders, shipments,
                        trade documents and invoices — with a dedicated portal for every role in
                        the process.
                    </p>

                    <div className="portal-grid">
                        {portals.map((p) => (
                            <div className="portal-card" key={p.title}>
                                <div className="portal-icon">{p.icon}</div>
                                <h4>{p.title}</h4>
                                <p>{p.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}