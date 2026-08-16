import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import { formatPrice, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import './ProfilePage.scss';

function ProfilePage() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await apiRequest.get('/properties/my-bookings');
        setBookings(res.data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="user-info">
            <div className="avatar">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.username} />
              ) : (
                <div className="avatar-placeholder">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1>{currentUser.username}</h1>
              <p>{currentUser.email}</p>
              {currentUser.phone && <p>📞 {currentUser.phone}</p>}
            </div>
          </div>
        </div>

        <div className="profile-content">
          <h2>My Bookings</h2>
          
          {loading ? (
            <div>Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <h3>No Bookings Yet</h3>
              <p>Browse properties and make your first booking!</p>
              <a href="/list" className="btn btn-primary">Browse Properties</a>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-property">
                    <img src={JSON.parse(booking.property.images)[0]} alt={booking.property.title} />
                    <div>
                      <h3>{booking.property.title}</h3>
                      <p>{booking.property.city}</p>
                      <p className="price">{formatPrice(booking.property.price)}</p>
                    </div>
                  </div>
                  <div className="booking-details">
                    <span className={`badge badge-${booking.bookingStatus.toLowerCase()}`}>
                      {booking.bookingStatus.replace(/_/g, ' ')}
                    </span>
                    <p>Booked on: {formatDate(booking.createdAt)}</p>
                    {booking.tokenAmount && <p>Token: {formatPrice(booking.tokenAmount)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
