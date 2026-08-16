import { Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

import {
  FiHome, FiGrid, FiBookmark, FiUsers, FiSettings, FiLogOut, FiEye,
  FiMessageCircle, FiChevronDown, FiChevronUp, FiMenu, FiX,
  FiShield, FiBell, FiChevronRight, FiSearch
} from 'react-icons/fi';

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/properties': 'Properties',
  '/admin/bookings': 'Bookings',
  '/admin/users': 'Users',
  '/admin/staff': 'Staff Management',
  '/admin/chat': 'Chat',
  '/admin/settings': 'Settings',
};

const PAGE_SUBTITLES = {
  '/admin': 'Overview & quick stats',
  '/admin/properties': 'Manage all listings',
  '/admin/bookings': 'Track token bookings',
  '/admin/users': 'Registered accounts',
  '/admin/staff': 'Admin & staff roles',
  '/admin/chat': 'Live conversations',
  '/admin/settings': 'System configuration',
};

import apiRequest from '../../lib/apiRequest';
import './AdminLayout.scss';

const NAV = [
  {
    section: 'MAIN',
    items: [
      { to: '/admin', end: true, icon: FiHome, label: 'Dashboard' },
    ],
  },
  {
    section: 'PROPERTY',
    items: [
      { to: '/admin/properties', icon: FiGrid, label: 'Properties' },
      { to: '/admin/bookings', icon: FiBookmark, label: 'Bookings' },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      { to: '/admin/users', icon: FiUsers, label: 'Users' },
    ],
  },
  {
    section: 'SYSTEM',
    adminOnly: true,
    items: [
      { to: '/admin/staff', icon: FiShield, label: 'Staff Management' },
      { to: '/admin/chat', icon: FiMessageCircle, label: 'Chat' },
      { to: '/admin/settings', icon: FiSettings, label: 'Settings' },
    ],
  },
];

function AdminLayout() {
  const { currentUser, canAccessAdminPanel, isLoading, logout, isAdmin } = useAuth();
  const { socket, totalUnread, chatNotifications } = useSocket();
  const [companySettings, setCompanySettings] = useState(null);
  const [contentOpen, setContentOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const basePath = '/admin' + (location.pathname.split('/admin')[1] || '');
    if (PAGE_TITLES[basePath]) return PAGE_TITLES[basePath];
    for (const [key, value] of Object.entries(PAGE_TITLES)) {
      if (basePath.startsWith(key) && key !== '/admin') return value;
    }
    return 'Dashboard';
  };

  const getPageSubtitle = () => {
    const basePath = '/admin' + (location.pathname.split('/admin')[1] || '');
    return PAGE_SUBTITLES[basePath] || '';
  };

  useEffect(() => {
    if (currentUser && canAccessAdminPanel()) {
      apiRequest.get('/company/settings')
        .then(res => setCompanySettings(res.data))
        .catch(() => { });
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifOpen && !e.target.closest('.admin-notif')) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Loading admin panel…</p>
      </div>
    );
  }

  if (!currentUser || !canAccessAdminPanel()) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    try { await apiRequest.post('/auth/logout'); } catch { }
    logout();
    navigate('/admin/login');
  };

  const closeSidebar = () => setMobileSidebarOpen(false);

  const initials = currentUser?.username
    ? currentUser.username.slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="admin-layout">
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            {companySettings?.companyLogo ? (
              <img
                src={`${window.location.origin}${companySettings.companyLogo}`}
                alt={companySettings.companyName}
                className="brand-logo-img"
              />
            ) : (
              <div className="brand-logo-placeholder">🏠</div>
            )}
          </div>
          <div className="brand-text">
            <span className="brand-name">{companySettings?.companyName || 'Real Estate'}</span>
            <span className="brand-tag">Admin Panel</span>
          </div>
        </div>

        {/* User card */}
        <div className="sidebar-user-card">
          <div className="user-avatar">
            {currentUser?.avatar
              ? <img src={currentUser.avatar} alt={currentUser.username} />
              : <span>{initials}</span>
            }
          </div>
          <div className="user-info">
            <p className="user-name">{currentUser?.username}</p>
            <span className={`role-pill ${currentUser?.role === 'ADMIN' ? 'role-admin' : 'role-staff'}`}>
              {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Staff'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(group => {
            if (group.adminOnly && !isAdmin()) return null;

            if (group.collapsible) {
              return (
                <div key={group.section} className="nav-group">
                  <button
                    className="nav-section-toggle"
                    onClick={() => setContentOpen(v => !v)}
                  >
                    <span className="section-label">{group.section}</span>
                    {contentOpen ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
                  </button>
                  <div className={`collapsible-links ${contentOpen ? 'expanded' : ''}`}>
                    {group.items.map(({ to, icon: Icon, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-link nav-link--sub ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                      >
                        <span className="nav-icon"><Icon size={15} /></span>
                        <span>{label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={group.section} className="nav-group">
                <p className="nav-section-label">{group.section}</p>
                {group.items.map(({ to, end, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <span className="nav-icon"><Icon size={16} /></span>
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}

          <div className="nav-group nav-group--bottom">
            <a href="/" className="nav-link" target="_blank" rel="noopener noreferrer">
              <span className="nav-icon"><FiEye size={16} /></span>
              <span>View Site</span>
            </a>
            <button onClick={handleLogout} className="nav-link nav-link--logout">
              <span className="nav-icon"><FiLogOut size={16} /></span>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-toggle"
              onClick={() => setMobileSidebarOpen(v => !v)}
              aria-label="Toggle sidebar"
            >
              {mobileSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>

            <div className="topbar-breadcrumb">
              <span className="breadcrumb-home">Admin</span>
              <FiChevronRight size={13} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="topbar-center">
            <div className="topbar-search">
              <FiSearch size={14} className="search-icon" />
              <input
                placeholder="Search anything…"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/admin?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              />
              <kbd className="search-kbd">⌘K</kbd>
            </div>
          </div>

          <div className="topbar-right">
            {/* Notifications */}
            <div className="admin-notif">
              <button
                className="topbar-icon-btn"
                onClick={() => setNotifOpen(v => !v)}
                aria-label="Open notifications"
              >
                <FiBell size={17} />
                {totalUnread > 0 && (
                  <span className="notif-badge">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <div>
                      <p className="notif-title">Notifications</p>
                      <p className="notif-meta">
                        {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
                      </p>
                    </div>
                    <button
                      className="notif-close"
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close"
                    >
                      <FiX size={15} />
                    </button>
                  </div>

                  <div className="notif-list">
                    {chatNotifications?.length ? (
                      chatNotifications.slice(0, 7).map((n) => (
                        <button
                          key={n.chatId}
                          className={`notif-item ${n.count > 0 ? 'unread' : ''}`}
                          onClick={() => {
                            setNotifOpen(false);
                            navigate('/admin/chat');
                          }}
                        >
                          <div className="notif-avatar">
                            {n.senderName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="notif-body">
                            <div className="notif-row">
                              <span className="notif-name">{n.senderName || 'New message'}</span>
                              {n.count > 0 && (
                                <span className="notif-count">{n.count > 99 ? '99+' : n.count}</span>
                              )}
                            </div>
                            <p className="notif-preview">{n.lastMsg || 'You have a new message'}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="notif-empty">
                        <FiBell size={28} />
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>

                  <div className="notif-footer">
                    <button
                      className="notif-cta"
                      onClick={() => { setNotifOpen(false); navigate('/admin/chat'); }}
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar / logout */}
            <div className="topbar-user">
              <div className="topbar-avatar">
                {currentUser?.avatar
                  ? <img src={currentUser.avatar} alt={currentUser.username} />
                  : <span>{initials}</span>
                }
              </div>
              <div className="topbar-user-text">
                <span className="topbar-user-name">{currentUser?.username}</span>
                <span className="topbar-user-role">
                  {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Staff'}
                </span>
              </div>
            </div>

            <button className="topbar-logout-btn" onClick={handleLogout} aria-label="Sign out">
              <FiLogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page header bar */}
        <div className="page-title-bar">
          <div>
            <h1 className="page-title">{getPageTitle()}</h1>
            {getPageSubtitle() && (
              <p className="page-subtitle">{getPageSubtitle()}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;