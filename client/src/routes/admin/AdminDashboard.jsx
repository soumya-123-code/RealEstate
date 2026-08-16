import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookmark, FiGrid, FiUsers, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import './AdminDashboard.scss';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest.get('/admin/dashboard'), apiRequest.get('/admin/bookings')]).then(([statsResult, bookingsResult]) => {
      if (!active) return;
      if (statsResult.status === 'fulfilled') setStats(statsResult.value.data);
      if (bookingsResult.status === 'fulfilled') setBookings((bookingsResult.value.data || []).slice(0, 5));
      if (statsResult.status === 'rejected' && bookingsResult.status === 'rejected') setError("We couldn't load the dashboard. Please try again.");
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;

  const cards = [
    { icon: FiGrid, value: stats?.totalProperties ?? 0, label: 'Properties', to: '/admin/properties' },
    { icon: FiBookmark, value: stats?.totalBookings ?? 0, label: 'Bookings', to: '/admin/bookings' },
    { icon: FiUsers, value: stats?.totalUsers ?? 0, label: 'Users', to: '/admin/users' },
    { icon: FiUserCheck, value: stats?.totalAgents ?? 0, label: 'Agents', to: '/admin/agents' },
  ];

  return <div className="admin-dashboard">
    <div className="page-header"><div><h1>Dashboard</h1><p>Welcome back, <strong>{currentUser?.username}</strong>.</p></div></div>
    {error && <div className="content-card"><p>{error}</p></div>}
    <div className="stats-grid">{cards.map(({ icon: Icon, value, label, to }) => <Link key={to} to={to} className="stat-card"><div className="stat-icon"><Icon /></div><div className="stat-content"><h3>{value}</h3><p>{label}</p></div></Link>)}</div>
    <div className="recent-section"><div className="section-header"><h2>Recent Bookings</h2><Link to="/admin/bookings" className="view-all">View All</Link></div><table className="data-table"><thead><tr><th>Property</th><th>Customer</th><th>Status</th><th>Date</th></tr></thead><tbody>{bookings.length === 0 ? <tr className="no-data"><td colSpan="4">No bookings yet</td></tr> : bookings.map((booking) => <tr key={booking.id}><td>{booking.property?.title || 'Property'}</td><td>{booking.user?.username || 'Customer'}</td><td>{String(booking.bookingStatus || '').replaceAll('_', ' ')}</td><td>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div>
  </div>;
}
