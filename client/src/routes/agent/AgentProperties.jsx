import { useEffect, useState } from 'react';
import { FiEdit3, FiHome, FiMapPin, FiSave } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';

const statuses = ['AVAILABLE', 'TOKEN_BOOKED', 'SOLD', 'RENTED', 'UNAVAILABLE', 'UNDER_CONSTRUCTION'];

export default function AgentProperties() {
  const [properties, setProperties] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ status: '', price: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try { setLoading(true); const res = await apiRequest.get('/agent/properties'); setProperties(res.data?.properties || []); setError(''); }
    catch { setError("We couldn't load your properties. Please try again."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const startEdit = (property) => { setEditing(property.id); setDraft({ status: property.status, price: property.price }); };
  const save = async (id) => {
    try { await apiRequest.patch(`/agent/properties/${id}`, { status: draft.status, price: Number(draft.price) }); setEditing(null); await load(); }
    catch { setError("We couldn't update the property. Please try again."); }
  };

  if (loading) return <div className="agent-dashboard"><p>Loading properties…</p></div>;
  return <div className="agent-dashboard"><div className="dashboard-header"><div><h1>My Properties</h1><p>Review and update the price or availability of your assigned properties.</p></div></div>{error && <div className="content-card"><p>{error}</p></div>}{properties.length === 0 ? <div className="content-card"><p>No properties are assigned to you yet.</p></div> : <div className="property-list">{properties.map((property) => <div key={property.id} className="property-item">
    <Link to={`/property/${property.id}`} className="property-thumb">{Array.isArray(property.images) && property.images[0] ? <img src={property.images[0]} alt={property.title} /> : <div className="no-image"><FiHome /></div>}</Link>
    <div className="property-info"><h4>{property.title}</h4><p><FiMapPin /> {property.city}, {property.state}</p>{editing === property.id ? <div className="agent-edit-row"><select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><input type="number" min="0" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} /><button onClick={() => save(property.id)}><FiSave /> Save</button></div> : <small>{property.status.replaceAll('_', ' ')} · ₹{Number(property.price || 0).toLocaleString('en-IN')} <button className="inline-edit" onClick={() => startEdit(property)} aria-label={`Edit ${property.title}`}><FiEdit3 /></button></small>}</div>
  </div>)}</div>}</div>;
}
