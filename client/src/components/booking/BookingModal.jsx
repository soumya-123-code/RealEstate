/**
 * BookingModal.jsx
 *
 * Modal that opens when user clicks "Book Now" on a property.
 *
 * Flow:
 *   1. Shows property summary (image, title, price, token amount)
 *   2. User clicks "Continue on WhatsApp"
 *   3. Frontend POSTs /api/token-bookings { propertyId }
 *   4. Backend returns { booking, whatsappLink, whatsappMessage }
 *   5. Frontend opens whatsappLink in a new tab
 *   6. Modal shows success state with booking code + status (PENDING)
 *
 * The booking record is created with status PENDING so the admin can
 * update it later when the user actually sends the WhatsApp message
 * and the admin manually confirms the token payment.
 */

import { useState } from 'react';
import { FiX, FiMessageCircle, FiCheck, FiLoader, FiPhone } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';
import './BookingModal.scss';

function BookingModal({ property, onClose }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState(null);

  if (!property) return null;

  const images = Array.isArray(property.images)
    ? property.images
    : typeof property.images === 'string'
    ? (() => { try { return JSON.parse(property.images); } catch { return []; } })()
    : [];
  const firstImage = images?.[0] || '/placeholder.jpg';
  const fullImageUrl = firstImage?.startsWith('http')
    ? firstImage
    : `${window.location.origin}${firstImage}`;

  const handleContinueOnWhatsApp = async () => {
    if (!currentUser) {
      toast.error('Please login to book this property');
      onClose?.();
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest.post('/properties/token-bookings', {
        propertyId: property.id,
      });
      const b = res.data.booking || { id: res.data.bookingId, bookingStatus: 'CONTACTED' };
      const link = res.data.whatsappLink;
      setBooking(b);
      setWhatsappLink(link);

      // Open WhatsApp in a new tab with the prefilled message
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
        toast.success('WhatsApp opened with booking details');
      } else {
        toast.success('Booking created');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    PENDING: 'Pending',
    TOKEN_RECEIVED: 'Token Received',
    CONFIRMED: 'Confirmed',
    REJECTED: 'Rejected',
    REFUNDED: 'Refunded',
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="booking-modal__close" onClick={onClose} aria-label="Close">
          <FiX size={20} />
        </button>

        {!booking ? (
          <>
            {/* Step 1: Property summary + Continue on WhatsApp */}
            <div className="booking-modal__header">
              <h2>Book This Property</h2>
              <p>Complete your booking via WhatsApp in 2 simple steps</p>
            </div>

            <div className="booking-modal__property">
              <img src={fullImageUrl} alt={property.title} className="booking-modal__property-img" />
              <div className="booking-modal__property-info">
                <h3>{property.title}</h3>
                <p className="booking-modal__location">
                  📍 {property.address}, {property.city}, {property.state}
                </p>
                <div className="booking-modal__price-row">
                  <div>
                    <span className="booking-modal__price-label">Price</span>
                    <span className="booking-modal__price">{formatPrice(property.price)}</span>
                  </div>
                  {property.tokenAmount && (
                    <div>
                      <span className="booking-modal__price-label">Token Amount</span>
                      <span className="booking-modal__token">{formatPrice(property.tokenAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="booking-modal__steps">
              <div className="booking-modal__step">
                <span className="booking-modal__step-num">1</span>
                <div>
                  <strong>Click &ldquo;Continue on WhatsApp&rdquo;</strong>
                  <p>A WhatsApp chat with our admin will open with your property details pre-filled.</p>
                </div>
              </div>
              <div className="booking-modal__step">
                <span className="booking-modal__step-num">2</span>
                <div>
                  <strong>Send the message & pay the token</strong>
                  <p>Our admin will confirm the token payment and update your booking status.</p>
                </div>
              </div>
            </div>

            <button
              className="booking-modal__cta"
              onClick={handleContinueOnWhatsApp}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiLoader className="spin" /> Preparing WhatsApp...
                </>
              ) : (
                <>
                  <FiMessageCircle /> Continue on WhatsApp
                </>
              )}
            </button>

            <p className="booking-modal__note">
              💡 You can track your booking status on the <a href="/bookings">My Bookings</a> page after sending the WhatsApp message.
            </p>
          </>
        ) : (
          <>
            {/* Step 2: Success state */}
            <div className="booking-modal__success">
              <div className="booking-modal__success-icon">
                <FiCheck size={48} />
              </div>
              <h2>Booking Request Created!</h2>
              <p>Your booking is currently <strong>{statusLabels[booking.bookingStatus || booking.status] || 'Contacted'}</strong>.</p>

              <div className="booking-modal__booking-code">
                <span>Booking Code</span>
                <strong>{`ST-${booking.id}`}</strong>
              </div>

              <div className="booking-modal__next-steps">
                <h4>Next Steps:</h4>
                <ol>
                  <li>Send the WhatsApp message that just opened (with your booking details).</li>
                  <li>Our admin will confirm the token payment with you on WhatsApp.</li>
                  <li>Your booking status will be updated here and on the My Bookings page.</li>
                </ol>
              </div>

              <div className="booking-modal__success-actions">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="booking-modal__cta booking-modal__cta--outline"
                  >
                    <FiMessageCircle /> Reopen WhatsApp
                  </a>
                )}
                <a href="/bookings" className="booking-modal__cta booking-modal__cta--ghost">
                  View My Bookings
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BookingModal;
