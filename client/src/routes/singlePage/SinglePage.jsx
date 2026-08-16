import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { parseImages, parseJsonField, formatPrice, formatArea, formatDate } from '../../lib/utils';
import { FiMapPin, FiMaximize, FiCalendar, FiPhone, FiMail, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './SinglePage.scss';

function SinglePage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await apiRequest.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Property not found');
        navigate('/list');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleWhatsAppBooking = async () => {
    if (!currentUser) {
      toast.error('Please login to book property');
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await apiRequest.post('/properties/whatsapp-link', {
        propertyId: property.id
      });
      
      if (res.data.whatsappLink) {
        window.open(res.data.whatsappLink, '_blank');
        toast.success('Opening WhatsApp...');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate booking link');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="single-page">
        <div className="container">
          <div className="loading-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const images = Array.isArray(parseImages(property.images)) ? parseImages(property.images) : [];
  const amenities = parseJsonField(property.amenities);
  const features = parseJsonField(property.features);

  // Prevent runtime crashes when backend stores null/empty values
  const safeAmenities = Array.isArray(amenities) ? amenities : [];
  const safeFeatures = Array.isArray(features) ? features : [];




  return (
    <div className="single-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/list">Properties</Link>
          <span>/</span>
          <span>{property.title}</span>
        </div>

        <div className="property-layout">
          {/* Left Column - Images & Details */}
          <div className="property-main">
            {/* Image Gallery */}
            <div className="image-gallery">
              <div className="main-image">
                <img src={images[currentImageIndex] || '/placeholder.jpg'} alt={property.title} />
                <button className="share-btn" onClick={handleShare}>
                  <FiShare2 /> Share
                </button>
              </div>
              {images.length > 1 && (
                <div className="thumbnail-grid">
                  {images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`View ${index + 1}`}
                      className={currentImageIndex === index ? 'active' : ''}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="property-details">
              <div className="property-header">
                <div>
                  <h1>{property.title}</h1>
                  <div className="property-meta">
                    <span className="location">
                      <FiMapPin /> {property.address}, {property.city}, {property.state}
                    </span>
                    <span className="date">
                      <FiCalendar /> Listed {formatDate(property.createdAt)}
                    </span>
                  </div>
                </div>
                <span className={`status-badge badge-${property.status.toLowerCase().replace(/_/g, '-')}`}>
                  {property.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="property-info-grid">
                <div className="info-card">
                  <FiMaximize size={24} />
                  <div>
                    <h4>Area</h4>
                    <p>{formatArea(property.area)}</p>
                  </div>
                </div>
                <div className="info-card">
                  <span className="icon">🏷️</span>
                  <div>
                    <h4>Type</h4>
                    <p>{property.propertyType}</p>
                  </div>
                </div>
                <div className="info-card">
                  <span className="icon">💰</span>
                  <div>
                    <h4>Sale Type</h4>
                    <p>{property.saleType}</p>
                  </div>
                </div>
                <div className="info-card">
                  <span className="icon">🏠</span>
                  <div>
                    <h4>Status</h4>
                    <p>{property.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="description-section">
                <h2>Description</h2>
                <p>{property.description}</p>
              </div>

              {safeAmenities.length > 0 && (

                <div className="amenities-section">
                  <h2>Amenities</h2>
                  <div className="amenities-grid">
                    {safeAmenities.map((amenity, index) => (

                      <div key={index} className="amenity-tag">
                        ✓ {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {safeFeatures.length > 0 && (

                <div className="features-section">
                  <h2>Features</h2>
                  <div className="features-grid">
                    {safeFeatures.map((feature, index) => (

                      <div key={index} className="feature-tag">
                        • {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Map Placeholder */}
              {property.latitude && property.longitude && (
                <div className="map-section">
                  <h2>Location</h2>
                  <div className="map-placeholder">
                    <FiMapPin size={48} />
                    <p>{property.address}, {property.city}</p>
                    <a 
                      href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Price & Booking */}
          <div className="property-sidebar">
            <div className="price-card">
              <div className="price-section">
                <h3>Price</h3>
                <div className="price">{formatPrice(property.price)}</div>
                {property.tokenAmount && (
                  <div className="token-amount">
                    Token Amount: {formatPrice(property.tokenAmount)}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={handleWhatsAppBooking}
                disabled={bookingLoading || property.status === 'SOLD'}
              >
                {bookingLoading ? 'Processing...' : property.status === 'SOLD' ? 'Property Sold' : '📱 Book via WhatsApp'}
              </button>

              <div className="contact-info">
                <h4>Need Help?</h4>
                <a href="tel:+919876543210" className="contact-link">
                  <FiPhone /> Call Us
                </a>
                <a href="mailto:info@landestate.com" className="contact-link">
                  <FiMail /> Email Us
                </a>
              </div>

              <div className="property-id">
                Property ID: #{property.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
