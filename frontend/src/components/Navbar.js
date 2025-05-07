import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Cooking Edition</Link>
            </div>
            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/community">Community</Link>
                <Link to="/profile">Profile</Link>
            </div>
        </nav>
    );
};

export default Navbar; 