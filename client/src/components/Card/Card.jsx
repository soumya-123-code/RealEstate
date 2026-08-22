import { Link } from 'react-router-dom';
import { parseImages, formatPrice } from '../../lib/utils';
import { FiMaximize, FiMapPin, FiHeart } from 'react-icons/fi';
import { MdKingBed, MdBathtub } from 'react-icons/md';
import LazyImage from '../LazyImage/LazyImage';
import { PLACEHOLDER_PROPERTY, cardArtFor } from '../../lib/brand-images';
import './Card.scss';

const TYPE_LABELS = {
  VILLA: 'Premium Villa',
  APARTMENT: 'Luxury Apartment',
  HOUSE: 'Premium Home',
  PLOT: 'Premium Plot',
  COMMERCIAL: 'Commercial',
};

function Card({ property, item }) {
  property = property || item;

  if (!property) return null;

  const images = parseImages(property.images);
  const area = Number.parseInt(property.area, 10);
  const areaLabel = Number.isFinite(area) && area > 0
    ? `${area.toLocaleString('en-IN')} Sqft`
    : '';
  const typeKey = String(property.propertyType || '').toUpperCase();
  const badge = TYPE_LABELS[typeKey] || property.saleType || typeKey || 'Featured';
  const location = [property.city, property.state || 'Odisha'].filter(Boolean).join(', ');

  return (
    <article className="property-card">
      <Link to={`/property/${property.id}`} className="card-link">
        <div className="card-image">
          <LazyImage
            src={images[0] || PLACEHOLDER_PROPERTY}
            alt={property.title}
            loading="lazy"
          />
          {badge && <span className="card-badge">{badge}</span>}
        </div>

        <div className="card-content">
          <h3 className="card-title">{property.title}</h3>
          <p className="card-location">
            <FiMapPin />
            <span>{location}</span>
          </p>

          <div className="card-features">
            {property.bedroom > 0 && (
              <span className="feature">
                <MdKingBed />
                {property.bedroom} Beds
              </span>
            )}
            {property.bathroom > 0 && (
              <span className="feature">
                <MdBathtub />
                {property.bathroom} Baths
              </span>
            )}
            {areaLabel && (
              <span className="feature">
                <FiMaximize />
                {areaLabel}
              </span>
            )}
          </div>

        </div>

        <div className="card-footer">
          <div className="card-price-block">
            <span className="card-price-label">Starting From</span>
            <p className="card-price">{formatPrice(property.price)}</p>
          </div>
          <img
            className="card-saura"
            src={cardArtFor(property.id)}
            alt=""
            aria-hidden="true"
          />
        </div>
      </Link>
      <button
        type="button"
        className="card-fav"
        aria-label="Save property"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <FiHeart />
      </button>
    </article>
  );
}

export default Card;
