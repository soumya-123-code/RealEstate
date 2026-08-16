import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiAlertCircle, FiArrowDown, FiArrowLeft, FiArrowUp, FiEdit2, FiExternalLink,
  FiEye, FiEyeOff, FiImage, FiPlus, FiRefreshCw, FiTrash2, FiX,
} from 'react-icons/fi';
import apiRequest from '../../../lib/apiRequest';
import { resolveAssetUrl } from '../../../lib/config';
import { canManageCms } from '../../../lib/auth';
import { useAuth } from '../../../context/AuthContext';
import { SECTION_TYPES } from './cmsEntityConfigs';
import './AdminCms.scss';

const emptySection = () => ({
  key: '',
  type: 'CUSTOM',
  title: '',
  subtitle: '',
  content: '',
  image: '',
  buttonText: '',
  buttonLink: '',
  isActive: true,
});

function AdminPageEditor() {
  const { key } = useParams();
  const { currentUser } = useAuth();
  const canWrite = canManageCms(currentUser);

  const [page, setPage] = useState(null);
  const [meta, setMeta] = useState({
    title: '',
    description: '',
    path: '',
    isPublished: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySection);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchPage = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest.get(`/cms/admin/pages/${key}`);
      const data = res.data;
      setPage(data);
      setMeta({
        title: data.title || '',
        description: data.description || '',
        path: data.path || '',
        isPublished: data.isPublished !== false,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load page');
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const setField = (k, value) => setForm((prev) => ({ ...prev, [k]: value }));

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
      setField('image', url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveMeta = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    setSavingMeta(true);
    try {
      const res = await apiRequest.put(`/cms/admin/pages/${key}`, {
        title: meta.title,
        description: meta.description,
        path: meta.path,
        isPublished: !!meta.isPublished,
      });
      setPage(res.data);
      toast.success('Page settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save page');
    } finally {
      setSavingMeta(false);
    }
  };

  const openCreate = () => {
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    setEditing(null);
    setForm(emptySection());
    setModalOpen(true);
  };

  const openEdit = (section) => {
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    setEditing(section);
    setForm({
      key: section.key || '',
      type: section.type || 'CUSTOM',
      title: section.title || '',
      subtitle: section.subtitle || '',
      content: section.content || '',
      image: section.image || '',
      buttonText: section.buttonText || '',
      buttonLink: section.buttonLink || '',
      isActive: section.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!canWrite) return;
    if (!form.key.trim()) {
      toast.error('Section key is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        key: form.key.trim(),
        type: form.type,
        title: form.title || null,
        subtitle: form.subtitle || null,
        content: form.content || null,
        image: form.image || null,
        buttonText: form.buttonText || null,
        buttonLink: form.buttonLink || null,
        isActive: !!form.isActive,
      };

      if (editing) {
        await apiRequest.patch(`/cms/admin/sections/${editing.id}`, payload);
        toast.success('Section updated');
      } else {
        await apiRequest.post(`/cms/admin/pages/${key}/sections`, payload);
        toast.success('Section created');
      }
      setModalOpen(false);
      fetchPage();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = async (section) => {
    if (!canWrite) return;
    try {
      await apiRequest.patch(`/cms/admin/sections/${section.id}`, {
        isActive: !section.isActive,
      });
      setPage((prev) => ({
        ...prev,
        sections: (prev.sections || []).map((s) =>
          s.id === section.id ? { ...s, isActive: !s.isActive } : s
        ),
      }));
      toast.success('Section status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const moveSection = async (index, direction) => {
    if (!canWrite || !page?.sections) return;
    const list = [...page.sections];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;

    [list[index], list[target]] = [list[target], list[index]];
    const sectionIds = list.map((s) => s.id);
    setPage((prev) => ({ ...prev, sections: list }));

    try {
      await apiRequest.put(`/cms/admin/pages/${key}/sections/reorder`, { sectionIds });
      toast.success('Order updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reorder failed');
      fetchPage();
    }
  };

  const doDelete = async () => {
    if (!confirmDelete || !canWrite) return;
    try {
      await apiRequest.delete(`/cms/admin/sections/${confirmDelete.id}`);
      toast.success('Section deleted');
      setConfirmDelete(null);
      fetchPage();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const previewPath = meta.path || page?.path || '/';
  const sections = page?.sections || [];

  if (loading) {
    return (
      <div className="cms-page">
        <div className="cms-state">
          <div className="cms-spinner" />
          <p>Loading page…</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="cms-page">
        <div className="cms-state cms-state--error">
          <FiAlertCircle size={28} />
          <p>{error || 'Page not found'}</p>
          <Link to="/admin/cms/pages" className="cms-btn cms-btn--ghost">
            <FiArrowLeft size={15} /> Back to pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-page">
      <div className="cms-toolbar">
        <div>
          <h2 className="cms-toolbar__title">{page.title || key}</h2>
          <p className="cms-toolbar__sub">
            Edit layout for <code>{key}</code>
          </p>
        </div>
        <div className="cms-toolbar__actions">
          <Link to="/admin/cms/pages" className="cms-btn cms-btn--ghost">
            <FiArrowLeft size={15} /> Pages
          </Link>
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchPage}>
            <FiRefreshCw size={15} /> Refresh
          </button>
          <a
            href={previewPath}
            target="_blank"
            rel="noopener noreferrer"
            className="cms-btn cms-btn--ghost"
          >
            <FiExternalLink size={15} /> Preview
          </a>
          {canWrite && (
            <button type="button" className="cms-btn cms-btn--primary" onClick={openCreate}>
              <FiPlus size={15} /> Add section
            </button>
          )}
        </div>
      </div>

      <form className="cms-meta-form" onSubmit={saveMeta}>
        <div className="cms-field">
          <label htmlFor="page-title">Title</label>
          <input
            id="page-title"
            value={meta.title}
            onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))}
            disabled={!canWrite}
          />
        </div>
        <div className="cms-field">
          <label htmlFor="page-path">Public path</label>
          <input
            id="page-path"
            value={meta.path}
            onChange={(e) => setMeta((p) => ({ ...p, path: e.target.value }))}
            disabled={!canWrite}
            placeholder="/"
          />
        </div>
        <div className="cms-field cms-field--full">
          <label htmlFor="page-desc">Description</label>
          <textarea
            id="page-desc"
            rows={3}
            value={meta.description}
            onChange={(e) => setMeta((p) => ({ ...p, description: e.target.value }))}
            disabled={!canWrite}
          />
        </div>
        <div className="cms-field">
          <label className="cms-check">
            <input
              type="checkbox"
              checked={!!meta.isPublished}
              onChange={(e) => setMeta((p) => ({ ...p, isPublished: e.target.checked }))}
              disabled={!canWrite}
            />
            Published
          </label>
        </div>
        {canWrite && (
          <div className="cms-meta-form__actions">
            <button type="submit" className="cms-btn cms-btn--primary" disabled={savingMeta}>
              {savingMeta ? 'Saving…' : 'Save page settings'}
            </button>
          </div>
        )}
      </form>

      {sections.length === 0 ? (
        <div className="cms-state">
          <p>No sections on this page yet</p>
          {canWrite && (
            <button type="button" className="cms-btn cms-btn--primary" onClick={openCreate}>
              <FiPlus size={15} /> Add first section
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="cms-list-hint">
            <FiEye size={13} />
            Use <strong>Visible / Hidden</strong> to control which sections appear on the live
            website, and the arrows to change their order.
          </p>
          <div className="cms-section-list">
          {sections.map((section, idx) => (
            <div key={section.id} className={`cms-section-row ${section.isActive ? '' : 'is-hidden'}`}>
              <div className="cms-section-row__order">
                <button
                  type="button"
                  className="cms-icon-btn"
                  disabled={!canWrite || idx === 0}
                  onClick={() => moveSection(idx, -1)}
                  aria-label="Move up"
                >
                  <FiArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="cms-icon-btn"
                  disabled={!canWrite || idx === sections.length - 1}
                  onClick={() => moveSection(idx, 1)}
                  aria-label="Move down"
                >
                  <FiArrowDown size={14} />
                </button>
              </div>
              <div className="cms-section-row__info">
                <strong>{section.title || section.key}</strong>
                <p className="cms-muted">
                  <span className="cms-badge cms-badge--gold">{section.type}</span>
                  {' '}
                  key: {section.key}
                </p>
                {section.subtitle && <p className="cms-muted">{section.subtitle}</p>}
              </div>
              <div className="cms-section-row__actions">
                <button
                  type="button"
                  className={`cms-visibility ${section.isActive ? 'visible' : 'hidden'}`}
                  onClick={() => toggleSection(section)}
                  disabled={!canWrite}
                  title={
                    section.isActive
                      ? 'Hide this section from the website'
                      : 'Show this section on the website'
                  }
                >
                  {section.isActive ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                  {section.isActive ? 'Visible' : 'Hidden'}
                </button>
                <button
                  type="button"
                  className="cms-icon-btn"
                  onClick={() => openEdit(section)}
                  disabled={!canWrite}
                  aria-label="Edit"
                >
                  <FiEdit2 size={15} />
                </button>
                <button
                  type="button"
                  className="cms-icon-btn danger"
                  onClick={() => setConfirmDelete(section)}
                  disabled={!canWrite}
                  aria-label="Delete"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {modalOpen && (
        <div className="cms-modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="cms-modal cms-modal--lg" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="cms-modal__header">
              <h3>{editing ? 'Edit section' : 'Add section'}</h3>
              <button type="button" className="cms-icon-btn" onClick={() => setModalOpen(false)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <form className="cms-modal__body" onSubmit={handleSaveSection}>
              <div className="cms-field">
                <label htmlFor="sec-key">Key *</label>
                <input
                  id="sec-key"
                  value={form.key}
                  onChange={(e) => setField('key', e.target.value)}
                  placeholder="hero, featured, cta…"
                  required
                />
              </div>
              <div className="cms-field">
                <label htmlFor="sec-type">Type</label>
                <select
                  id="sec-type"
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                >
                  {SECTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="cms-field">
                <label htmlFor="sec-title">Title</label>
                <input
                  id="sec-title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="sec-sub">Subtitle</label>
                <textarea
                  id="sec-sub"
                  rows={2}
                  value={form.subtitle}
                  onChange={(e) => setField('subtitle', e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="sec-content">Content</label>
                <textarea
                  id="sec-content"
                  rows={4}
                  value={form.content}
                  onChange={(e) => setField('content', e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="sec-image">Image</label>
                <div className="cms-image-field">
                  <input
                    id="sec-image"
                    type="text"
                    value={form.image}
                    onChange={(e) => setField('image', e.target.value)}
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
                      onChange={(e) => handleUpload(e.target.files?.[0])}
                    />
                  </label>
                  {form.image && (
                    <div className="cms-image-preview">
                      <img src={resolveAssetUrl(form.image)} alt="" />
                    </div>
                  )}
                </div>
              </div>
              <div className="cms-field">
                <label htmlFor="sec-btn-text">Button text</label>
                <input
                  id="sec-btn-text"
                  value={form.buttonText}
                  onChange={(e) => setField('buttonText', e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="sec-btn-link">Button link</label>
                <input
                  id="sec-btn-link"
                  value={form.buttonLink}
                  onChange={(e) => setField('buttonLink', e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label className="cms-check">
                  <input
                    type="checkbox"
                    checked={!!form.isActive}
                    onChange={(e) => setField('isActive', e.target.checked)}
                  />
                  Active
                </label>
              </div>
              <div className="cms-modal__footer">
                <button type="button" className="cms-btn cms-btn--ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="cms-btn cms-btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create section'}
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
              <h3>Delete section?</h3>
              <button type="button" className="cms-icon-btn" onClick={() => setConfirmDelete(null)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <div className="cms-modal__body">
              <p>
                This will permanently remove{' '}
                <strong>{confirmDelete.title || confirmDelete.key}</strong>.
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

export default AdminPageEditor;
