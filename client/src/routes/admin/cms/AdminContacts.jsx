import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertCircle, FiCheck, FiInbox, FiMail, FiRefreshCw, FiTrash2, FiX,
} from 'react-icons/fi';
import apiRequest from '../../../lib/apiRequest';
import { canManageCms } from '../../../lib/auth';
import { useAuth } from '../../../context/AuthContext';
import './AdminCms.scss';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
};

function AdminContacts() {
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
      const res = await apiRequest.get('/cms/admin/contacts');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contacts');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const markRead = async (item) => {
    if (!canWrite || item.isRead) return;
    try {
      await apiRequest.put(`/cms/admin/contacts/${item.id}/read`);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row))
      );
      toast.success('Marked as read');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete || !canWrite) return;
    try {
      await apiRequest.delete(`/cms/admin/contacts/${confirmDelete.id}`);
      toast.success('Contact deleted');
      setConfirmDelete(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="cms-page">
      <div className="cms-toolbar">
        <div>
          <h2 className="cms-toolbar__title">Contact Requests</h2>
          <p className="cms-toolbar__sub">Messages from the public contact form</p>
        </div>
        <div className="cms-toolbar__actions">
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchItems}>
            <FiRefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="cms-state">
          <div className="cms-spinner" />
          <p>Loading contacts…</p>
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
          <p>No contact requests yet</p>
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
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th className="cms-table__right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.subject && <p className="cms-muted">{item.subject}</p>}
                  </td>
                  <td>{item.email || '—'}</td>
                  <td>{item.phone || '—'}</td>
                  <td>
                    <p className="cms-muted" style={{ maxWidth: 240 }}>
                      {item.message
                        ? item.message.length > 100
                          ? `${item.message.slice(0, 100)}…`
                          : item.message
                        : '—'}
                    </p>
                  </td>
                  <td>
                    <span className={`cms-status ${item.isRead ? 'on' : 'off'}`}>
                      {item.isRead ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="cms-muted">{formatDate(item.createdAt)}</td>
                  <td className="cms-table__right">
                    <div className="cms-row-actions">
                      {!item.isRead && (
                        <button
                          type="button"
                          className="cms-icon-btn"
                          onClick={() => markRead(item)}
                          disabled={!canWrite}
                          aria-label="Mark read"
                          title="Mark as read"
                        >
                          <FiCheck size={15} />
                        </button>
                      )}
                      {item.email && (
                        <a
                          className="cms-icon-btn"
                          href={`mailto:${item.email}`}
                          aria-label="Email"
                          title="Email"
                        >
                          <FiMail size={15} />
                        </a>
                      )}
                      <button
                        type="button"
                        className="cms-icon-btn danger"
                        onClick={() => setConfirmDelete(item)}
                        disabled={!canWrite}
                        aria-label="Delete"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
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
              <h3>Delete contact?</h3>
              <button type="button" className="cms-icon-btn" onClick={() => setConfirmDelete(null)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <div className="cms-modal__body">
              <p>
                This will permanently remove the message from <strong>{confirmDelete.name}</strong>.
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

export default AdminContacts;
