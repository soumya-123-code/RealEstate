import { useEffect, useState } from 'react';
import apiRequest from '../../lib/apiRequest';

export default function AgentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest.get('/agent/bookings')
      .then((res) => active && setBookings(res.data?.bookings || []))
      .catch(() => active && setError("We couldn't load your bookings. Please try again."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <div className="agent-dashboard"><p>Loading bookings…</p></div>;
  if (error) return <div className="agent-dashboard"><p>{error}</p></div>;

  return (
    <div className="agent-dashboard">
      <div className="dashboard-header"><div><h1>Bookings</h1><p>Customer bookings for your properties.</p></div></div>
      {bookings.length === 0 ? (
        <div className="content-card"><p>No bookings found.</p></div>
      ) : (
        <div className="content-card">
          {bookings.map((booking) => (
            <div key={booking.id} className="property-item">
              <div className="property-info">
                <h4>{booking.property?.title || 'Property'}</h4>
                <p>{booking.user?.username || 'Customer'} · {booking.user?.email || ''}</p>
                <small>{String(booking.bookingStatus || '').replaceAll('_', ' ')}</small>
              </div>
              <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
