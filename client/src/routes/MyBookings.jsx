/**
 * MyBookings.jsx
 *
 * User-facing booking history page at /bookings.
 * Shows all of the current user's TokenBookings with live status updates.
 *
 * Features:
 *   - Status filter (All / Pending / Token Received / Confirmed / Rejected / Refunded)
 *   - Property card with image, title, price, token amount
 *   - Booking code + status badge
 *   - "View Details" expands to show: timeline, admin notes, refund details (if any)
 *   - "Reopen WhatsApp" button to re-send the WhatsApp message
 *   - Real-time status updates via socket (tokenBookingStatusUpdate event)
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import apiRequest from '../lib/apiRequest';
import { formatPrice, formatDate } from '../lib/utils';
import { PLACEHOLDER_PROPERTY } from '../lib/brand-images';
import { FiChevronDown, FiChevronUp, FiMessageCircle, FiLoader, FiBox } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './MyBookings.scss';

const STATUS_CONFIG = {
  CONTACTED: { label: 'Contacted', className: 'status-pending', icon: '💬' },
  NEGOTIATION: { label: 'Negotiation', className: 'status-token', icon: '🤝' },
  SITE_VISIT_SCHEDULED: { label: 'Site Visit Scheduled', className: 'status-token', icon: '📅' },
  TOKEN_PAID: { label: 'Token Paid', className: 'status-confirmed', icon: '💰' },
  BOOKING_CONFIRMED: { label: 'Confirmed', className: 'status-confirmed', icon: '✅' },
  CANCELLED: { label: 'Cancelled', className: 'status-rejected', icon: '❌' },
};

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState({});
  const { socket } = useSocket();

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/properties/token-bookings/my');
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Listen for real-time status updates
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === data.bookingId ? { ...b, bookingStatus: data.status } : b
        )
      );
      if (data.status === 'BOOKING_CONFIRMED') {
        toast.success(`Booking ${`ST-${data.bookingId}`} confirmed! 🎉`);
      } else {
        toast(`Booking ${`ST-${data.bookingId}`} → ${STATUS_CONFIG[data.status]?.label || data.status}`, {
          icon: STATUS_CONFIG[data.status]?.icon || 'ℹ️',
        });
      }
    };
    socket.on('tokenBookingStatusUpdate', handler);
    return () => socket.off('tokenBookingStatusUpdate', handler);
  }, [socket]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredBookings =
    filter === 'ALL' ? bookings : bookings.filter((b) => b.bookingStatus === filter);

  const counts = bookings.reduce((acc, b) => {
    acc[b.bookingStatus] = (acc[b.bookingStatus] || 0) + 1;
    return acc;
  }, {});

  const fullImageUrl = (img) => {
    if (!img) return PLACEHOLDER_PROPERTY;
    if (img.startsWith('http')) return img;
    return `${window.location.origin}${img}`;
  };

  const parseImages = (images) => {
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try { return JSON.parse(images); } catch { return []; }
    }
    return [];
  };

  return (
    <div className="my-bookings-page">
      <div className="container">
        <div className="my-bookings-header">
          <h1>My Bookings</h1>
          <p>Track the status of all your property token bookings</p>
        </div>

        <div className="my-bookings-filters">
          <button
            className={filter === 'ALL' ? 'active' : ''}
            onClick={() => setFilter('ALL')}
          >
            All ({bookings.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={filter === key ? 'active' : ''}
              onClick={() => setFilter(key)}
            >
              {cfg.label} ({counts[key] || 0})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="my-bookings-loading">
            <FiLoader className="spin" size={32} />
            <p>Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="my-bookings-empty">
            <FiBox size={48} />
            <h3>No bookings yet</h3>
            <p>Browse our properties and book your favorite one via WhatsApp.</p>
            <Link to="/list" className="btn-browse">Browse Properties</Link>
          </div>
        ) : (
          <div className="my-bookings-list">
            {filteredBookings.map((booking) => {
              const images = parseImages(booking.property?.images);
              const cfg = STATUS_CONFIG[booking.bookingStatus] || STATUS_CONFIG.CONTACTED;
              const isExpanded = !!expanded[booking.id];

              return (
                <div key={booking.id} className={`booking-card ${cfg.className}`}>
                  <div className="booking-card__main">
                    <Link to={`/property/${booking.property?.id}`} className="booking-card__img-wrap">
                      <img src={fullImageUrl(images[0])} alt={booking.property?.title} />
                    </Link>
                    <div className="booking-card__info">
                      <div className="booking-card__top">
                        <h3>{booking.property?.title}</h3>
                        <span className={`booking-card__status ${cfg.className}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="booking-card__location">
                        📍 {booking.property?.address}, {booking.property?.city}, {booking.property?.state}
                      </p>
                      <div className="booking-card__meta">
                        <div>
                          <span>Booking Code</span>
                          <strong>{`ST-${booking.id}`}</strong>
                        </div>
                        <div>
                          <span>Price</span>
                          <strong>{formatPrice(booking.property?.price)}</strong>
                        </div>
                        <div>
                          <span>Token Amount</span>
                          <strong>{formatPrice(booking.tokenAmount || booking.property?.tokenAmount)}</strong>
                        </div>
                        <div>
                          <span>Booked On</span>
                          <strong>{formatDate(booking.createdAt)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="booking-card__actions">
                    {booking.whatsappLink && (
                      <a
                        href={booking.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp"
                      >
                        <FiMessageCircle /> Reopen WhatsApp
                      </a>
                    )}
                    <button
                      className="btn-details"
                      onClick={() => toggleExpand(booking.id)}
                    >
                      {isExpanded ? <><FiChevronUp /> Hide Details</> : <><FiChevronDown /> View Details</>}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="booking-card__details">
                      <h4>Booking Timeline</h4>
                      <ul className="booking-timeline">
                        <li className={booking.createdAt ? 'active' : ''}>
                          <span className="dot" />
                          <div>
                            <strong>Booking Created</strong>
                            <em>{formatDate(booking.createdAt)}</em>
                          </div>
                        </li>
                        {booking.tokenReceivedAt && (
                          <li className="active">
                            <span className="dot" />
                            <div>
                              <strong>Token Received</strong>
                              <em>{formatDate(booking.tokenReceivedAt)}</em>
                            </div>
                          </li>
                        )}
                        {booking.confirmedAt && (
                          <li className="active">
                            <span className="dot" />
                            <div>
                              <strong>Booking Confirmed</strong>
                              <em>{formatDate(booking.confirmedAt)}</em>
                            </div>
                          </li>
                        )}
                        {booking.rejectedAt && (
                          <li className="rejected">
                            <span className="dot" />
                            <div>
                              <strong>Booking Rejected</strong>
                              <em>{formatDate(booking.rejectedAt)}</em>
                              {booking.rejectedReason && <p>Reason: {booking.rejectedReason}</p>}
                            </div>
                          </li>
                        )}
                        {booking.refundedAt && (
                          <li className="refunded">
                            <span className="dot" />
                            <div>
                              <strong>Refund Processed</strong>
                              <em>{formatDate(booking.refundedAt)}</em>
                              <p>Amount: {formatPrice(booking.refundAmount)} via {booking.refundMethod || 'N/A'}</p>
                              {booking.refundReference && <p>Reference: {booking.refundReference}</p>}
                            </div>
                          </li>
                        )}
                      </ul>

                      {booking.adminNotes && (
                        <div className="booking-admin-notes">
                          <strong>Admin Notes:</strong>
                          <p>{booking.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;
