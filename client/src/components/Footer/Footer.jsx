import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useSite } from '../../context/SiteContext';
import { sanitizeAppPath } from '../../lib/sanitizeAppPath';
import BrandLogo from '../BrandLogo/BrandLogo';
import './Footer.scss';

function Footer() {
  const { settings: companyInfo, footerNav } = useSite();
  const currentYear = new Date().getFullYear();

  const companyName = companyInfo?.companyName || 'Suretreaven';
  const defaultDescription = 'Your trusted real estate partner based in Rourkela, Odisha. We help you find the perfect property across Odisha and India.';

  /** Quick links come from the CMS (Admin → Website → Navigation). */
  const quickLinks = footerNav
    .filter((item) => item.label && item.url)
    .slice(0, 8)
    .map((item) => ({
      to: sanitizeAppPath(item.url, '/'),
      label: item.label,
    }));

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* About Section */}
          <div className="footer-section">
            <div className="footer-logo">
              <BrandLogo
                name={companyName}
                tagline="Real Estate"
                size="md"
              />
            </div>
            <p className="footer-description">
              {companyInfo?.description || defaultDescription}
            </p>
            <div className="social-links">
              {companyInfo?.facebook && (
                <a href={companyInfo.facebook} className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <FiFacebook />
                </a>
              )}
              {companyInfo?.twitter && (
                <a href={companyInfo.twitter} className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <FiTwitter />
                </a>
              )}
              {companyInfo?.instagram && (
                <a href={companyInfo.instagram} className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <FiInstagram />
                </a>
              )}
              {companyInfo?.linkedin && (
                <a href={companyInfo.linkedin} className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <FiLinkedin />
                </a>
              )}
              {companyInfo?.youtube && (
                <a href={companyInfo.youtube} className="social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                  <FiYoutube />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links (CMS managed) */}
          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map(({ to, label }) => (
                <li key={to + label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types */}
          <div className="footer-section">
            <h4 className="footer-title">Property Types</h4>
            <ul className="footer-links">
              <li><Link to="/list?propertyType=APARTMENT">Apartments</Link></li>
              <li><Link to="/list?propertyType=HOUSE">Houses</Link></li>
              <li><Link to="/list?propertyType=VILLA">Villas</Link></li>
              <li><Link to="/list?propertyType=PLOT">Plots / Land</Link></li>
              <li><Link to="/list?propertyType=COMMERCIAL">Commercial</Link></li>
              <li><Link to="/list?saleType=RENT">Rental Properties</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4 className="footer-title">Contact Us</h4>
            <ul className="footer-contact">
              {companyInfo?.address && (
                <li>
                  <FiMapPin />
                  <span>
                    {companyInfo.address}
                    {companyInfo.city && `, ${companyInfo.city}`}
                    {companyInfo.state && `, ${companyInfo.state}`}
                    {companyInfo.pincode && ` - ${companyInfo.pincode}`}
                  </span>
                </li>
              )}
              {companyInfo?.phone && (
                <li>
                  <FiPhone />
                  <a href={`tel:${companyInfo.phone}`}>{companyInfo.phone}</a>
                </li>
              )}
              {companyInfo?.email && (
                <li>
                  <FiMail />
                  <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>
                </li>
              )}
              {companyInfo?.whatsappNumber && (
                <li>
                  <FiPhone />
                  <a
                    href={`https://wa.me/${companyInfo.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp Support
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {currentYear} {companyName}. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms &amp; Conditions</Link>
            {companyInfo?.website && (
              <>
                <span className="separator">|</span>
                <a href={companyInfo.website} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
