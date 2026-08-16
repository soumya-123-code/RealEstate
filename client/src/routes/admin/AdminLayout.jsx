import { Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import BrandLogo from '../../components/BrandLogo/BrandLogo';

import {
  FiHome, FiGrid, FiBookmark, FiUsers, FiSettings, FiLogOut, FiEye,
  FiMessageCircle, FiChevronDown, FiMenu, FiX,
  FiShield, FiBell, FiChevronRight, FiSearch,
  FiBarChart2, FiImage, FiFileText, FiMail, FiHelpCircle, FiTarget,
  FiFile, FiAward, FiGlobe, FiBriefcase, FiUserCheck, FiStar, FiUser,
} from 'react-icons/fi';

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/properties': 'Properties',
  '/admin/bookings': 'Bookings',
  '/admin/users': 'Users',
  '/admin/staff': 'Staff Management',
  '/admin/chat': 'Chat',
  '/admin/settings': 'Website Settings',
  '/admin/cms/pages': 'Pages & Sections',
  '/admin/cms/navigation': 'Navigation',
  '/admin/cms/banners': 'Hero Banners',
  '/admin/cms/services': 'Services',
  '/admin/cms/testimonials': 'Testimonials',
  '/admin/cms/faqs': 'FAQs',
  '/admin/cms/team': 'Team',
  '/admin/cms/partners': 'Partners',
  '/admin/cms/blogs': 'Blog Posts',
  '/admin/cms/agents': 'Agents',
  '/admin/cms/seo': 'SEO',
  '/admin/cms/analytics': 'CMS Analytics',
  '/admin/cms/leads': 'Leads',
  '/admin/cms/contacts': 'Contact Requests',
  '/admin/add-property': 'Add Property',
  '/admin/edit-property': 'Edit Property',
};

const PAGE_SUBTITLES = {
  '/admin': 'Overview & quick stats',
  '/admin/properties': 'Manage all listings',
  '/admin/bookings': 'Track token bookings',
  '/admin/users': 'Registered accounts',
  '/admin/staff': 'Admin & staff roles',
  '/admin/chat': 'Live conversations',
  '/admin/settings': 'Company info, social links, stats & SEO defaults',
  '/admin/cms/pages': 'Compose and publish public page layouts',
  '/admin/cms/navigation': 'Header & footer links',
  '/admin/cms/banners': 'Homepage hero slides',
  '/admin/cms/services': 'Why Choose Us / service cards',
  '/admin/cms/testimonials': 'Customer reviews',
  '/admin/cms/faqs': 'Frequently asked questions',
  '/admin/cms/team': 'About page team members',
  '/admin/cms/partners': 'Partner logos & links',
  '/admin/cms/blogs': 'Articles and market insights',
  '/admin/cms/agents': 'Agent profiles',
  '/admin/cms/seo': 'Per-page search engine metadata',
  '/admin/cms/analytics': 'Content & lead performance',
  '/admin/cms/leads': 'Sales pipeline',
  '/admin/cms/contacts': 'Inquiries from the contact form',
  '/admin/add-property': 'Create a new listing',
  '/admin/edit-property': 'Update property details',
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
    section: 'WEBSITE',
    collapsible: true,
    items: [
      { to: '/admin/cms/pages', icon: FiFile, label: 'Pages & Sections' },
      { to: '/admin/cms/navigation', icon: FiGlobe, label: 'Navigation' },
      { to: '/admin/cms/banners', icon: FiImage, label: 'Banners' },
      { to: '/admin/cms/services', icon: FiAward, label: 'Services' },
      { to: '/admin/cms/testimonials', icon: FiStar, label: 'Testimonials' },
      { to: '/admin/cms/faqs', icon: FiHelpCircle, label: 'FAQs' },
      { to: '/admin/cms/team', icon: FiUserCheck, label: 'Team' },
      { to: '/admin/cms/partners', icon: FiBriefcase, label: 'Partners' },
      { to: '/admin/cms/blogs', icon: FiFileText, label: 'Blogs' },
      { to: '/admin/cms/seo', icon: FiSearch, label: 'SEO' },
      { to: '/admin/cms/analytics', icon: FiBarChart2, label: 'Analytics' },
    ],
  },
  {
    section: 'CRM',
    collapsible: true,
    items: [
      { to: '/admin/cms/leads', icon: FiTarget, label: 'Leads' },
      { to: '/admin/cms/contacts', icon: FiMail, label: 'Contacts' },
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
      { to: '/admin/settings', icon: FiSettings, label: 'Website Settings' },
    ],
  },
];

function AdminLayout() {
  const { currentUser, canAccessAdminPanel, isLoading, logout, isAdmin } = useAuth();
  const { socket, totalUnread, chatNotifications } = useSocket();
  const [companySettings, setCompanySettings] = useState(null);
  const [openGroups, setOpenGroups] = useState({ WEBSITE: true, CRM: true });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ pages: [], properties: [], users: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleGroup = (section) =>
    setOpenGroups((prev) => ({ ...prev, [section]: !prev[section] }));

  // ── Global search ────────────────────────────────────────
  // Live search across admin pages (local) + properties/users (API),
  // debounced, with a keyboard-navigable results dropdown.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults({ pages: [], properties: [], users: [] });
      setSearchLoading(false);
      return;
    }

    const ql = q.toLowerCase();
    const pages = NAV
      .filter((g) => !g.adminOnly || isAdmin())
      .flatMap((g) => g.items)
      .filter((item) =>
        item.label.toLowerCase().includes(ql) || item.to.toLowerCase().includes(ql)
      )
      .slice(0, 5)
      .map((item) => ({ type: 'page', key: `page-${item.to}`, ...item }));
    // Page matches appear instantly while the API results load
    setSearchResults((prev) => ({ ...prev, pages }));
    setActiveIndex(0);

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const [propsRes, usersRes] = await Promise.allSettled([
        apiRequest.get(`/properties?q=${encodeURIComponent(q)}&limit=5`),
        apiRequest.get(`/users?q=${encodeURIComponent(q)}`),
      ]);
      const properties = propsRes.status === 'fulfilled'
        ? (propsRes.value.data?.properties || []).slice(0, 5)
        : [];
      const users = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value.data) ? usersRes.value.data : []).slice(0, 5)
        : [];
      setSearchResults({ pages, properties, users });
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const flatResults = useMemo(() => [
    ...searchResults.pages,
    ...searchResults.properties.map((p) => ({ type: 'property', key: `prop-${p.id}`, ...p })),
    ...searchResults.users.map((u) => ({ type: 'user', key: `user-${u.id}`, ...u })),
  ], [searchResults]);

  const goToResult = (result) => {
    setSearchOpen(false);
    if (result.type === 'page') navigate(result.to);
    else if (result.type === 'property') navigate(`/admin/edit-property/${result.id}`);
    else if (result.type === 'user') navigate('/admin/users');
  };

  // ⌘K / Ctrl+K focuses the search; Escape closes it
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close the dropdown when clicking outside the search box
  useEffect(() => {
    const onDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Keep the group containing the current route expanded so the active
  // page is always visible in the sidebar after navigation.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of NAV) {
        if (!group.collapsible) continue;
        const isActiveRoute = group.items.some(
          (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
        );
        if (isActiveRoute) next[group.section] = true;
      }
      return next;
    });
  }, [location.pathname]);

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
    try { await apiRequest.post('/auth/logout'); } catch { /* intentionally ignored */ }
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
          <BrandLogo
            to="/admin"
            name={companySettings?.companyName || 'Suretreaven'}
            tagline="Admin"
            size="sm"
            inverted
          />
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(group => {
            if (group.adminOnly && !isAdmin()) return null;

            if (group.collapsible) {
              const isOpen = !!openGroups[group.section];
              return (
                <div key={group.section} className="nav-group">
                  <button
                    className="nav-section-toggle"
                    onClick={() => toggleGroup(group.section)}
                    aria-expanded={isOpen}
                  >
                    <span className="section-label">{group.section}</span>
                    <span className="toggle-count">{group.items.length}</span>
                    <FiChevronDown size={13} className={`toggle-chevron ${isOpen ? 'open' : ''}`} />
                  </button>
                  <div className={`collapsible-links ${isOpen ? 'expanded' : ''}`}>
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
            <div className="topbar-search" ref={searchRef}>
              <FiSearch size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                placeholder="Search pages, properties, users…"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex(i => Math.min(i + 1, flatResults.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    const target = flatResults[activeIndex];
                    if (target) {
                      goToResult(target);
                    }
                  } else if (e.key === 'Escape') {
                    setSearchOpen(false);
                  }
                }}
              />
              <kbd className="search-kbd">⌘K</kbd>

              {searchOpen && searchQuery.trim().length >= 2 && (
                <div className="search-dropdown" role="listbox">
                  {searchLoading && flatResults.length === 0 && (
                    <div className="sd-state">Searching…</div>
                  )}
                  {!searchLoading && flatResults.length === 0 && (
                    <div className="sd-state">No matches for “{searchQuery.trim()}”</div>
                  )}

                  {searchResults.pages.length > 0 && (
                    <div className="sd-group">
                      <p className="sd-group-label">Pages</p>
                      {searchResults.pages.map((item) => (
                        <button
                          key={`page-${item.to}`}
                          className={`sd-row ${flatResults[activeIndex]?.key === 'page-' + item.to ? 'active' : ''}`}
                          onClick={() => goToResult({ type: 'page', key: 'page-' + item.to, ...item })}
                          onMouseEnter={() => setActiveIndex(flatResults.findIndex(r => r.key === 'page-' + item.to))}
                        >
                          <span className="sd-icon"><item.icon size={15} /></span>
                          <span className="sd-main">{item.label}</span>
                          <span className="sd-sub">{item.to}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.properties.length > 0 && (
                    <div className="sd-group">
                      <p className="sd-group-label">Properties</p>
                      {searchResults.properties.map((p) => (
                        <button
                          key={`prop-${p.id}`}
                          className={`sd-row ${flatResults[activeIndex]?.key === 'prop-' + p.id ? 'active' : ''}`}
                          onClick={() => goToResult({ type: 'property', key: 'prop-' + p.id, ...p })}
                          onMouseEnter={() => setActiveIndex(flatResults.findIndex(r => r.key === 'prop-' + p.id))}
                        >
                          <span className="sd-icon"><FiGrid size={15} /></span>
                          <span className="sd-main">{p.title}</span>
                          <span className="sd-sub">{[p.locality, p.city].filter(Boolean).join(', ')}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.users.length > 0 && (
                    <div className="sd-group">
                      <p className="sd-group-label">Users</p>
                      {searchResults.users.map((u) => (
                        <button
                          key={`user-${u.id}`}
                          className={`sd-row ${flatResults[activeIndex]?.key === 'user-' + u.id ? 'active' : ''}`}
                          onClick={() => goToResult({ type: 'user', key: 'user-' + u.id, ...u })}
                          onMouseEnter={() => setActiveIndex(flatResults.findIndex(r => r.key === 'user-' + u.id))}
                        >
                          <span className="sd-icon"><FiUser size={15} /></span>
                          <span className="sd-main">{u.username}</span>
                          <span className="sd-sub">{u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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