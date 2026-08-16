import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiGrid, 
  FiBookmark, 
  FiUsers, 
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiMessageCircle,
  FiImage,
  FiStar,
  FiHelpCircle,
  FiFileText,
  FiUserCheck,
  FiZap,
  FiTarget,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiMail
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import apiRequest from '../../lib/apiRequest';
import './AdminSidebar.scss';

function AdminSidebar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const res = await apiRequest.get('/company/settings');
        setCompanySettings(res.data);
      } catch (error) {
        console.error('Failed to load company settings:', error);
      }
    };
    fetchCompanySettings();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest.post('/auth/logout');
      logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      logout();
      navigate('/admin/login');
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuSections = [
    {
      label: 'Main',
      items: [
        { to: '/admin', end: true, icon: <FiHome />, label: 'Dashboard' },
        { to: '/admin/properties', icon: <FiGrid />, label: 'Properties' },
        { to: '/admin/bookings', icon: <FiBookmark />, label: 'Bookings' },
      ]
    },
    {
      label: 'Content',
      key: 'content',
      items: [
        { to: '/admin/banners', icon: <FiImage />, label: 'Banners' },
        { to: '/admin/services', icon: <FiZap />, label: 'Services' },
        { to: '/admin/testimonials', icon: <FiStar />, label: 'Testimonials' },
        { to: '/admin/faqs', icon: <FiHelpCircle />, label: 'FAQs' },
        { to: '/admin/team', icon: <FiUserCheck />, label: 'Team' },
        { to: '/admin/blogs', icon: <FiFileText />, label: 'Blogs' },
      ]
    },
    {
      label: 'CRM',
      key: 'crm',
      items: [
        { to: '/admin/leads', icon: <FiTarget />, label: 'Leads' },
        { to: '/admin/contacts', icon: <FiMail />, label: 'Contacts' },
      ]
    },
    {
      label: 'Management',
      items: [
        { to: '/admin/users', icon: <FiUsers />, label: 'Users' },
        { to: '/admin/chat', icon: <FiMessageCircle />, label: 'Chat' },
        { to: '/admin/seo', icon: <FiSearch />, label: 'SEO Settings' },
        { to: '/admin/settings', icon: <FiSettings />, label: 'Settings' },
      ]
    }
  ];

  return (
    <>
      <button className="mobile-sidebar-toggle" onClick={toggleMobileSidebar}>
        {isMobileOpen ? <FiX /> : <FiMenu />}
      </button>

      <div className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {companySettings?.companyLogo ? (
            <img 
              src={`${window.location.origin}${companySettings.companyLogo}`} 
              alt={companySettings.companyName} 
              className="company-logo"
            />
          ) : (
            <div className="company-logo-placeholder">
              {companySettings?.companyName?.charAt(0) || 'A'}
            </div>
          )}
          <h3>{companySettings?.companyName || 'Admin Panel'}</h3>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.username} />
            ) : (
              <div className="avatar-placeholder">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <p className="user-name">{currentUser?.username}</p>
            <span className="user-role">Administrator</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div key={section.label} className="nav-section">
              {section.key ? (
                <>
                  <button 
                    className="nav-section-header"
                    onClick={() => toggleMenu(section.key)}
                  >
                    <span>{section.label}</span>
                    {expandedMenus[section.key] ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  </button>
                  {(expandedMenus[section.key]) && (
                    <div className="nav-section-items">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) => isActive ? 'nav-link sub-link active' : 'nav-link sub-link'}
                          onClick={closeMobileSidebar}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="nav-section-label">{section.label}</p>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                      onClick={closeMobileSidebar}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </>
              )}
            </div>
          ))}

          <button className="nav-link logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar}></div>
      )}
    </>
  );
}

export default AdminSidebar;
