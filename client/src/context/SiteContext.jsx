import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiRequest from '../lib/apiRequest';

/**
 * Single source of truth for site-wide CMS data (company settings +
 * header/footer navigation). Navbar, Footer and Seo all consume this
 * context so the customer site reflects admin changes without
 * per-component fetching.
 */

export const DEFAULT_HEADER_NAV = [
  { id: 'h1', location: 'HEADER', label: 'Home', url: '/' },
  { id: 'h2', location: 'HEADER', label: 'Properties', url: '/list' },
  { id: 'h3', location: 'HEADER', label: 'Explore', url: '/explore' },
  { id: 'h4', location: 'HEADER', label: 'About', url: '/about' },
  { id: 'h5', location: 'HEADER', label: 'Contact', url: '/contact' },
  { id: 'h6', location: 'HEADER', label: 'Blog', url: '/blog' },
  { id: 'h7', location: 'HEADER', label: 'FAQ', url: '/faq' },
];

export const DEFAULT_FOOTER_NAV = [
  { id: 'f1', location: 'FOOTER', label: 'Home', url: '/' },
  { id: 'f2', location: 'FOOTER', label: 'Properties', url: '/list' },
  { id: 'f3', location: 'FOOTER', label: 'Projects', url: '/explore' },
  { id: 'f4', location: 'FOOTER', label: 'About Us', url: '/about' },
  { id: 'f5', location: 'FOOTER', label: 'Blog', url: '/blog' },
  { id: 'f6', location: 'FOOTER', label: 'Contact Us', url: '/contact' },
];

const SiteContext = createContext(null);

export const SiteContextProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSiteData = useCallback(async () => {
    setLoading(true);
    const [settingsRes, navRes] = await Promise.allSettled([
      apiRequest.get('/company/settings'),
      apiRequest.get('/cms/navigation'),
    ]);
    if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data || null);
    if (navRes.status === 'fulfilled') setNavItems(Array.isArray(navRes.value.data) ? navRes.value.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSiteData();
  }, [fetchSiteData]);

  const headerNav = useMemo(
    () => navItems.filter((i) => i.location === 'HEADER' && i.isActive !== false),
    [navItems]
  );
  const footerNav = useMemo(
    () => navItems.filter((i) => i.location === 'FOOTER' && i.isActive !== false),
    [navItems]
  );

  const companyName = settings?.companyName || 'Suretreaven';

  const value = useMemo(
    () => ({
      settings,
      companyName,
      headerNav: headerNav.length > 0 ? headerNav : DEFAULT_HEADER_NAV,
      footerNav: footerNav.length > 0 ? footerNav : DEFAULT_FOOTER_NAV,
      loading,
      refreshSite: fetchSiteData,
    }),
    [settings, companyName, headerNav, footerNav, loading, fetchSiteData]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteContextProvider');
  return ctx;
};

export default SiteContext;
