import { useState, useEffect } from 'react';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { formatPrice, formatDate } from '../../lib/utils';
import { FiPhone, FiMail, FiUser } from 'react-icons/fi';
import './AdminBookings.scss';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    bookingStatus: '',
    tokenAmount: '',
    adminNotes: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/admin/bookings');
      setBookings(res.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await apiRequest.patch(`/admin/bookings/${selectedBooking.id}`, {
        bookingStatus: statusForm.bookingStatus,
        tokenAmount: statusForm.tokenAmount ? parseFloat(statusForm.tokenAmount) : undefined,
        adminNotes: statusForm.adminNotes
      });
      
      toast.success('Booking status updated successfully');
      setShowModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update booking status');
    }
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setStatusForm({
      bookingStatus: booking.bookingStatus,
      tokenAmount: booking.tokenAmount || '',
      adminNotes: booking.adminNotes || ''
    });
    setShowModal(true);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'ALL') return true;
    return booking.bookingStatus === filter;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-bookings">
      <div className="filters">
        <button 
          className={filter === 'ALL' ? 'active' : ''} 
          onClick={() => setFilter('ALL')}
        >
          All ({bookings.length})
        </button>
        <button 
          className={filter === 'CONTACTED' ? 'active' : ''} 
          onClick={() => setFilter('CONTACTED')}
        >
          Contacted ({bookings.filter(b => b.bookingStatus === 'CONTACTED').length})
        </button>
        <button 
          className={filter === 'TOKEN_PAID' ? 'active' : ''} 
          onClick={() => setFilter('TOKEN_PAID')}
        >
          Token Paid ({bookings.filter(b => b.bookingStatus === 'TOKEN_PAID').length})
        </button>
        <button 
          className={filter === 'BOOKING_CONFIRMED' ? 'active' : ''} 
          onClick={() => setFilter('BOOKING_CONFIRMED')}
        >
          Confirmed ({bookings.filter(b => b.bookingStatus === 'BOOKING_CONFIRMED').length})
        </button>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>User Details</th>
              <th>Status</th>
              <th>Token Amount</th>
              <th>Booking Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No bookings found</td>
              </tr>
            ) : (
              filteredBookings.map((booking) => {
                const images = typeof booking.property?.images === 'string' 
                  ? JSON.parse(booking.property.images) 
                  : booking.property?.images;
                const firstImage = images?.[0] || 'https://via.placeholder.com/100';

                return (
                  <tr key={booking.id}>
                    <td>#{booking.id}</td>
                    <td>
                      <div className="property-info">
                        <img 
                          src={firstImage.startsWith('http') ? firstImage : `${window.location.origin}${firstImage}`}
                          alt={booking.property?.title}
                        />
                        <div>
                          <strong>{booking.property?.title}</strong>
                          <small>{booking.property?.city}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="info-row">
                          <FiUser />
                          <span>{booking.user?.username}</span>
                        </div>
                        <div className="info-row">
                          <FiMail />
                          <span>{booking.user?.email}</span>
                        </div>
                        <div className="info-row">
                          <FiPhone />
                          <span>{booking.user?.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${booking.bookingStatus.toLowerCase()}`}>
                        {booking.bookingStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {booking.tokenAmount ? formatPrice(booking.tokenAmount) : '-'}
                    </td>
                    <td>{formatDate(booking.createdAt)}</td>
                    <td>
                      <button 
                        className="btn-update"
                        onClick={() => openStatusModal(booking)}
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Booking Status</h2>
            
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label>Booking Status</label>
                <select
                  value={statusForm.bookingStatus}
                  onChange={(e) => setStatusForm({...statusForm, bookingStatus: e.target.value})}
                  required
                >
                  <option value="CONTACTED">Contacted</option>
                  <option value="TOKEN_PAID">Token Paid</option>
                  <option value="BOOKING_CONFIRMED">Booking Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {(statusForm.bookingStatus === 'TOKEN_PAID' || statusForm.bookingStatus === 'BOOKING_CONFIRMED') && (
                <div className="form-group">
                  <label>Token Amount</label>
                  <input
                    type="number"
                    value={statusForm.tokenAmount}
                    onChange={(e) => setStatusForm({...statusForm, tokenAmount: e.target.value})}
                    placeholder="Enter token amount"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  value={statusForm.adminNotes}
                  onChange={(e) => setStatusForm({...statusForm, adminNotes: e.target.value})}
                  placeholder="Add any notes..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
