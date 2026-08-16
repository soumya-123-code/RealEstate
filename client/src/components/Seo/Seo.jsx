import { useEffect } from 'react';
import apiRequest from '../../lib/apiRequest';
import { resolveAssetUrl } from '../../lib/config';
import { useSite } from '../../context/SiteContext';

// Module-level cache so revisiting a page doesn't refetch SEO data.
const seoCache = new Map();
const seoInflight = new Map();

async function loadSeo(page) {
  if (seoCache.has(page)) return seoCache.get(page);
  if (seoInflight.has(page)) return seoInflight.get(page);

  const promise = apiRequest
    .get(`/cms/seo/${page}`)
    .then((res) => {
      const data = res.data && typeof res.data === 'object' ? res.data : {};
      seoCache.set(page, data);
      seoInflight.delete(page);
      return data;
    })
    .catch(() => {
      seoInflight.delete(page);
      seoCache.set(page, {});
      return {};
    });

  seoInflight.set(page, promise);
  return promise;
}

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Declarative page SEO. Falls back to company defaults from SiteContext,
 * then to sane static defaults — never renders "undefined".
 *
 * <Seo page="home" title="…" description="…" />
 */
function Seo({ page = 'home', title, description, image, path }) {
  const { settings } = useSite();

  useEffect(() => {
    let cancelled = false;

    const apply = (seo) => {
      if (cancelled) return;
      const finalTitle = title || seo?.metaTitle || settings?.metaTitle || `${settings?.companyName || 'Suretreaven'} | Premium Real Estate`;
      const finalDesc = description || seo?.metaDescription || settings?.metaDescription || 'Discover premium properties with transparent pricing, trusted guidance, and seamless booking.';
      const finalImage = image || seo?.ogImage || settings?.companyLogo || '';
      const canonical = `${window.location.origin}${path || window.location.pathname}`;

      document.title = finalTitle;
      upsertMeta('name', 'description', finalDesc);
      upsertMeta('property', 'og:title', finalTitle);
      upsertMeta('property', 'og:description', finalDesc);
      upsertMeta('property', 'og:type', 'website');
      upsertMeta('property', 'og:url', canonical);
      upsertMeta('name', 'twitter:title', finalTitle);
      upsertMeta('name', 'twitter:description', finalDesc);
      if (finalImage) {
        const imgUrl = resolveAssetUrl(finalImage);
        upsertMeta('property', 'og:image', imgUrl);
        upsertMeta('name', 'twitter:image', imgUrl);
      }

      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    };

    if (seoCache.has(page)) {
      apply(seoCache.get(page));
    } else {
      apply(null);
      loadSeo(page).then(apply);
    }

    return () => {
      cancelled = true;
    };
  }, [page, title, description, image, path, settings]);

  return null;
}

export default Seo;
