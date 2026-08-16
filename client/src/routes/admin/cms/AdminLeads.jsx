import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertCircle, FiInbox, FiRefreshCw, FiTrash2, FiX,
} from 'react-icons/fi';
import apiRequest from '../../../lib/apiRequest';
import { canManageCms } from '../../../lib/auth';
import { useAuth } from '../../../context/AuthContext';
import './AdminCms.scss';

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CONVERTED', 'LOST'];

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
};

function AdminLeads() {
  const { currentUser } = useAuth();
  const canWrite = canManageCms(currentUser);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest.get('/cms/admin/leads');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateStatus = async (lead, status) => {
    if (!canWrite) return;
    try {
      await apiRequest.put(`/cms/admin/leads/${lead.id}`, { status });
      setItems((prev) =>
        prev.map((row) => (row.id === lead.id ? { ...row, status } : row))
      );
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete || !canWrite) return;
    try {
      await apiRequest.delete(`/cms/admin/leads/${confirmDelete.id}`);
      toast.success('Lead deleted');
      setConfirmDelete(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="cms-page">
      <div className="cms-toolbar cms-toolbar--actions">
        <div className="cms-toolbar__actions">
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchItems}>
            <FiRefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="cms-state">
          <div className="cms-spinner" />
          <p>Loading leads…</p>
        </div>
      )}

      {!loading && error && (
        <div className="cms-state cms-state--error">
          <FiAlertCircle size={28} />
          <p>{error}</p>
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchItems}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="cms-state">
          <FiInbox size={32} />
          <p>No leads yet</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Date</th>
                <th className="cms-table__right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.name}</strong>
                    {lead.source && <p className="cms-muted">{lead.source}</p>}
                  </td>
                  <td>{lead.email || '—'}</td>
                  <td>{lead.phone || '—'}</td>
                  <td>
                    <select
                      className="cms-select-inline"
                      value={lead.status || 'NEW'}
                      disabled={!canWrite}
                      onChange={(e) => updateStatus(lead, e.target.value)}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="cms-muted">{formatDate(lead.createdAt)}</td>
                  <td className="cms-table__right">
                    <button
                      type="button"
                      className="cms-icon-btn danger"
                      onClick={() => setConfirmDelete(lead)}
                      disabled={!canWrite}
                      aria-label="Delete"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="cms-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="cms-modal cms-modal--sm" onClick={(e) => e.stopPropagation()} role="alertdialog">
            <div className="cms-modal__header">
              <h3>Delete lead?</h3>
              <button type="button" className="cms-icon-btn" onClick={() => setConfirmDelete(null)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <div className="cms-modal__body">
              <p>
                This will permanently remove <strong>{confirmDelete.name}</strong>.
              </p>
              <div className="cms-modal__footer">
                <button type="button" className="cms-btn cms-btn--ghost" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button type="button" className="cms-btn cms-btn--danger" onClick={doDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLeads;
