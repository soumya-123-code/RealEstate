import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiEdit2, FiTrash2, FiPlus, FiX, FiImage, FiToggleLeft, FiToggleRight,
  FiInbox, FiAlertCircle, FiRefreshCw,
} from 'react-icons/fi';
import apiRequest from '../../../lib/apiRequest';
import { resolveAssetUrl } from '../../../lib/config';
import { canManageCms } from '../../../lib/auth';
import { useAuth } from '../../../context/AuthContext';
import { CMS_ENTITIES } from './cmsEntityConfigs';
import './AdminCms.scss';

const emptyFromFields = (fields) =>
  fields.reduce((acc, f) => {
    if (f.type === 'boolean') acc[f.key] = true;
    else if (f.type === 'number') acc[f.key] = 0;
    else acc[f.key] = '';
    return acc;
  }, {});

function CmsEntityPage({ entityKey }) {
  const config = CMS_ENTITIES[entityKey];
  const { currentUser } = useAuth();
  const canWrite = canManageCms(currentUser);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyFromFields(config?.fields || []));
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest.get(config.endpoint);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load content');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    setEditing(null);
    setForm(emptyFromFields(config.fields));
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    setEditing(item);
    const next = emptyFromFields(config.fields);
    config.fields.forEach((f) => {
      if (item[f.key] !== undefined && item[f.key] !== null) next[f.key] = item[f.key];
    });
    setForm(next);
    setModalOpen(true);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (fieldKey, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const res = await apiRequest.post('/company/upload-images', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url =
        res.data?.images?.[0] ||
        res.data?.urls?.[0] ||
        res.data?.[0] ||
        res.data?.url;
      if (!url) throw new Error('No URL returned');
      setField(fieldKey, url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canWrite) return;

    for (const f of config.fields) {
      if (f.required && (form[f.key] === '' || form[f.key] === null || form[f.key] === undefined)) {
        toast.error(`${f.label} is required`);
        return;
      }
    }

    const payload = { ...form };
    config.fields.forEach((f) => {
      if (f.type === 'number') payload[f.key] = Number(payload[f.key]) || 0;
      if (f.type === 'boolean') payload[f.key] = !!payload[f.key];
    });

    setSaving(true);
    try {
      if (editing) {
        await apiRequest.put(`${config.endpoint}/${editing.id}`, payload);
        toast.success('Updated successfully');
      } else {
        await apiRequest.post(config.endpoint, payload);
        toast.success('Created successfully');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item, key = 'isActive') => {
    if (!canWrite) return;
    try {
      await apiRequest.patch(`${config.endpoint}/${item.id}`, { [key]: !item[key] });
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, [key]: !row[key] } : row))
      );
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete || !canWrite) return;
    try {
      await apiRequest.delete(`${config.endpoint}/${confirmDelete.id}`);
      toast.success('Deleted');
      setConfirmDelete(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const previewImage = useMemo(() => {
    const imgField = config?.fields?.find((f) => f.type === 'image');
    if (!imgField || !form[imgField.key]) return null;
    return resolveAssetUrl(form[imgField.key]);
  }, [config, form]);

  if (!config) {
    return (
      <div className="cms-page">
        <div className="cms-state cms-state--error">
          <FiAlertCircle size={28} />
          <p>Unknown CMS entity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-page">
      <div className="cms-toolbar">
        <div>
          <h2 className="cms-toolbar__title">{config.title}</h2>
          <p className="cms-toolbar__sub">{config.subtitle}</p>
        </div>
        <div className="cms-toolbar__actions">
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchItems}>
            <FiRefreshCw size={15} /> Refresh
          </button>
          {canWrite && (
            <button type="button" className="cms-btn cms-btn--primary" onClick={openCreate}>
              <FiPlus size={15} /> Add New
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="cms-state">
          <div className="cms-spinner" />
          <p>Loading {config.title.toLowerCase()}…</p>
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
          <p>No items yet</p>
          {canWrite && (
            <button type="button" className="cms-btn cms-btn--primary" onClick={openCreate}>
              <FiPlus size={15} /> Create the first one
            </button>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Status</th>
                <th className="cms-table__right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const label =
                  item[config.labelKey]
                  || item.user?.username
                  || item.title
                  || item.name
                  || `#${item.id}`;
                const active =
                  item.isActive !== undefined
                    ? item.isActive
                    : item.isPublished !== undefined
                      ? item.isPublished
                      : true;
                const statusKey = item.isPublished !== undefined && item.isActive === undefined
                  ? 'isPublished'
                  : 'isActive';
                const thumb =
                  item.image || item.coverImage || item.avatar || item.logo || item.user?.avatar || null;

                return (
                  <tr key={item.id}>
                    <td className="cms-muted">{item.order ?? idx + 1}</td>
                    <td>
                      <div className="cms-row-main">
                        {thumb && (
                          <div className="cms-thumb">
                            <img src={resolveAssetUrl(thumb)} alt="" />
                          </div>
                        )}
                        <div>
                          <strong>{label}</strong>
                          {item.user?.username && item[config.labelKey] && (
                            <p className="cms-muted">{item.user.username}</p>
                          )}
                          {item.subtitle && <p className="cms-muted">{item.subtitle}</p>}
                          {item.slug && <p className="cms-muted">/{item.slug}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`cms-status ${active ? 'on' : 'off'}`}
                        onClick={() => canWrite && toggleActive(item, statusKey)}
                        disabled={!canWrite}
                        title={canWrite ? 'Toggle status' : 'Read only'}
                      >
                        {active ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                        {active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="cms-table__right">
                      <div className="cms-row-actions">
                        <button
                          type="button"
                          className="cms-icon-btn"
                          onClick={() => openEdit(item)}
                          disabled={!canWrite}
                          aria-label="Edit"
                        >
                          <FiEdit2 size={15} />
                        </button>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="cms-modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="cms-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="cms-modal__header">
              <h3>{editing ? 'Edit' : 'Add'} {config.title.replace(/s$/, '')}</h3>
              <button type="button" className="cms-icon-btn" onClick={() => setModalOpen(false)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <form className="cms-modal__body" onSubmit={handleSave}>
              {config.fields.map((f) => (
                <div key={f.key} className="cms-field">
                  <label htmlFor={`cms-${f.key}`}>{f.label}{f.required ? ' *' : ''}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      id={`cms-${f.key}`}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                      rows={4}
                    />
                  ) : f.type === 'boolean' ? (
                    <label className="cms-check">
                      <input
                        type="checkbox"
                        checked={!!form[f.key]}
                        onChange={(e) => setField(f.key, e.target.checked)}
                      />
                      Enabled
                    </label>
                  ) : f.type === 'image' ? (
                    <div className="cms-image-field">
                      <input
                        id={`cms-${f.key}`}
                        type="text"
                        value={form[f.key] ?? ''}
                        onChange={(e) => setField(f.key, e.target.value)}
                        placeholder="https://… or /uploads/…"
                      />
                      <label className="cms-btn cms-btn--ghost cms-upload">
                        <FiImage size={14} />
                        {uploading ? 'Uploading…' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          disabled={uploading}
                          onChange={(e) => handleUpload(f.key, e.target.files?.[0])}
                        />
                      </label>
                      {form[f.key] && (
                        <div className="cms-image-preview">
                          <img src={resolveAssetUrl(form[f.key])} alt="" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      id={`cms-${f.key}`}
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={form[f.key] ?? ''}
                      placeholder={f.placeholder || ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}

              {previewImage && (
                <p className="cms-muted cms-preview-note">Preview uses resolved asset URL for uploads.</p>
              )}

              <div className="cms-modal__footer">
                <button type="button" className="cms-btn cms-btn--ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="cms-btn cms-btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="cms-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="cms-modal cms-modal--sm" onClick={(e) => e.stopPropagation()} role="alertdialog">
            <div className="cms-modal__header">
              <h3>Delete item?</h3>
              <button type="button" className="cms-icon-btn" onClick={() => setConfirmDelete(null)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <div className="cms-modal__body">
              <p>
                This will permanently remove{' '}
                <strong>{confirmDelete[config.labelKey] || `#${confirmDelete.id}`}</strong>.
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

export default CmsEntityPage;
