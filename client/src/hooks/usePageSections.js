import { useEffect, useMemo, useState } from 'react';
import apiRequest from '../lib/apiRequest';

/**
 * Fetch the CMS page composition (WebsitePage + PageSections) for a page key
 * (home | about | contact | faq | properties | blog). Provides helpers to
 * look up sections by key/type and check visibility, with a permissive
 * fallback so the site still renders if the CMS is unreachable.
 */
export function usePageSections(pageKey) {
  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiRequest
      .get(`/cms/pages/${pageKey}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        setPage(data);
        setSections(Array.isArray(data.sections) ? data.sections : []);
      })
      .catch(() => {
        if (cancelled) return;
        // Page unpublished or CMS down → render with built-in defaults.
        setPage(null);
        setSections([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  const byKey = useMemo(() => {
    const map = {};
    for (const s of sections) map[s.key] = s;
    return map;
  }, [sections]);

  const byType = useMemo(() => {
    const map = {};
    for (const s of sections) {
      if (!map[s.type]) map[s.type] = s;
    }
    return map;
  }, [sections]);

  /** Section lookup by key (falls back to type match, e.g. unique CTA) */
  const section = (key, type) => byKey[key] || (type ? byType[type] : undefined);

  /** True when the section exists AND is active in the composition */
  const isActive = (key, type) => {
    const s = section(key, type);
    return !!s && s.isActive !== false;
  };

  /**
   * Visibility gate for rendering: sections stay visible when the
   * composition is unavailable (fresh install / API down) and are only
   * hidden when the admin explicitly disabled or removed them.
   */
  const show = (key, type) => (sections.length === 0 ? true : isActive(key, type));

  /** Pick a section value with a fallback: section?.[field] ?? fallback */
  const value = (key, type, field, fallback) => {
    const s = section(key, type);
    const v = s?.[field];
    return v === undefined || v === null || v === '' ? fallback : v;
  };

  return { page, sections, byKey, byType, section, isActive, show, value, loading };
}

export default usePageSections;
