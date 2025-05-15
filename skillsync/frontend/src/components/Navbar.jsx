import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationList from './NotificationList';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          Cooking Edition
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/" className="navbar-link">
          <i className="fas fa-home"></i>
          <span>Home</span>
        </Link>
        <Link to="/community" className="navbar-link">
          <i className="fas fa-users"></i>
          <span>Community</span>
        </Link>
        <Link to="/posts" className="navbar-link">
          <i className="fas fa-newspaper"></i>
          <span>Posts</span>
        </Link>
        {user && (
          <Link to="/profile" className="navbar-link">
            Profile
          </Link>
        )}
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <NotificationList />
            <button onClick={handleLogout} className="navbar-button">
              Logout
            </button>
          </>
        ) : (
          <button onClick={login} className="navbar-button primary">
            Login with Google
          </button>
        )}
      </div>

      <div className="mobile-navbar-links">
        <Link to="/" className="mobile-nav-link">
          <i className="fas fa-home"></i>
          <span>Home</span>
        </Link>
        <Link to="/community" className="mobile-nav-link">
          <i className="fas fa-users"></i>
          <span>Community</span>
        </Link>
        <Link to="/posts" className="mobile-nav-link">
          <i className="fas fa-newspaper"></i>
          <span>Posts</span>
        </Link>
        {user && (
          <Link to="/" className="mobile-nav-link">
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
        )}
        {user && (
          <Link to="/community" className="mobile-nav-link">
            <i className="fas fa-users"></i>
            <span>Community</span>
          </Link>
        )}
        {user && (
          <Link to="/" className="mobile-nav-link">
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 