import { useEffect, useState } from 'react';
import apiRequest from '../../lib/apiRequest';

const statuses = ['CONTACTED', 'TOKEN_PAID', 'BOOKING_CONFIRMED', 'CANCELLED', 'SITE_VISIT_SCHEDULED', 'NEGOTIATION'];

export default function AgentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

  const load = async () => {
    try { setLoading(true); const res = await apiRequest.get('/agent/bookings'); setBookings(res.data?.bookings || []); setError(''); }
    catch { setError("We couldn't load your bookings. Please try again."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try { setSaving(id); await apiRequest.patch(`/agent/bookings/${id}`, { status }); await load(); }
    catch { setError("We couldn't update the booking. Please try again."); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="agent-dashboard"><p>Loading bookings…</p></div>;
  return <div className="agent-dashboard"><div className="dashboard-header"><div><h1>Bookings</h1><p>Customer bookings for your properties.</p></div></div>{error && <div className="content-card"><p>{error}</p></div>}{bookings.length === 0 ? <div className="content-card"><p>No bookings found.</p></div> : <div className="content-card"><div className="booking-list">{bookings.map((booking) => <div key={booking.id} className="booking-row"><div><h4>{booking.property?.title || 'Property'}</h4><p>{booking.user?.username || 'Customer'} · {booking.user?.email || booking.user?.phone || ''}</p><small>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}</small></div><select value={booking.bookingStatus} disabled={saving === booking.id} onChange={(e) => updateStatus(booking.id, e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div>)}</div></div>}</div>;
}
