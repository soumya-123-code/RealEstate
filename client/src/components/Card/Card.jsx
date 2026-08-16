import { Link } from 'react-router-dom';
import { parseImages, formatPrice, formatArea } from '../../lib/utils';
import { FiMapPin, FiMaximize, FiDroplet } from 'react-icons/fi';
import { MdKingBed } from 'react-icons/md';
import LazyImage from '../LazyImage/LazyImage';
import './Card.scss';

function Card({ property, item }) {
  property = property || item;

  if (!property) return null;

  const images = parseImages(property.images);
  const statusClass = (property.status || 'AVAILABLE').toLowerCase().replace(/_/g, '-');

  return (
    <div className="property-card">
      <Link to={`/property/${property.id}`} className="card-link">
        <div className="card-image">
          <LazyImage
            src={images[0] || '/placeholder-land.jpg'}
            alt={property.title}
            loading="lazy"
          />
          <div className="card-badges">
            <span className={`badge badge-${statusClass}`}>
              {(property.status || 'AVAILABLE').replace(/_/g, ' ')}
            </span>
            {property.saleType && (
              <span className="badge badge-sale-type">
                {property.saleType}
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="image-count">
              📷 {images.length}
            </div>
          )}
          <div className="card-image-overlay" />
        </div>

        <div className="card-content">
          <div className="card-header">
            <h3 className="card-title">{property.title}</h3>
            <div className="card-price">{formatPrice(property.price)}</div>
          </div>

          <div className="card-location">
            <FiMapPin size={14} />
            <span>{property.address}, {property.city}</span>
          </div>

          <p className="card-description">
            {(property.description || '').length > 100
              ? `${property.description.substring(0, 100)}...`
              : property.description || ''}
          </p>

          <div className="card-features">
            {property.bedroom > 0 && (
              <div className="feature">
                <MdKingBed size={16} />
                <span>{property.bedroom} Beds</span>
              </div>
            )}
            {property.bathroom > 0 && (
              <div className="feature">
                <FiDroplet size={16} />
                <span>{property.bathroom} Baths</span>
              </div>
            )}
            <div className="feature">
              <FiMaximize size={16} />
              <span>{formatArea(property.area)}</span>
            </div>
          </div>

          <div className="card-footer">
            <span className="view-details">View Details →</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default Card;
