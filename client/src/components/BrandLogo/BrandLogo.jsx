import { Link } from 'react-router-dom';
import { mediaUrl } from '../../lib/utils';
import './BrandLogo.scss';

/**
 * Suretreaven mark. Uses the uploaded company logo when present,
 * otherwise the built-in S + t-home SVG.
 */
function BrandLogo({
  to = '/',
  name = 'Suretreaven',
  tagline = 'Find · Book · Build · Belong',
  logo,
  size = 'md',
  inverted = false,
  onClick,
  className = '',
}) {
  const displayName = (name || 'Suretreaven').toUpperCase();
  const isSure = displayName.replace(/\s/g, '').startsWith('SURE');
  const nameLead = isSure ? 'SURE' : displayName.slice(0, Math.ceil(displayName.length / 2));
  const nameTail = isSure ? (displayName.slice(4) || 'TREAVEN') : displayName.slice(Math.ceil(displayName.length / 2));
  const logoSrc = logo ? mediaUrl(logo) : '';

  return (
    <Link
      to={to}
      className={`brand-logo brand-logo--${size}${inverted ? ' brand-logo--inverted' : ''}${logoSrc ? ' brand-logo--image' : ''} ${className}`.trim()}
      onClick={onClick}
      aria-label={`${name || 'Suretreaven'} home`}
    >
      <span className="brand-logo__mark" aria-hidden="true">
        {logoSrc ? (
          <img src={logoSrc} alt="" />
        ) : (
          <svg viewBox="0 0 100 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Navy S (kept from previous) */}
          <path
            className="brand-logo__s"
            d="M36 14.5
               C36 8.2 30.2 4 23.5 4
               C15.2 4 9.5 9.5 9.5 17.2
               C9.5 23.8 13.5 27.2 22 30.5
               L26.5 32.2
               C33.8 35 38 38.8 38 47
               C38 55.8 31.2 61.5 23 61.5
               C14.2 61.5 8.8 55.5 8.2 47"
            strokeWidth="8.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Gold rounded t stem */}
          <path
            className="brand-logo__t"
            d="M56 12 V58"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* t crossbar — left stub + continuous into roof on the right */}
          <path
            className="brand-logo__t"
            d="M44 27 H56"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/*
            Home grown from the right of the t crossbar
            (same idea as the yellow t-home logo reference)
          */}
          <path
            className="brand-logo__home"
            d="M56 27 L78 11 L94 27 V58 H56 Z"
          />

          {/* Four-pane window */}
          <g className="brand-logo__window">
            <rect x="69" y="33" width="13" height="12" rx="1.5" />
            <path d="M75.5 33 V45 M69 39 H82" strokeWidth="1.5" />
          </g>
        </svg>
        )}
      </span>

      <span className="brand-logo__divider" aria-hidden="true" />

      <span className="brand-logo__text">
        <span className="brand-logo__name">
          <span className="brand-logo__name-lead">{nameLead}</span>
          <span className="brand-logo__name-tail">
            {nameTail.split('').map((ch, i) =>
              ch === 'A' ? (
                <span key={`a-${i}`} className="brand-logo__a-home">
                  <svg viewBox="0 0 16 16" width="0.75em" height="0.75em" aria-hidden="true">
                    <path d="M1.5 8.2 L8 1.8 L14.5 8.2 V14 H10.2 V9.6 H5.8 V14 H1.5 Z" fill="currentColor" />
                    <rect className="brand-logo__a-door" x="6.6" y="9.6" width="2.8" height="4.4" />
                  </svg>
                </span>
              ) : (
                <span key={`c-${i}`}>{ch}</span>
              )
            )}
          </span>
        </span>
        {tagline ? (
          <span className="brand-logo__tagline">
            <span className="brand-logo__tagline-rule" />
            {tagline}
            <span className="brand-logo__tagline-rule" />
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export default BrandLogo;
