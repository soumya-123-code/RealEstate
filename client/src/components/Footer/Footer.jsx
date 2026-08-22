import { Link } from 'react-router-dom';
import {
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiYoutube,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiChevronRight,
} from 'react-icons/fi';
import { useSite } from '../../context/SiteContext';
import './Footer.scss';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/list', label: 'Properties' },
  { to: '/explore', label: 'Projects' },
  { to: '/about', label: 'About Us' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact Us' },
];

const SOCIALS = [
  { key: 'facebook', icon: FiFacebook, label: 'Facebook' },
  { key: 'instagram', icon: FiInstagram, label: 'Instagram' },
  { key: 'linkedin', icon: FiLinkedin, label: 'LinkedIn' },
  { key: 'youtube', icon: FiYoutube, label: 'YouTube' },
];

function FooterEmblem() {
  return (
    <svg className="footer-emblem" viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <circle cx="44" cy="44" r="42.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="44" cy="44" r="37.5" stroke="currentColor" strokeWidth="0.55" opacity="0.85" />
      <circle cx="44" cy="44" r="14.5" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="44" cy="44" r="4.2" fill="currentColor" />
      {[0, 45, 90, 135].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 44 44)`}>
          <path
            d="M44 8 L47.4 32.5 L44 36.5 L40.6 32.5 Z"
            fill="currentColor"
          />
          <path
            d="M44 80 L47.4 55.5 L44 51.5 L40.6 55.5 Z"
            fill="currentColor"
          />
          <path
            d="M44 18 L45.6 30.2 L44 32 L42.4 30.2 Z"
            fill="currentColor"
            opacity="0.55"
          />
        </g>
      ))}
      {[22.5, 67.5, 112.5, 157.5].map((deg) => (
        <line
          key={deg}
          x1="44"
          y1="16.5"
          x2="44"
          y2="28"
          stroke="currentColor"
          strokeWidth="0.7"
          transform={`rotate(${deg} 44 44)`}
        />
      ))}
    </svg>
  );
}

function Footer() {
  const { settings: companyInfo } = useSite();
  const currentYear = new Date().getFullYear();
  const companyName = companyInfo?.companyName || 'Suretreaven';
  const quickLinks = QUICK_LINKS;

  const location = [companyInfo?.city || 'Bhubaneswar', companyInfo?.state || 'Odisha']
    .filter(Boolean)
    .join(', ');

  return (
    <footer className="footer">
      <div className="footer-panel">
        <img className="footer-wheel" src="/brand/footer-wheel.png" alt="" aria-hidden="true" />

        <div className="footer-main">
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-lockup" aria-label={`${companyName} home`}>
              <FooterEmblem />
              <span className="footer-lockup-text">
                <span className="footer-lockup-name">{companyName.replace(/\s/g, '').toUpperCase()}</span>
                <span className="footer-lockup-tagline">Modern Homes. Rooted in Odisha.</span>
              </span>
            </Link>
            <p className="footer-description">
              Thoughtfully designed living spaces inspired by nature, culture and the
              timeless spirit of Odisha.
            </p>
            <p className="footer-description footer-description--trust">
              We build more than homes, we build trust.
            </p>
          </div>

          <span className="footer-vrule" aria-hidden="true" />

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map(({ to, label }) => (
                <li key={to + label}>
                  <Link to={to}>
                    {label}
                    <FiChevronRight />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <span className="footer-vrule" aria-hidden="true" />

          <div className="footer-section footer-connect">
            <h4 className="footer-title">Connect With Us</h4>
            <ul className="footer-contact">
              <li>
                <span className="footer-contact-icon"><FiPhone /></span>
                <a href={`tel:${companyInfo?.phone || '+919234567890'}`}>
                  {companyInfo?.phone || '+91 92345 67890'}
                </a>
              </li>
              <li>
                <span className="footer-contact-icon"><FiMail /></span>
                <a href={`mailto:${companyInfo?.email || 'info@suretreaven.com'}`}>
                  {companyInfo?.email || 'info@suretreaven.com'}
                </a>
              </li>
              <li>
                <span className="footer-contact-icon"><FiMapPin /></span>
                <span>{location}</span>
              </li>
              <li>
                <span className="footer-contact-icon"><FiClock /></span>
                <span>Mon - Sat: 9:30 AM - 6:30 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-scene" aria-hidden="true">
          <img src="/brand/footer-village.png" alt="" />
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} {companyName} Private Limited. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <span className="separator">|</span>
            <Link to="/terms">Refund Policy</Link>
            <span className="separator">|</span>
            <Link to="/privacy">Disclaimer</Link>
          </div>
          <div className="footer-social">
            {SOCIALS.map(({ key, icon: Icon, label }) => {
              const href = companyInfo?.[key];
              return (
                <a
                  key={label}
                  href={href || '#'}
                  className="footer-social-link"
                  aria-label={label}
                  target={href ? '_blank' : undefined}
                  rel={href ? 'noopener noreferrer' : undefined}
                  onClick={href ? undefined : (e) => e.preventDefault()}
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
