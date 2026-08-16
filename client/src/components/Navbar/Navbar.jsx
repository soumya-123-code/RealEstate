import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import {
  FiX, FiSun, FiMoon, FiUser, FiLogOut, FiHome, FiList,
  FiInfo, FiMail, FiMap, FiChevronDown, FiBookOpen, FiHelpCircle,
  FiMessageCircle, FiCalendar, FiUsers, FiGrid,
} from 'react-icons/fi';
import NotificationBell from '../NotificationBell/NotificationBell';
import BrandLogo from '../BrandLogo/BrandLogo';
import apiRequest from '../../lib/apiRequest';
import { ROLES, hasAdminPanelAccess } from '../../lib/auth';
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
  const dropdownRef = useRef(null);

  const companyName = companySettings?.companyName || 'Suretreaven';
  const role = currentUser?.role;

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
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
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setActiveDropdown(false);
  }, [location.pathname]);

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
      console.error('Failed to load company settings:', error);
      setCompanySettings((prev) => prev || { companyName: 'Suretreaven', companyLogo: null });
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
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  /** Public marketing links — always available on the customer site. */
  const publicLinks = [
    { to: '/', label: 'Home', icon: FiHome },
    { to: '/list', label: 'Properties', icon: FiList },
    { to: '/explore', label: 'Explore', icon: FiMap },
    { to: '/about', label: 'About', icon: FiInfo },
    { to: '/contact', label: 'Contact', icon: FiMail },
  ];

  /** Extra public links shown on desktop when space allows / in mobile. */
  const secondaryPublicLinks = [
    { to: '/blog', label: 'Blog', icon: FiBookOpen },
    { to: '/faq', label: 'FAQ', icon: FiHelpCircle },
  ];

  /** Role-specific account links (authenticated). */
  const getRoleLinks = () => {
    if (!currentUser) return [];

    if (role === ROLES.ADMIN || hasAdminPanelAccess(currentUser)) {
      return [
        { to: '/admin', label: 'Dashboard', icon: FiGrid },
        { to: '/admin/users', label: 'Users', icon: FiUsers },
        { to: '/admin/properties', label: 'Properties', icon: FiList },
        { to: '/admin/bookings', label: 'Bookings', icon: FiCalendar },
        { to: '/profile', label: 'Profile', icon: FiUser },
      ];
    }

    if (role === ROLES.AGENT) {
      return [
        { to: '/agent', label: 'Dashboard', icon: FiGrid },
        { to: '/list', label: 'Properties', icon: FiList },
        { to: '/bookings', label: 'Bookings', icon: FiCalendar },
        { to: '/profile', label: 'Profile', icon: FiUser },
      ];
    }

    // Customer (USER) and staff without admin panel
    return [
      { to: '/list', label: 'Properties', icon: FiList },
      { to: '/bookings', label: 'My Bookings', icon: FiCalendar },
      { to: '/chat', label: 'Chat', icon: FiMessageCircle, badge: totalUnread },
      { to: '/profile', label: 'Profile', icon: FiUser },
    ];
  };

  const roleLinks = getRoleLinks();
  const desktopCenterLinks =
    currentUser && (role === ROLES.ADMIN || role === ROLES.AGENT || hasAdminPanelAccess(currentUser))
      ? roleLinks
      : [...publicLinks, ...secondaryPublicLinks];

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} aria-label="Main">
      <div className="navbar-container">
        <BrandLogo
          name={companyName}
          tagline="Find · Book · Build · Belong"
          onClick={closeMenu}
        />

        <div className="navbar-nav desktop-nav" role="navigation">
          {desktopCenterLinks.map(({ to, label, badge }) => (
            <Link
              key={`${to}-${label}`}
              to={to}
              className={`nav-link${isActive(to) ? ' active' : ''}`}
              aria-current={isActive(to) ? 'page' : undefined}
            >
              {label}
              {badge > 0 && (
                <span className="nav-chat-badge">{badge > 9 ? '9+' : badge}</span>
              )}
            </Link>
          ))}
          {currentUser && role === ROLES.USER && !desktopCenterLinks.some((l) => l.to === '/chat') && (
            <Link
              to="/chat"
              className={`nav-link nav-link--chat${isActive('/chat') ? ' active' : ''}`}
              aria-current={isActive('/chat') ? 'page' : undefined}
            >
              <FiMessageCircle size={15} aria-hidden="true" />
              Chat
              {totalUnread > 0 && (
                <span className="nav-chat-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
              )}
            </Link>
          )}
        </div>

        <div className="navbar-actions desktop-actions">
          <button type="button" className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>

          {currentUser && <NotificationBell />}

          {currentUser ? (
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setActiveDropdown(!activeDropdown)}
                aria-expanded={activeDropdown}
                aria-haspopup="menu"
              >
                <div className="user-avatar-sm">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="" />
                  ) : (
                    currentUser.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name">{currentUser.username}</span>
                <FiChevronDown size={14} className={`chevron${activeDropdown ? ' rotate' : ''}`} />
              </button>

              {activeDropdown && (
                <div className="user-dropdown" role="menu">
                  {roleLinks.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to + label}
                      to={to}
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => setActiveDropdown(false)}
                    >
                      <Icon size={16} /> {label}
                    </Link>
                  ))}
                  <button type="button" onClick={handleLogout} className="dropdown-item logout" role="menuitem">
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

        <div className="mobile-actions">
          {currentUser && <NotificationBell />}
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
          </button>
        </div>
      </div>

      <div
        className={`mobile-overlay${menuOpen ? ' active' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-header">
          <BrandLogo
            name={companyName}
            tagline="Find · Book · Build · Belong"
            size="sm"
            onClick={closeMenu}
          />
          <button type="button" className="close-btn" onClick={closeMenu} aria-label="Close menu">
            <FiX size={22} />
          </button>
        </div>

        <div className="mobile-menu-body">
          <div className="mobile-nav-section">
            <p className="section-label">Explore</p>
            {[...publicLinks, ...secondaryPublicLinks].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`mobile-nav-link${isActive(to) ? ' active' : ''}`}
                onClick={closeMenu}
              >
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>

          {currentUser ? (
            <div className="mobile-nav-section">
              <p className="section-label">Account</p>
              {roleLinks.map(({ to, label, icon: Icon, badge }) => (
                <Link
                  key={to + label}
                  to={to}
                  className={`mobile-nav-link${isActive(to) ? ' active' : ''}`}
                  onClick={closeMenu}
                >
                  <Icon size={18} /> {label}
                  {badge > 0 && (
                    <span className="nav-chat-badge" style={{ marginLeft: 6 }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              ))}
              <button type="button" className="mobile-nav-link logout" onClick={handleLogout}>
                <FiLogOut size={18} /> Logout
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
            <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
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
