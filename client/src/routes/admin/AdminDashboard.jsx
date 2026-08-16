import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { FiHome, FiUsers, FiDollarSign, FiCheckCircle, FiTarget, FiMail, FiTrendingUp, FiUserCheck, FiShield, FiGrid } from 'react-icons/fi';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import './AdminDashboard.scss';

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const statsRes = await apiRequest.get('/admin/dashboard');
      setStats(statsRes.data);
      const bookingsRes = await apiRequest.get('/admin/bookings');
      setRecentBookings((bookingsRes.data || []).slice(0, 5));
      try {
        const leadsRes = await apiRequest.get('/cms/admin/leads');
        setRecentLeads((leadsRes.data || []).slice(0, 5));
      } catch { /* intentionally ignored */ }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;

  const STAT_CARDS = [
    { icon: FiHome, color: 'blue', value: stats?.totalProperties || 0, label: 'Total Properties', sub: `${stats?.availableProperties || 0} Available` },
    { icon: FiCheckCircle, color: 'green', value: stats?.tokenBookedProperties || 0, label: 'Token Booked', sub: `${stats?.soldProperties || 0} Sold` },
    { icon: FiDollarSign, color: 'purple', value: stats?.totalBookings || 0, label: 'Total Bookings', sub: `${stats?.tokenPaidBookings || 0} Token Paid` },
    { icon: FiUsers, color: 'orange', value: stats?.totalUsers || 0, label: 'Registered Users', sub: 'All time' },
  ];

  const QUICK_LINKS = [
    { to: '/admin/analytics', icon: FiTrendingUp, label: 'Analytics', sub: 'Detailed reports', color: '#2e86c1' },
    { to: '/admin/leads', icon: FiTarget, label: 'Leads', sub: 'CRM pipeline', color: '#f97316' },
    { to: '/admin/agents', icon: FiUserCheck, label: 'Agents', sub: 'Agent accounts', color: '#22c55e' },
    { to: '/admin/contacts', icon: FiMail, label: 'Contacts', sub: 'Inquiries', color: '#a855f7' },
    ...(isAdmin() ? [{ to: '/admin/staff', icon: FiShield, label: 'Staff', sub: 'Manage staff', color: '#e11d48' }] : []),
    { to: '/admin/properties', icon: FiGrid, label: 'Properties', sub: 'All listings', color: '#0891b2' },
  ];

  return (
    <div className="admin-dashboard">
      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ icon: Icon, color, value, label, sub }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}><Icon /></div>
            <div className="stat-content">
              <h3>{value}</h3>
              <p>{label}</p>
              <span className="stat-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        {QUICK_LINKS.map(({ to, icon: Icon, label, sub, color }) => (
          <Link key={to} to={to} className="quick-link-card">
            <div className="ql-icon" style={{ color }}><Icon size={22} /></div>
            <div>
              <strong>{label}</strong>
              <small>{sub}</small>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent data */}
      <div className="recent-grid">
        {/* Recent Bookings */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Bookings</h2>
            <Link to="/admin/bookings" className="view-all">View All</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Property</th><th>User</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr className="no-data"><td colSpan="4">No bookings yet</td></tr>
              ) : recentBookings.map(b => (
                <tr key={b.id}>
                  <td>
                    <strong style={{ display: 'block', fontSize: 13 }}>{b.property?.title}</strong>
                    <small style={{ color: '#9ca3af' }}>{b.property?.city}</small>
                  </td>
                  <td style={{ fontSize: 13 }}>{b.user?.username}</td>
                  <td><span className={`status-badge ${b.bookingStatus?.toLowerCase()}`}>{b.bookingStatus?.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: 12, color: '#6b7a99' }}>{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Leads */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Leads</h2>
            <Link to="/admin/leads" className="view-all">View All</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Source</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr className="no-data"><td colSpan="4">No leads yet</td></tr>
              ) : recentLeads.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</td>
                  <td style={{ fontSize: 13 }}>{l.phone}</td>
                  <td><span className={`status-badge ${l.source?.toLowerCase()}`}>{l.source?.replace(/_/g, ' ')}</span></td>
                  <td><span className={`status-badge ${l.status?.toLowerCase()}`}>{l.status?.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
