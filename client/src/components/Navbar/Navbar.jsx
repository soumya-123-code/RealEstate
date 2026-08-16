import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiCalendar, FiChevronDown, FiHome, FiList, FiLogOut, FiMessageCircle, FiUser, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import BrandLogo from '../BrandLogo/BrandLogo';
import apiRequest from '../../lib/apiRequest';
import './Navbar.scss';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [companyName, setCompanyName] = useState('Suretreaven');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { totalUnread } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    apiRequest.get('/company/settings').then((res) => setCompanyName(res.data?.companyName || 'Suretreaven')).catch(() => setCompanyName('Suretreaven'));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location.pathname]);

  const links = [
    { to: '/', label: 'Home', icon: FiHome },
    { to: '/list', label: 'Properties', icon: FiList },
  ];
  const accountLinks = currentUser ? [
    { to: '/bookings', label: 'My Bookings', icon: FiCalendar },
    { to: '/chat', label: 'Chat', icon: FiMessageCircle, badge: totalUnread },
    { to: '/profile', label: 'Profile', icon: FiUser },
  ] : [];
  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); setDropdownOpen(false); };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} aria-label="Main navigation">
      <div className="navbar-container">
        <BrandLogo name={companyName} tagline="Find · Book · Build · Belong" onClick={() => setMenuOpen(false)} />
        <div className="navbar-nav desktop-nav">
          {[...links, ...accountLinks].map(({ to, label, badge }) => <Link key={to} to={to} className={`nav-link${isActive(to) ? ' active' : ''}`}>{label}{badge > 0 && <span className="nav-chat-badge">{badge > 9 ? '9+' : badge}</span>}</Link>)}
        </div>
        <div className="navbar-actions desktop-actions">
          {currentUser && <NotificationBell />}
          {currentUser ? (
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <button className="user-menu-trigger" onClick={() => setDropdownOpen((v) => !v)} aria-expanded={dropdownOpen}>
                <div className="user-avatar-sm">{currentUser.avatar ? <img src={currentUser.avatar} alt="" /> : currentUser.username?.charAt(0).toUpperCase()}</div>
                <span className="user-name">{currentUser.username}</span><FiChevronDown size={14} />
              </button>
              {dropdownOpen && <div className="user-dropdown" role="menu">
                {accountLinks.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="dropdown-item" onClick={() => setDropdownOpen(false)}><Icon size={16} />{label}</Link>)}
                <button className="dropdown-item logout" onClick={handleLogout}><FiLogOut size={16} />Logout</button>
              </div>}
            </div>
          ) : <div className="auth-buttons"><Link to="/login" className="btn btn-ghost">Login</Link><Link to="/register" className="btn btn-primary">Sign Up</Link></div>}
        </div>
        <div className="mobile-actions">
          {currentUser && <NotificationBell />}
          <button className="hamburger-btn" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <FiX size={22} /> : <><span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" /></>}
          </button>
        </div>
      </div>
      {menuOpen && <div className="mobile-overlay active" onClick={() => setMenuOpen(false)} />}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-menu-header"><BrandLogo name={companyName} tagline="Find · Book · Build · Belong" size="sm" /><button className="close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu"><FiX size={22} /></button></div>
        <div className="mobile-menu-body">
          {[...links, ...accountLinks].map(({ to, label, icon: Icon, badge }) => <Link key={to} to={to} className={`mobile-nav-link${isActive(to) ? ' active' : ''}`} onClick={() => setMenuOpen(false)}><Icon size={18} />{label}{badge > 0 && <span className="nav-chat-badge">{badge > 9 ? '9+' : badge}</span>}</Link>)}
          {currentUser ? <button className="mobile-nav-link logout" onClick={handleLogout}><FiLogOut size={18} />Logout</button> : <><Link to="/login" className="btn btn-outline btn-block" onClick={() => setMenuOpen(false)}>Login</Link><Link to="/register" className="btn btn-primary btn-block" onClick={() => setMenuOpen(false)}>Sign Up</Link></>}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
