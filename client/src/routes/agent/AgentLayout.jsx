import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { FiCalendar, FiHome, FiLogOut, FiMessageCircle, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import './AgentLayout.scss';

function AgentLayout() {
  const { currentUser, isAgent, isLoading, logout } = useAuth();

  if (isLoading) return <div className="agent-layout-loading">Loading…</div>;
  if (!currentUser || !isAgent()) return <Navigate to="/agent/login" replace />;

  const links = [
    { to: '/agent', label: 'Dashboard', icon: FiHome, end: true },
    { to: '/agent/properties', label: 'Properties', icon: FiHome },
    { to: '/agent/bookings', label: 'Bookings', icon: FiCalendar },
    { to: '/agent/chat', label: 'Chat', icon: FiMessageCircle },
    { to: '/agent/profile', label: 'Profile', icon: FiUser },
  ];

  return (
    <div className="agent-layout">
      <aside className="agent-sidebar">
        <BrandLogo to="/agent" name="Suretreaven" tagline="Agent" size="sm" />
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `agent-nav-link${isActive ? ' active' : ''}`}>
              <Icon size={17} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="agent-logout" onClick={() => { logout(); window.location.assign('/agent/login'); }}>
          <FiLogOut size={17} /> Logout
        </button>
      </aside>
      <main className="agent-main"><Outlet /></main>
    </div>
  );
}

export default AgentLayout;
