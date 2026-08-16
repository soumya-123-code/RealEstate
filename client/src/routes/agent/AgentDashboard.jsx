import { useEffect, useState } from 'react';
import { FiArrowRight, FiHome, FiMapPin } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import './AgentDashboard.scss';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest.get('/agent/properties')
      .then((res) => active && setProperties(res.data?.properties || []))
      .catch(() => active && setError("We couldn't load your dashboard. Please try again."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="agent-dashboard">
      <div className="dashboard-header">
        <div><h1>Agent Dashboard</h1><p>Manage your properties, bookings and customer conversations.</p></div>
      </div>
      {error && <div className="content-card"><p>{error}</p></div>}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><FiHome /></div><div className="stat-info"><h3>{loading ? '—' : properties.length}</h3><p>My Properties</p></div></div>
      </div>
      <div className="dashboard-content">
        <div className="content-card">
          <div className="card-header"><h2>Recent Properties</h2><button onClick={() => navigate('/agent/properties')}>View All <FiArrowRight /></button></div>
          <div className="property-list">
            {!loading && properties.length === 0 && <div className="empty-state"><p>No properties are assigned to you yet.</p></div>}
            {properties.slice(0, 5).map((property) => (
              <button key={property.id} className="property-item" onClick={() => navigate(`/property/${property.id}`)}>
                <div className="property-thumb">
                  {Array.isArray(property.images) && property.images[0] ? <img src={property.images[0]} alt={property.title} /> : <div className="no-image"><FiHome /></div>}
                </div>
                <div className="property-info"><h4>{property.title}</h4><p><FiMapPin /> {property.city}, {property.state}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
