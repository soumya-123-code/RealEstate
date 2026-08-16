import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { formatPrice, parseImages } from '../../lib/utils';
import './AdminProperties.scss';

function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/admin/properties');
      setProperties(res.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await apiRequest.delete(`/admin/properties/${id}`);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete property');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiRequest.patch(`/admin/properties/${id}/status`, {
        status: newStatus
      });
      toast.success('Status updated successfully');
      fetchProperties();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredProperties = properties.filter(prop => {
    if (filter === 'ALL') return true;
    return prop.status === filter;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-properties">
      <div className="page-header">
        <div>
          <h1>Properties Management</h1>
          <p>Manage all your properties</p>
        </div>
        <Link to="/admin/add-property" className="btn-primary">
          <FiPlus /> Add Property
        </Link>
      </div>

      <div className="filters">
        <button 
          className={filter === 'ALL' ? 'active' : ''} 
          onClick={() => setFilter('ALL')}
        >
          All ({properties.length})
        </button>
        <button 
          className={filter === 'AVAILABLE' ? 'active' : ''} 
          onClick={() => setFilter('AVAILABLE')}
        >
          Available ({properties.filter(p => p.status === 'AVAILABLE').length})
        </button>
        <button 
          className={filter === 'TOKEN_BOOKED' ? 'active' : ''} 
          onClick={() => setFilter('TOKEN_BOOKED')}
        >
          Token Booked ({properties.filter(p => p.status === 'TOKEN_BOOKED').length})
        </button>
        <button 
          className={filter === 'SOLD' ? 'active' : ''} 
          onClick={() => setFilter('SOLD')}
        >
          Sold ({properties.filter(p => p.status === 'SOLD').length})
        </button>
      </div>

      <div className="properties-grid">
        {filteredProperties.length === 0 ? (
          <div className="no-data">
            <p>No properties found</p>
          </div>
        ) : (
          filteredProperties.map((property) => {
            const images = parseImages(property.images);
            const firstImage = images?.[0] || 'https://via.placeholder.com/400x300';

            return (
              <div key={property.id} className="property-card">
                <div className="property-image">
                  <img 
                    src={firstImage.startsWith('http') ? firstImage : `${window.location.origin}${firstImage}`} 
                    alt={property.title} 
                  />
                  <span className={`status-badge ${property.status.toLowerCase()}`}>
                    {property.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="property-content">
                  <h3>{property.title}</h3>
                  <p className="property-location">{property.city}, {property.state}</p>
                  
                  <div className="property-details">
                    <span>{property.bedroom} Beds</span>
                    <span>{property.bathroom} Baths</span>
                    <span>{property.area} sqft</span>
                  </div>

                  <div className="property-price">
                    <div>
                      <small>Price</small>
                      <strong>{formatPrice(property.price)}</strong>
                    </div>
                    <div>
                      <small>Token</small>
                      <strong>{formatPrice(property.tokenAmount)}</strong>
                    </div>
                  </div>

                  <div className="property-type">
                    <span className="type-badge">{property.propertyType}</span>
                    <span className="sale-badge">{property.saleType}</span>
                  </div>

                  <div className="property-actions">
                    <select 
                      value={property.status}
                      onChange={(e) => handleStatusChange(property.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="TOKEN_BOOKED">Token Booked</option>
                      <option value="SOLD">Sold</option>
                      <option value="RENTED">Rented</option>
                      <option value="UNAVAILABLE">Unavailable</option>
                    </select>

                    <div className="action-buttons">
                      <button 
                        className="btn-view"
                        onClick={() => window.open(`/property/${property.id}`, '_blank')}
                        title="View"
                      >
                        <FiEye />
                      </button>
                      <button 
                        className="btn-edit"
                        onClick={() => navigate(`/admin/edit-property/${property.id}`)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(property.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminProperties;
