import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';
import { FiMail, FiPhone, FiUser, FiShield, FiUsers, FiMessageCircle } from 'react-icons/fi';
import './AdminUsers.scss';

function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearch] = useState('');
  const [roleFilter, setRole]   = useState('USER');
  const [startingChat, setStartingChat] = useState(null); // userId being chatted
  const navigate = useNavigate();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/users');
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Start a chat with this user and navigate to /admin/chat
  const handleStartChat = async (user) => {
    setStartingChat(user.id);
    try {
      await apiRequest.post('/chats', { receiverId: user.id });
      toast.success(`Opening chat with ${user.username}`);
      navigate('/admin/chat');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not start chat');
    } finally {
      setStartingChat(null);
    }
  };

  const byRole  = (role) => users.filter(u => u.role === role);
  const filtered = users.filter(u =>
    u.role === roleFilter &&
    (
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const TABS = [
    { key: 'USER',  label: 'Users',  icon: FiUser,   count: byRole('USER').length },
    { key: 'AGENT', label: 'Agents', icon: FiUsers,  count: byRole('AGENT').length },
  ];

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-users">
      <div className="page-actions">
        <Link to="/admin/staff" className="btn-secondary">
          <FiShield /> Manage Staff
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FiUser /></div>
          <div className="stat-body"><h3>{byRole('USER').length}</h3><p>Registered Users</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiUsers /></div>
          <div className="stat-body"><h3>{byRole('AGENT').length}</h3><p>Agents</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiShield /></div>
          <div className="stat-body"><h3>{byRole('STAFF').length}</h3><p>Staff</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={roleFilter === t.key ? 'active' : ''}
            onClick={() => setRole(t.key)}
          >
            <t.icon size={13} style={{ marginRight: 5 }} />
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-row">
        <input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className="no-data">
                <td colSpan="6">No {roleFilter.toLowerCase()}s found</td>
              </tr>
            ) : filtered.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                      background: '#e3f2fd', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1565c0'
                    }}>
                      {user.avatar
                        ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : user.username?.charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)' }}>{user.username}</strong>
                      <small style={{ color: '#9ca3af' }}>ID #{user.id}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <FiMail size={12} color="#9ca3af" /> {user.email}
                    </div>
                    {user.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7a99' }}>
                        <FiPhone size={12} color="#9ca3af" /> {user.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td><span className={`status-badge ${user.role?.toLowerCase()}`}>{user.role}</span></td>
                <td style={{ fontSize: 13, color: '#6b7a99' }}>{formatDate(user.createdAt)}</td>
                <td>
                  <span className={`status-badge ${user.isActive !== false ? 'active' : 'inactive'}`}>
                    {user.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    className="chat-action-btn"
                    onClick={() => handleStartChat(user)}
                    disabled={startingChat === user.id}
                    title={`Chat with ${user.username}`}
                  >
                    {startingChat === user.id
                      ? <span className="chat-action-spin" />
                      : <FiMessageCircle size={14} />}
                    Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
