import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiX, FiShield, FiUser, FiToggleLeft, FiToggleRight, FiLock, FiUnlock } from 'react-icons/fi';
import { formatDate } from '../../lib/utils';

const EMPTY_FORM = {
  username: '', email: '', phone: '',
  password: '',
  canAccessAdminPanel: false,
  passwordLoginEnabled: false,
  permissions: [],
  isActive: true,
};

const ALL_PERMISSIONS = [
  { key: 'ADMIN_PANEL', label: 'Admin Panel Access' },
  { key: 'MANAGE_PROPERTIES', label: 'Manage Properties' },
  { key: 'MANAGE_BOOKINGS', label: 'Manage Bookings' },
  { key: 'MANAGE_USERS', label: 'Manage Users' },
  { key: 'MANAGE_CMS', label: 'Manage CMS Content' },
  { key: 'MANAGE_LEADS', label: 'Manage Leads/CRM' },
  { key: 'VIEW_ANALYTICS', label: 'View Analytics' },
];

function AdminStaff() {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Hooks must run unconditionally — the admin guard renders after them
  const admin = isAdmin();
  useEffect(() => { if (admin) fetchStaff(); }, [admin]);

  if (!admin) return <Navigate to="/admin" replace />;

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/admin/staff');
      setStaff(res.data || []);
    } catch {
      toast.error('Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setFormData({
      username: s.username || '',
      email: s.email || '',
      phone: s.phone || '',
      password: '',
      canAccessAdminPanel: !!s.canAccessAdminPanel,
      passwordLoginEnabled: !!s.passwordLoginEnabled,
      permissions: Array.isArray(s.permissions) ? s.permissions : [],
      isActive: s.isActive !== false,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      return toast.error('Username and email are required');
    }
    if (!editing && formData.passwordLoginEnabled && !formData.password.trim()) {
      return toast.error('Password is required when password login is enabled');
    }

    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    setSaving(true);
    try {
      if (editing) {
        await apiRequest.put(`/admin/staff/${editing.id}`, payload);
        toast.success('Staff account updated');
      } else {
        await apiRequest.post('/admin/staff', payload);
        toast.success('Staff account created');
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s) => {
    try {
      if (s.isActive) {
        await apiRequest.patch(`/admin/staff/${s.id}/deactivate`);
        toast.success('Staff deactivated');
      } else {
        await apiRequest.patch(`/admin/staff/${s.id}/activate`);
        toast.success('Staff activated');
      }
      fetchStaff();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this staff account?')) return;
    try {
      await apiRequest.delete(`/admin/staff/${id}`);
      toast.success('Staff account deleted');
      fetchStaff();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = staff.filter(s =>
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-actions">
        <button className="btn-primary" onClick={openAdd}>
          <FiPlus /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FiUser /></div>
          <div className="stat-body"><h3>{staff.length}</h3><p>Total Staff</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiShield /></div>
          <div className="stat-body">
            <h3>{staff.filter(s => s.canAccessAdminPanel).length}</h3>
            <p>Admin Panel Access</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiLock /></div>
          <div className="stat-body">
            <h3>{staff.filter(s => s.passwordLoginEnabled).length}</h3>
            <p>Password Login</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiUser /></div>
          <div className="stat-body">
            <h3>{staff.filter(s => s.isActive).length}</h3>
            <p>Active</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-row">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Contact</th>
                <th>Access Level</th>
                <th>Login Methods</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className="no-data"><td colSpan="7">No staff accounts found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: '#ede7f6', color: '#6a1b9a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, flexShrink: 0
                      }}>
                        {s.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 14, color: '#1e2a45' }}>{s.username}</strong>
                        <small style={{ color: '#9ca3af' }}>ID #{s.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      <div>{s.email}</div>
                      {s.phone && <div style={{ color: '#6b7a99' }}>{s.phone}</div>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {s.canAccessAdminPanel
                        ? <span className="status-badge active">Admin Panel</span>
                        : <span className="status-badge inactive">Staff Only</span>
                      }
                      {Array.isArray(s.permissions) && s.permissions.length > 0 && (
                        <small style={{ color: '#6b7a99', fontSize: 11 }}>
                          {s.permissions.length} permission{s.permissions.length !== 1 ? 's' : ''}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="status-badge token_paid">OTP</span>
                      {s.passwordLoginEnabled && (
                        <span className="status-badge pending">+ Password</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${s.isActive ? 'active' : 'inactive'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: '#6b7a99' }}>{formatDate(s.createdAt)}</td>
                  <td>
                    <div className="action-btns">
                      <button onClick={() => openEdit(s)} title="Edit"><FiEdit /></button>
                      <button
                        onClick={() => handleToggleActive(s)}
                        title={s.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {s.isActive ? <FiToggleRight className="toggle-active" /> : <FiToggleLeft className="toggle-inactive" />}
                      </button>
                      <button className="danger" onClick={() => handleDelete(s.id)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editing ? 'Edit Staff Account' : 'Create Staff Account'}</h2>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input name="username" value={formData.username} onChange={handleChange} placeholder="john_doe" required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone (optional)</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" />
                </div>
                <div className="form-group">
                  <label>{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                </div>
              </div>

              {/* Access Control */}
              <div style={{ background: '#f8f9ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#4a5568', margin: '0 0 12px' }}>
                  🔐 Access Control
                </p>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <div className="checkbox-row">
                    <input
                      type="checkbox"
                      id="canAccessAdminPanel"
                      name="canAccessAdminPanel"
                      checked={formData.canAccessAdminPanel}
                      onChange={handleChange}
                    />
                    <label htmlFor="canAccessAdminPanel">
                      Can access Admin Panel (redirects to /admin after login)
                    </label>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="checkbox-row">
                    <input
                      type="checkbox"
                      id="passwordLoginEnabled"
                      name="passwordLoginEnabled"
                      checked={formData.passwordLoginEnabled}
                      onChange={handleChange}
                    />
                    <label htmlFor="passwordLoginEnabled">
                      Allow password login (in addition to OTP)
                    </label>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div style={{ background: '#f8f9ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#4a5568', margin: '0 0 12px' }}>
                  🛡️ Feature Permissions
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm.key} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8,
                      background: formData.permissions.includes(perm.key) ? '#ede7f6' : 'white',
                      border: `1.5px solid ${formData.permissions.includes(perm.key) ? '#7c6ef7' : '#e2e8f0'}`,
                      cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-row">
                  <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} />
                  <label htmlFor="isActive">Account is active</label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Staff' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStaff;
