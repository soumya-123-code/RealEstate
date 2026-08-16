import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiAlertCircle, FiEdit2, FiExternalLink, FiInbox, FiRefreshCw, FiToggleLeft, FiToggleRight,
} from 'react-icons/fi';
import apiRequest from '../../../lib/apiRequest';
import { canManageCms } from '../../../lib/auth';
import { useAuth } from '../../../context/AuthContext';
import './AdminCms.scss';

function AdminPages() {
  const { currentUser } = useAuth();
  const canWrite = canManageCms(currentUser);

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest.get('/cms/admin/pages');
      setPages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const togglePublish = async (page) => {
    if (!canWrite) {
      toast.error('You do not have permission to manage CMS content');
      return;
    }
    try {
      await apiRequest.put(`/cms/admin/pages/${page.key}`, {
        isPublished: !page.isPublished,
      });
      setPages((prev) =>
        prev.map((p) => (p.key === page.key ? { ...p, isPublished: !p.isPublished } : p))
      );
      toast.success(page.isPublished ? 'Page unpublished' : 'Page published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update publish status');
    }
  };

  return (
    <div className="cms-page">
      <div className="cms-toolbar">
        <div>
          <h2 className="cms-toolbar__title">Website Pages</h2>
          <p className="cms-toolbar__sub">Compose and publish public page layouts</p>
        </div>
        <div className="cms-toolbar__actions">
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchPages}>
            <FiRefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="cms-state">
          <div className="cms-spinner" />
          <p>Loading pages…</p>
        </div>
      )}

      {!loading && error && (
        <div className="cms-state cms-state--error">
          <FiAlertCircle size={28} />
          <p>{error}</p>
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchPages}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && pages.length === 0 && (
        <div className="cms-state">
          <FiInbox size={32} />
          <p>No website pages found</p>
        </div>
      )}

      {!loading && !error && pages.length > 0 && (
        <div className="cms-cards">
          {pages.map((page) => {
            const sectionCount = Array.isArray(page.sections) ? page.sections.length : 0;
            const previewPath = page.path || '/';

            return (
              <article key={page.key || page.id} className="cms-card">
                <h3 className="cms-card__title">{page.title}</h3>
                <div className="cms-card__meta">
                  <span>
                    Key: <code>{page.key}</code>
                  </span>
                  <span>
                    Path: <code>{previewPath}</code>
                  </span>
                  <span>{sectionCount} section{sectionCount === 1 ? '' : 's'}</span>
                </div>
                <button
                  type="button"
                  className={`cms-status ${page.isPublished ? 'on' : 'off'}`}
                  onClick={() => togglePublish(page)}
                  disabled={!canWrite}
                  title={canWrite ? 'Toggle publish' : 'Read only'}
                >
                  {page.isPublished ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                  {page.isPublished ? 'Published' : 'Draft'}
                </button>
                <div className="cms-card__actions">
                  <Link to={`/admin/pages/${page.key}`} className="cms-btn cms-btn--primary">
                    <FiEdit2 size={14} /> Edit sections
                  </Link>
                  <a
                    href={previewPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cms-btn cms-btn--ghost"
                  >
                    <FiExternalLink size={14} /> Preview
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminPages;
