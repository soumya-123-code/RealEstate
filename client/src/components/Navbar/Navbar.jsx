import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { FiMenu, FiX, FiSun, FiMoon, FiUser, FiLogOut, FiHome, FiList, FiInfo, FiMail, FiMap, FiChevronDown, FiBookOpen, FiHelpCircle, FiMessageCircle } from 'react-icons/fi';
import NotificationBell from '../NotificationBell/NotificationBell';
import apiRequest from '../../lib/apiRequest';
import './Navbar.scss';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { totalUnread } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setActiveDropdown(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setActiveDropdown(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const res = await apiRequest.get('/company/settings');
      setCompanySettings(res.data);
    } catch (error) {
      setCompanySettings({
        companyName: 'Suretreaven',
        companyLogo: null,
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setActiveDropdown(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          {companySettings?.companyLogo ? (
            <img
              src={`${window.location.origin}${companySettings.companyLogo}`}
              alt={companySettings.companyName || 'Logo'}
              className="logo-image"
            />
          ) : (
            <div className="logo-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}
          <span className="logo-text">
            {companySettings?.companyName || 'Suretreaven'}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/list" className={`nav-link ${isActive('/list') ? 'active' : ''}`}>
            Properties
          </Link>
          <Link to="/explore" className={`nav-link ${isActive('/explore') ? 'active' : ''}`}>
            Explore
          </Link>
          <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>
            Blog
          </Link>
          <Link to="/faq" className={`nav-link ${isActive('/faq') ? 'active' : ''}`}>
            FAQ
          </Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
            About
          </Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
            Contact
          </Link>
          {currentUser && (
            <Link to="/chat" className={`nav-link nav-link--chat ${isActive('/chat') ? 'active' : ''}`} style={{ position: 'relative' }}>
              <FiMessageCircle size={16} style={{ marginRight: 4 }} />
              Chat
              {totalUnread > 0 && (
                <span className="nav-chat-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
              )}
            </Link>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="navbar-actions desktop-actions">
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>

          {currentUser && <NotificationBell />}

          {currentUser ? (
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setActiveDropdown(!activeDropdown)}
              >
                <div className="user-avatar-sm">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.username} />
                  ) : (
                    currentUser.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name">{currentUser.username}</span>
                <FiChevronDown size={14} className={`chevron ${activeDropdown ? 'rotate' : ''}`} />
              </button>

              {activeDropdown && (
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item" onClick={() => setActiveDropdown(false)}>
                    <FiUser size={16} /> My Profile
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <FiLogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Right Section */}
        <div className="mobile-actions">
          {currentUser && <NotificationBell />}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-overlay ${menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      />

      {/* Mobile Menu Panel */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="mobile-logo" onClick={closeMenu}>
            {companySettings?.companyLogo ? (
              <img src={`${window.location.origin}${companySettings.companyLogo}`} alt="Logo" className="logo-image" />
            ) : (
              <span className="logo-icon-sm">🏠</span>
            )}
            <span>{companySettings?.companyName || 'Suretreaven'}</span>
          </Link>
          <button className="close-btn" onClick={closeMenu} aria-label="Close menu">
            <FiX size={24} />
          </button>
        </div>

        <div className="mobile-menu-body">
          <div className="mobile-nav-section">
            <p className="section-label">Navigation</p>
            <Link to="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMenu}>
              <FiHome size={20} /> Home
            </Link>
            <Link to="/list" className={`mobile-nav-link ${isActive('/list') ? 'active' : ''}`} onClick={closeMenu}>
              <FiList size={20} /> Properties
            </Link>
            <Link to="/explore" className={`mobile-nav-link ${isActive('/explore') ? 'active' : ''}`} onClick={closeMenu}>
              <FiMap size={20} /> Explore
            </Link>
            <Link to="/blog" className={`mobile-nav-link ${isActive('/blog') ? 'active' : ''}`} onClick={closeMenu}>
              <FiBookOpen size={20} /> Blog
            </Link>
            <Link to="/faq" className={`mobile-nav-link ${isActive('/faq') ? 'active' : ''}`} onClick={closeMenu}>
              <FiHelpCircle size={20} /> FAQ
            </Link>
            <Link to="/about" className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`} onClick={closeMenu}>
              <FiInfo size={20} /> About
            </Link>
            <Link to="/contact" className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={closeMenu}>
              <FiMail size={20} /> Contact
            </Link>
          </div>

          {currentUser ? (
            <div className="mobile-nav-section">
              <p className="section-label">Account</p>
              <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>
                <FiUser size={20} /> Profile
              </Link>
              <Link to="/chat" className="mobile-nav-link" onClick={closeMenu} style={{ position: 'relative' }}>
                <FiMessageCircle size={20} /> Messages
                {totalUnread > 0 && (
                  <span className="nav-chat-badge" style={{ marginLeft: 6 }}>{totalUnread > 9 ? '9+' : totalUnread}</span>
                )}
              </Link>
              <button className="mobile-nav-link logout" onClick={handleLogout}>
                <FiLogOut size={20} /> Logout
              </button>
            </div>
          ) : (
            <div className="mobile-nav-section">
              <p className="section-label">Account</p>
              <Link to="/login" className="btn btn-outline btn-block" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-block" onClick={closeMenu}>Sign Up</Link>
            </div>
          )}

          <div className="mobile-menu-footer">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
