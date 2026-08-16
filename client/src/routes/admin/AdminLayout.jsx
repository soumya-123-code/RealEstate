import { Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { FiHome, FiGrid, FiBookmark, FiUsers, FiSettings, FiLogOut, FiEye, FiMessageCircle, FiBell, FiChevronRight, FiMenu, FiX } from 'react-icons/fi';
import apiRequest from '../../lib/apiRequest';
import './AdminLayout.scss';

const PAGE_TITLES = { '/admin': 'Dashboard', '/admin/properties': 'Properties', '/admin/bookings': 'Bookings', '/admin/users': 'Users', '/admin/agents': 'Agents', '/admin/chat': 'Chat', '/admin/settings': 'Settings' };
const NAV = [
  { to: '/admin', end: true, icon: FiHome, label: 'Dashboard' },
  { to: '/admin/users', icon: FiUsers, label: 'Users' },
  { to: '/admin/agents', icon: FiUsers, label: 'Agents' },
  { to: '/admin/properties', icon: FiGrid, label: 'Properties' },
  { to: '/admin/bookings', icon: FiBookmark, label: 'Bookings' },
  { to: '/admin/chat', icon: FiMessageCircle, label: 'Chat' },
  { to: '/admin/settings', icon: FiSettings, label: 'Settings' },
];

export default function AdminLayout() {
  const { currentUser, canAccessAdminPanel, isLoading, logout, isAdmin } = useAuth();
  const { totalUnread, chatNotifications } = useSocket();
  const [companySettings, setCompanySettings] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser || !canAccessAdminPanel()) return undefined;
    apiRequest.get('/company/settings').then((res) => setCompanySettings(res.data)).catch(() => setCompanySettings(null));
    return undefined;
  }, [currentUser, canAccessAdminPanel]);

  if (isLoading) return <div className="loading-screen"><div className="loading-spinner" /><p className="loading-text">Loading admin panel…</p></div>;
  if (!currentUser || !canAccessAdminPanel()) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => { try { await apiRequest.post('/auth/logout'); } catch (error) { console.error('Logout failed', error); } logout(); navigate('/admin/login'); };
  const initials = currentUser.username?.slice(0, 2).toUpperCase() || 'AD';
  const title = PAGE_TITLES[location.pathname] || (location.pathname.startsWith('/admin/edit-property') ? 'Properties' : 'Dashboard');

  return <div className="admin-layout">
    {mobileSidebarOpen && <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />}
    <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-brand"><BrandLogo to="/admin" name={companySettings?.companyName || 'Suretreaven'} tagline="Admin" size="sm" inverted /></div>
      <div className="sidebar-user-card"><div className="user-avatar">{currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.username} /> : <span>{initials}</span>}</div><div className="user-info"><p className="user-name">{currentUser.username}</p><span className="role-pill role-admin">{isAdmin() ? 'Administrator' : 'Staff'}</span></div></div>
      <nav className="sidebar-nav">{NAV.map(({ to, end, icon: Icon, label }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMobileSidebarOpen(false)}><span className="nav-icon"><Icon size={16} /></span><span>{label}</span></NavLink>)}<div className="nav-group nav-group--bottom"><a href="/" className="nav-link"><span className="nav-icon"><FiEye size={16} /></span><span>View Site</span></a><button onClick={handleLogout} className="nav-link nav-link--logout"><span className="nav-icon"><FiLogOut size={16} /></span><span>Logout</span></button></div></nav>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><button className="mobile-toggle" onClick={() => setMobileSidebarOpen((v) => !v)} aria-label="Toggle sidebar">{mobileSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}</button><div className="topbar-breadcrumb"><span className="breadcrumb-home">Admin</span><FiChevronRight size={13} /><span className="breadcrumb-current">{title}</span></div><div className="topbar-right"><div className="admin-notif"><button className="topbar-icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Open notifications"><FiBell size={17} />{totalUnread > 0 && <span className="notif-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>}</button>{notifOpen && <div className="notif-dropdown"><div className="notif-header"><strong>Notifications</strong></div><div className="notif-list">{chatNotifications?.length ? chatNotifications.slice(0, 5).map((n) => <button key={n.chatId} className="notif-item" onClick={() => { setNotifOpen(false); navigate('/admin/chat'); }}><span>{n.senderName || 'New message'}</span><small>{n.lastMsg || 'You have a new message'}</small></button>) : <div className="notif-empty"><p>No new notifications</p></div>}</div></div>}</div><div className="topbar-user"><div className="topbar-avatar">{currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.username} /> : <span>{initials}</span>}</div><div className="topbar-user-text"><span className="topbar-user-name">{currentUser.username}</span><span className="topbar-user-role">{isAdmin() ? 'Administrator' : 'Staff'}</span></div></div><button className="topbar-logout-btn" onClick={handleLogout}><FiLogOut size={16} /><span>Logout</span></button></div></header>
      <div className="page-title-bar"><div><h1 className="page-title">{title}</h1><p className="page-subtitle">Suretreaven management</p></div></div>
      <main className="admin-content"><Outlet /></main>
    </div>
  </div>;
}
