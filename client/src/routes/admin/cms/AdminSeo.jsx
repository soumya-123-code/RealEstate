import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertCircle, FiEdit2, FiImage, FiInbox, FiPlus, FiRefreshCw, FiX,
} from 'react-icons/fi';
import apiRequest from '../../../lib/apiRequest';
import { resolveAssetUrl } from '../../../lib/config';
import { canManageCms } from '../../../lib/auth';
import { useAuth } from '../../../context/AuthContext';
import './AdminCms.scss';

const emptyForm = () => ({
  page: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  ogImage: '',
});

function AdminSeo() {
  const { currentUser } = useAuth();
  const canWrite = canManageCms(currentUser);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest.get('/cms/admin/seo');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load SEO settings');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    setEditing(item);
    setForm({
      page: item.page || '',
      metaTitle: item.metaTitle || '',
      metaDescription: item.metaDescription || '',
      metaKeywords: item.metaKeywords || '',
      ogImage: item.ogImage || '',
    });
    setModalOpen(true);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const res = await apiRequest.post('/company/upload-images', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.urls?.[0] || res.data?.[0] || res.data?.url;
      if (!url) throw new Error('No URL returned');
      setField('ogImage', url);
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
    if (!form.page.trim()) {
      toast.error('Page key is required');
      return;
    }

    setSaving(true);
    try {
      await apiRequest.post('/cms/admin/seo', {
        page: form.page.trim(),
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        metaKeywords: form.metaKeywords || null,
        ogImage: form.ogImage || null,
      });
      toast.success(editing ? 'SEO updated' : 'SEO setting saved');
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-page">
      <div className="cms-toolbar cms-toolbar--actions">
        <div className="cms-toolbar__actions">
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchItems}>
            <FiRefreshCw size={15} /> Refresh
          </button>
          {canWrite && (
            <button type="button" className="cms-btn cms-btn--primary" onClick={openCreate}>
              <FiPlus size={15} /> Add / Upsert
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="cms-state">
          <div className="cms-spinner" />
          <p>Loading SEO settings…</p>
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
          <p>No SEO settings yet</p>
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
                <th>Page</th>
                <th>Meta title</th>
                <th>Keywords</th>
                <th>OG</th>
                <th className="cms-table__right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item.page}>
                  <td><strong>{item.page}</strong></td>
                  <td>
                    <div>
                      <strong>{item.metaTitle || '—'}</strong>
                      {item.metaDescription && (
                        <p className="cms-muted">
                          {item.metaDescription.length > 80
                            ? `${item.metaDescription.slice(0, 80)}…`
                            : item.metaDescription}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="cms-muted">{item.metaKeywords || '—'}</td>
                  <td>
                    {item.ogImage ? (
                      <div className="cms-thumb">
                        <img src={resolveAssetUrl(item.ogImage)} alt="" />
                      </div>
                    ) : (
                      <span className="cms-muted">—</span>
                    )}
                  </td>
                  <td className="cms-table__right">
                    <button
                      type="button"
                      className="cms-icon-btn"
                      onClick={() => openEdit(item)}
                      disabled={!canWrite}
                      aria-label="Edit"
                    >
                      <FiEdit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="cms-modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="cms-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="cms-modal__header">
              <h3>{editing ? 'Edit SEO' : 'Upsert SEO'}</h3>
              <button type="button" className="cms-icon-btn" onClick={() => setModalOpen(false)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <form className="cms-modal__body" onSubmit={handleSave}>
              <div className="cms-field">
                <label htmlFor="seo-page">Page key *</label>
                <input
                  id="seo-page"
                  value={form.page}
                  onChange={(e) => setField('page', e.target.value)}
                  placeholder="home, about, properties…"
                  required
                  disabled={!!editing}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="seo-title">Meta title</label>
                <input
                  id="seo-title"
                  value={form.metaTitle}
                  onChange={(e) => setField('metaTitle', e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="seo-desc">Meta description</label>
                <textarea
                  id="seo-desc"
                  rows={3}
                  value={form.metaDescription}
                  onChange={(e) => setField('metaDescription', e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="seo-kw">Meta keywords</label>
                <input
                  id="seo-kw"
                  value={form.metaKeywords}
                  onChange={(e) => setField('metaKeywords', e.target.value)}
                  placeholder="comma, separated, keywords"
                />
              </div>
              <div className="cms-field">
                <label htmlFor="seo-og">OG image</label>
                <div className="cms-image-field">
                  <input
                    id="seo-og"
                    type="text"
                    value={form.ogImage}
                    onChange={(e) => setField('ogImage', e.target.value)}
                  />
                  <label className="cms-btn cms-btn--ghost cms-upload">
                    <FiImage size={14} />
                    {uploading ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploading}
                      onChange={(e) => handleUpload(e.target.files?.[0])}
                    />
                  </label>
                  {form.ogImage && (
                    <div className="cms-image-preview">
                      <img src={resolveAssetUrl(form.ogImage)} alt="" />
                    </div>
                  )}
                </div>
              </div>
              <div className="cms-modal__footer">
                <button type="button" className="cms-btn cms-btn--ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="cms-btn cms-btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSeo;
