import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { FiHome, FiMapPin, FiCalendar, FiUsers, FiLogOut, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './AgentDashboard.scss';

function AgentDashboard() {
  const { currentUser, isAgent, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    properties: 0,
    bookings: 0,
    inquiries: 0
  });
  const [recentProperties, setRecentProperties] = useState([]);

  useEffect(() => {
    if (!isAgent()) {
      navigate('/agent/login');
    }
  }, [isAgent, navigate]);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const res = await apiRequest.get('/cms/agents');
        if (res.data) {
          const agentData = res.data.find(a => a.email === currentUser?.email);
          if (agentData) {
            setStats({
              properties: agentData.propertyCount || 0,
              bookings: 0,
              inquiries: 0
            });
            setRecentProperties(agentData.properties?.slice(0, 5) || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agent data:', error);
      }
    };

    if (currentUser) {
      fetchAgentData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await apiRequest.post('/auth/logout');
      logout();
      navigate('/agent/login');
    } catch (error) {
      console.error('Logout failed:', error);
      logout();
      navigate('/agent/login');
    }
  };

  return (
    <div className="agent-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Agent Portal</h1>
          <p>Welcome back, {currentUser?.name || 'Agent'}</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FiHome /></div>
          <div className="stat-info">
            <h3>{stats.properties}</h3>
            <p>Properties</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiCalendar /></div>
          <div className="stat-info">
            <h3>{stats.bookings}</h3>
            <p>Bookings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiUsers /></div>
          <div className="stat-info">
            <h3>{stats.inquiries}</h3>
            <p>Inquiries</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-card">
          <div className="card-header">
            <h2>Your Properties</h2>
            <button onClick={() => navigate('/list')}>
              View All <FiChevronRight />
            </button>
          </div>
          <div className="property-list">
            {recentProperties.length > 0 ? (
              recentProperties.map(property => (
                <div key={property.id} className="property-item" onClick={() => navigate(`/property/${property.id}`)}>
                  <div className="property-thumb">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt={property.title} />
                    ) : (
                      <div className="no-image"><FiHome /></div>
                    )}
                  </div>
                  <div className="property-info">
                    <h4>{property.title}</h4>
                    <p><FiMapPin /> {property.city}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No properties yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard;