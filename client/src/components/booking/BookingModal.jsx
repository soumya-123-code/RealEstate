import { useState } from 'react';
import { FiX, FiMessageCircle, FiCheck, FiLoader } from 'react-icons/fi';
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

  const images = Array.isArray(property.images) ? property.images : typeof property.images === 'string' ? (() => { try { return JSON.parse(property.images); } catch { return []; } })() : [];
  const firstImage = images?.[0] || '/placeholder.jpg';
  const fullImageUrl = firstImage?.startsWith('http') ? firstImage : `${window.location.origin}${firstImage}`;

  const handleContinueOnWhatsApp = async () => {
    if (!currentUser) { toast.error('Please login to book this property'); onClose?.(); return; }
    setLoading(true);
    try {
      const res = await apiRequest.post('/properties/token-bookings', { propertyId: property.id });
      const link = res.data?.whatsappLink;
      if (!link) throw new Error('WhatsApp booking link was not returned.');
      const b = res.data.booking || { id: res.data.bookingId, bookingStatus: 'CONTACTED' };
      setBooking(b);
      setWhatsappLink(link);
      window.open(link, '_blank', 'noopener,noreferrer');
      toast.success('WhatsApp opened with booking details');
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const statusLabels = { PENDING: 'Pending', CONTACTED: 'Contacted', TOKEN_RECEIVED: 'Token Received', CONFIRMED: 'Confirmed', REJECTED: 'Rejected', REFUNDED: 'Refunded' };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="booking-modal__close" onClick={onClose} aria-label="Close"><FiX size={20} /></button>
        {!booking ? <>
          <div className="booking-modal__header"><h2>Book This Property</h2><p>Start your enquiry on WhatsApp and keep the booking status in Suretreaven.</p></div>
          <div className="booking-modal__property">
            <img src={fullImageUrl} alt={property.title} className="booking-modal__property-img" />
            <div className="booking-modal__property-info"><h3>{property.title}</h3><p className="booking-modal__location">📍 {property.address}, {property.city}, {property.state}</p><div className="booking-modal__price-row"><div><span className="booking-modal__price-label">Price</span><span className="booking-modal__price">{formatPrice(property.price)}</span></div>{property.tokenAmount && <div><span className="booking-modal__price-label">Token Amount</span><span className="booking-modal__token">{formatPrice(property.tokenAmount)}</span></div>}</div></div>
          </div>
          <div className="booking-modal__steps"><div className="booking-modal__step"><span className="booking-modal__step-num">1</span><div><strong>Continue on WhatsApp</strong><p>Your property and contact details are prepared for the agent.</p></div></div><div className="booking-modal__step"><span className="booking-modal__step-num">2</span><div><strong>Continue the enquiry</strong><p>The booking request stays available in My Bookings.</p></div></div></div>
          <button className="booking-modal__cta" onClick={handleContinueOnWhatsApp} disabled={loading}>{loading ? <><FiLoader className="spin" /> Preparing WhatsApp…</> : <><FiMessageCircle /> Continue on WhatsApp</>}</button>
          <p className="booking-modal__note">You can track the request from <a href="/bookings">My Bookings</a>.</p>
        </> : <>
          <div className="booking-modal__success"><div className="booking-modal__success-icon"><FiCheck size={48} /></div><h2>Booking Request Created</h2><p>Your booking is <strong>{statusLabels[booking.bookingStatus || booking.status] || 'Contacted'}</strong>.</p><div className="booking-modal__booking-code"><span>Booking Code</span><strong>{`ST-${booking.id}`}</strong></div><div className="booking-modal__success-actions">{whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="booking-modal__cta booking-modal__cta--outline"><FiMessageCircle /> Reopen WhatsApp</a>}<a href="/bookings" className="booking-modal__cta booking-modal__cta--ghost">View My Bookings</a></div></div>
        </>}
      </div>
    </div>
  );
}

export default BookingModal;
