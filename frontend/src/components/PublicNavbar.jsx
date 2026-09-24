import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Ship } from "lucide-react";
import "./PublicNavbar.css";

export default function PublicNavbar() {
    const linkClass = ({ isActive }) => (isActive ? "active" : "");

    return (
        <nav className="top-navbar">
            <Link to="/" className="nav-logo">
                <span className="nav-logo-mark">
                    <Ship size={16} />
                </span>
                ExportFlow
            </Link>

            <div className="nav-links">
                <NavLink to="/" end className={linkClass}>
                    Sign in
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                    Register
                </NavLink>
                <NavLink to="/about" className={linkClass}>
                    About
                </NavLink>
                <NavLink to="/contact" className={linkClass}>
                    Contact
                </NavLink>
            </div>
        </nav>
    );
}
