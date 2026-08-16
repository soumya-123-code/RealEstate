import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiMapPin } from 'react-icons/fi';
import apiRequest from '../../lib/apiRequest';

export default function AgentProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest.get('/agent/properties')
      .then((res) => active && setProperties(res.data?.properties || []))
      .catch(() => active && setError("We couldn't load your properties. Please try again."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <div className="agent-dashboard"><p>Loading properties…</p></div>;
  if (error) return <div className="agent-dashboard"><p>{error}</p></div>;

  return (
    <div className="agent-dashboard">
      <div className="dashboard-header">
        <div><h1>My Properties</h1><p>Properties assigned to you.</p></div>
      </div>
      {properties.length === 0 ? (
        <div className="content-card"><p>No properties are assigned to you yet.</p></div>
      ) : (
        <div className="property-list">
          {properties.map((property) => (
            <Link key={property.id} to={`/property/${property.id}`} className="property-item">
              <div className="property-thumb">
                {Array.isArray(property.images) && property.images[0]
                  ? <img src={property.images[0]} alt={property.title} />
                  : <div className="no-image"><FiHome /></div>}
              </div>
              <div className="property-info">
                <h4>{property.title}</h4>
                <p><FiMapPin /> {property.city}, {property.state}</p>
                <small>{property.status.replaceAll('_', ' ')}</small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
