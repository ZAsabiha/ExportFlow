import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./PublicNavbar.css";

export default function PublicNavbar() {
    return (
        <nav className="top-navbar">
            <Link to="/" className="nav-logo">EXPORT FLOW</Link>

            <div className="nav-links">
                <NavLink to="/register" className={({ isActive }) => (isActive ? "active" : "")}>
                    Register
                </NavLink>
                <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
                    Contact
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
                    About
                </NavLink>
            </div>
        </nav>
    );
}