import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { FiSearch, FiMapPin, FiMaximize2, FiBookmark, FiMessageSquare, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { MdBed, MdBathtub } from 'react-icons/md';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { parseImages } from '../../lib/utils';
import { PLACEHOLDER_PROPERTY } from '../../lib/brand-images';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './PropertiesListMapview.scss';

// Custom icon for selected property (RED)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default blue icon
const blueIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getOwner = (property) => property.user || property.agent?.user;

const getPropertyImage = (property) => {
  const firstImage = parseImages(property.images)[0] || PLACEHOLDER_PROPERTY;
  return firstImage.startsWith('http')
    ? firstImage
    : `${window.location.origin}${firstImage}`;
};

function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13, { animate: true });
    }
  }, [center, map]);
  
  return null;
}

function PropertiesListMapview() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const propertyRefs = useRef({});

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    type: searchParams.get('type') || 'any',
    propertyType: searchParams.get('propertyType') || 'any',
    minPrice: searchParams.get('minPrice') || 0,
    maxPrice: searchParams.get('maxPrice') || 0,
    bedroom: searchParams.get('bedroom') || 'any',
  });

  useEffect(() => {
    fetchProperties();
  }, []);
const fetchProperties = async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams();
    
    if (filters.city) params.append('city', filters.city);
    if (filters.type !== 'any') params.append('saleType', filters.type);
    if (filters.propertyType !== 'any') params.append('propertyType', filters.propertyType);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.bedroom !== 'any') params.append('bedroom', filters.bedroom);

    const res = await apiRequest.get(`/properties?${params.toString()}`);
    
    // ⭐ DEBUG: Check if user data is included
    
    const propertyList = res.data?.properties || res.data || [];

    setProperties(propertyList);

    if (propertyList.length > 0 && propertyList[0].latitude && propertyList[0].longitude) {
      setMapCenter([parseFloat(propertyList[0].latitude), parseFloat(propertyList[0].longitude)]);
      setSelectedProperty(propertyList[0]);
    } else {
      setSelectedProperty(null);
    }
  } catch (error) {
    console.error('Error fetching properties:', error);
    toast.error('Failed to load properties');
  } finally {
    setLoading(false);
  }
};


  const handlePropertyClick = (property) => {
    if (property.latitude && property.longitude) {
      setSelectedProperty(property);
      setMapCenter([parseFloat(property.latitude), parseFloat(property.longitude)]);
      
      if (propertyRefs.current[property.id]) {
        propertyRefs.current[property.id].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="property-list-page">
      {/* Search Bar */}
      <div className="search-bar">
        <div className="container-fluid">
          <h1>Search results for</h1>
          
          <div className="filters">
            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                name="city"
                placeholder="City Location"
                value={filters.city}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="any">Any</option>
                <option value="SALE">Sale</option>
                <option value="RENT">Rent</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Property</label>
              <select name="propertyType" value={filters.propertyType} onChange={handleFilterChange}>
                <option value="any">any</option>
                <option value="PLOT">Plot</option>
                <option value="APARTMENT">Apartment</option>
                <option value="VILLA">Villa</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Min Price</label>
              <input type="number" name="minPrice" placeholder="0" value={filters.minPrice} onChange={handleFilterChange} />
            </div>

            <div className="filter-group">
              <label>Max Price</label>
              <input type="number" name="maxPrice" placeholder="0" value={filters.maxPrice} onChange={handleFilterChange} />
            </div>

            <div className="filter-group">
              <label>Bedroom</label>
              <select name="bedroom" value={filters.bedroom} onChange={handleFilterChange}>
                <option value="any">any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4+</option>
              </select>
            </div>

            <button className="btn-search" onClick={fetchProperties}>
              <FiSearch size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* List + Map */}
      <div className="list-map-container">
        <div className="properties-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <FiMapPin size={60} />
              <h3>No properties found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                ref={(el) => (propertyRefs.current[property.id] = el)}
                className={`property-card ${selectedProperty?.id === property.id ? 'active' : ''}`}
                onClick={() => handlePropertyClick(property)}
              >
                <div className="property-image">
                  <img
                    src={getPropertyImage(property)}
                    alt={property.title}
                  />
                </div>

                <div className="property-content">
                  <div className="property-header">
                    <h3 className="property-title">{property.title}</h3>
                    <div className="property-actions">
                      <button className="btn-icon-sm">
                        <FiBookmark size={18} />
                      </button>
                      <button className="btn-icon-sm">
                        <FiMessageSquare size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="property-location">
                    <FiMapPin size={14} />
                    <span>{property.address}</span>
                  </div>

                  <div className="property-meta">
                    <div className="property-price">{formatPrice(property.price)}</div>
                    <div className="property-features">
                      {property.bedroom > 0 && (
                        <span className="feature">
                          <MdBed size={16} /> {property.bedroom} bedroom
                        </span>
                      )}
                      {property.bathroom > 0 && (
                        <span className="feature">
                          <MdBathtub size={16} /> {property.bathroom} bathroom
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Owner Info in Card */}
                  {getOwner(property) && (
                    <div className="property-owner">
                      <div className="owner-avatar-sm">
                        {getOwner(property).avatar ? (
                          <img src={getOwner(property).avatar} alt={getOwner(property).username} />
                        ) : (
                          <span>{getOwner(property).username?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="owner-name">{getOwner(property).username}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="map-container">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} />
            {properties.map((property) => {
              if (!property.latitude || !property.longitude) return null;
              
              // Use red icon for selected property, blue for others
              const isSelected = selectedProperty?.id === property.id;
              
              return (
                <Marker
                  key={property.id}
                  position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
                  icon={isSelected ? redIcon : blueIcon}
                  eventHandlers={{ click: () => handlePropertyClick(property) }}
                >
                  <Popup>
                    <div className="map-popup">
                      <img src={getPropertyImage(property)} alt={property.title} />
                      <h4>{property.title}</h4>
                      <p className="popup-price">{formatPrice(property.price)}</p>
                      <p className="popup-location">
                        <FiMapPin size={12} /> {property.address}
                      </p>

                      {/* User/Owner Details */}
                      {getOwner(property) && (
                        <div className="popup-owner">
                          <div className="owner-avatar">
                            {getOwner(property).avatar ? (
                              <img src={getOwner(property).avatar} alt={getOwner(property).username} />
                            ) : (
                              <div className="avatar-placeholder">
                                {getOwner(property).username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="owner-info">
                            <p className="owner-name">
                              <FiUser size={12} /> {getOwner(property).username}
                            </p>
                            {getOwner(property).phone && (
                              <a href={`tel:${getOwner(property).phone}`} className="owner-contact">
                                <FiPhone size={12} /> {getOwner(property).phone}
                              </a>
                            )}
                            {getOwner(property).email && (
                              <a href={`mailto:${getOwner(property).email}`} className="owner-contact">
                                <FiMail size={12} /> {getOwner(property).email}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default PropertiesListMapview;
