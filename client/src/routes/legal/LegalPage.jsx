import DOMPurify from 'dompurify';
import { useSite } from '../../context/SiteContext';
import Seo from '../../components/Seo/Seo';
import './LegalPage.scss';

/**
 * Legal pages (Privacy Policy / Terms & Conditions) render rich-text
 * content managed by the admin in Website Settings. Sanitized before
 * injection; a friendly placeholder shows when content is empty.
 */
function LegalPage({ kind = 'privacy' }) {
  const { settings, loading } = useSite();

  const isPrivacy = kind === 'privacy';
  const heading = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const rawContent = isPrivacy ? settings?.privacyContent : settings?.termsContent;
  const clean = rawContent ? DOMPurify.sanitize(rawContent) : '';

  return (
    <div className="legal-page">
      <Seo page={isPrivacy ? 'privacy' : 'terms'} title={heading} />
      <section className="legal-hero">
        <div className="container">
          <h1>{heading}</h1>
          <p className="legal-updated">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          {loading ? (
            <div className="legal-loading">
              <div className="spinner" />
              <p>Loading…</p>
            </div>
          ) : clean ? (
            <div
              className="legal-content"
              dangerouslySetInnerHTML={{ __html: clean }}
            />
          ) : (
            <div className="legal-empty">
              <p>
                This page has not been published yet. Please check back soon or
                contact us for more information.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default LegalPage;
