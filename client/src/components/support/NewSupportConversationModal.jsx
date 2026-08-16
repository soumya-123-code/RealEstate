/**
 * NewSupportConversationModal.jsx
 *
 * Modal for admin to start a new support conversation.
 * Admin selects a customer (searches by name/phone/email) and optionally
 * links a property.
 */

import { useState, useEffect } from 'react';
import apiRequest from '../../lib/apiRequest';
import { useSupport } from '../../context/SupportContext';
import { FiX, FiSearch, FiUser, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './SupportConversationItem.scss';

function NewSupportConversationModal({ onClose }) {
  const { selectConversation } = useSupport();
  const [step, setStep] = useState('search'); // 'search' | 'property' | 'message'
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [properties, setProperties] = useState([]);
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [initialMessage, setInitialMessage] = useState('');

  const searchCustomers = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      // Use admin user list endpoint with search
      const res = await apiRequest.get('/users', {
        params: { search, role: 'USER' },
      });
      // Filter to USER role
      const userRoleUsers = (res.data || []).filter((u) => u.role === 'USER');
      setCustomers(userRoleUsers);
    } catch (err) {
      // Fallback: try search via chat preview endpoint
      try {
        const res = await apiRequest.get('/users');
        const allUsers = res.data || [];
        const filtered = allUsers.filter(
          (u) =>
            u.role === 'USER' &&
            (u.username?.toLowerCase().includes(search.toLowerCase()) ||
              u.email?.toLowerCase().includes(search.toLowerCase()) ||
              u.phone?.includes(search))
        );
        setCustomers(filtered);
      } catch (e) {
        toast.error('Failed to search users');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchProperties = async () => {
    if (!propertySearch.trim()) return;
    try {
      const res = await apiRequest.get('/properties', {
        params: { page: 1, limit: 10 },
      });
      const filtered = (res.data.properties || []).filter((p) =>
        p.title?.toLowerCase().includes(propertySearch.toLowerCase()) ||
        String(p.id) === propertySearch
      );
      setProperties(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await apiRequest.post('/support/conversations', {
        customerId: selectedCustomer.id,
        propertyId: selectedPropertyId,
        initialMessage: initialMessage.trim() || undefined,
      });
      toast.success('Conversation created');
      await selectConversation(res.data.id);
      onClose();
    } catch (err) {
      toast.error('Failed to create conversation');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500,
        maxHeight: '85vh', overflowY: 'auto', position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, background: 'transparent',
          border: 'none', cursor: 'pointer', fontSize: '1.3rem',
        }}><FiX /></button>

        <h2 style={{ marginTop: 0, marginBottom: 16 }}>New Support Conversation</h2>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, fontSize: '0.8rem' }}>
          <span style={{ color: step === 'search' ? '#7c6ef7' : '#94a3b8', fontWeight: step === 'search' ? 700 : 400 }}>
            1. Customer
          </span>
          <span style={{ color: '#cbd5e1' }}>→</span>
          <span style={{ color: step === 'property' ? '#7c6ef7' : '#94a3b8', fontWeight: step === 'property' ? 700 : 400 }}>
            2. Property (optional)
          </span>
          <span style={{ color: '#cbd5e1' }}>→</span>
          <span style={{ color: step === 'message' ? '#7c6ef7' : '#94a3b8', fontWeight: step === 'message' ? 700 : 400 }}>
            3. Message
          </span>
        </div>

        {step === 'search' && (
          <>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Search customer (by name, email, or phone):
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
                placeholder="Type name, email, or phone..."
                style={{
                  flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0',
                  borderRadius: 6, fontSize: '0.9rem', outline: 'none',
                }}
              />
              <button
                onClick={searchCustomers}
                style={{
                  padding: '8px 14px', background: '#7c6ef7', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                <FiSearch />
              </button>
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                  <FiLoader className="spin" />
                </div>
              ) : customers.length === 0 && search ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  No customers found
                </p>
              ) : (
                customers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedCustomer(u); setStep('property'); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: 10, background: 'transparent', border: '1px solid #f1f5f9',
                      borderRadius: 6, cursor: 'pointer', marginBottom: 4, textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#7c6ef7',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: '0.85rem',
                    }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {u.email} {u.phone && `• ${u.phone}`}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {step === 'property' && (
          <>
            <div style={{ marginBottom: 12, padding: 10, background: '#f1f5f9', borderRadius: 6 }}>
              <strong>Customer:</strong> {selectedCustomer?.username} ({selectedCustomer?.email})
              <button
                onClick={() => setStep('search')}
                style={{ marginLeft: 8, background: 'transparent', border: 'none', color: '#7c6ef7', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Change
              </button>
            </div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Link a property (optional):
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input
                type="text"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Property ID or title..."
                style={{
                  flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0',
                  borderRadius: 6, fontSize: '0.9rem',
                }}
              />
              <button
                onClick={searchProperties}
                style={{
                  padding: '8px 14px', background: '#7c6ef7', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                <FiSearch />
              </button>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPropertyId(p.id)}
                  style={{
                    width: '100%', padding: 10, background: selectedPropertyId === p.id ? '#ede9fe' : 'transparent',
                    border: '1px solid #f1f5f9', borderRadius: 6, cursor: 'pointer', marginBottom: 4, textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>#{p.id} — {p.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    ₹{Number(p.price).toLocaleString('en-IN')} • {p.city}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('message')}
              style={{
                padding: '8px 16px', background: '#7c6ef7', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
              }}
            >
              Continue →
            </button>
          </>
        )}

        {step === 'message' && (
          <>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Initial message (optional):
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Hi! How can I help you today?"
              rows={4}
              style={{
                width: '100%', padding: 10, border: '1px solid #e2e8f0',
                borderRadius: 6, fontSize: '0.9rem', resize: 'vertical', marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep('property')}
                style={{
                  padding: '8px 16px', background: 'transparent', color: '#64748b',
                  border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                style={{
                  flex: 1, padding: '8px 16px', background: '#16a34a', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                }}
              >
                Create Conversation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NewSupportConversationModal;
