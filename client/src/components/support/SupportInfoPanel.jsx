/**
 * SupportInfoPanel.jsx
 *
 * Right pane of the support dashboard.
 *
 * Sections:
 *   1. Customer Info (avatar, name, mobile, email, location, last seen)
 *   2. Property Info (name, ID, price, type, image)
 *   3. Lead Info (status, source, assigned staff) — if linked
 *   4. Actions (Assign Staff, Update Lead, Schedule Callback, Mark Resolved)
 *   5. Notes (list + add form)
 *   6. Callbacks (upcoming list)
 *   7. Assignment History (admin only)
 */

import { useState, useEffect } from 'react';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import apiRequest from '../../lib/apiRequest';
import { format, formatDistanceToNow } from 'timeago.js';
import {
  FiUser, FiPhone, FiMail, FiMapPin, FiHome, FiTag, FiTarget,
  FiUserPlus, FiClock, FiCheckCircle, FiCalendar, FiChevronDown,
  FiChevronUp, FiPin, FiEdit2, FiTrash2, FiPlus,
} from 'react-icons/fi';
import './SupportInfoPanel.scss';

function SupportInfoPanel() {
  const {
    activeConversation,
    updateStatus,
    assignStaff,
    addNote,
    deleteNote,
    scheduleCallback,
    updateCallback,
  } = useSupport();
  const { currentUser } = useAuth();
  const { isUserOnline } = useSocket();

  const [staffList, setStaffList] = useState([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [showNotesAdd, setShowNotesAdd] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notePinned, setNotePinned] = useState(false);
  const [callbackForm, setCallbackForm] = useState({
    scheduledAt: '',
    note: '',
    assignedToId: '',
  });

  const isAdmin = currentUser?.role === 'ADMIN';
  const customer = activeConversation?.customer;
  const property = activeConversation?.property;
  const lead = activeConversation?.lead;
  const customerOnline = customer ? isUserOnline(customer.id) : false;

  // Fetch staff list for assignment
  useEffect(() => {
    if (!activeConversation) return;
    const fetchStaff = async () => {
      try {
        const [adminRes, staffRes] = await Promise.all([
          apiRequest.get('/users/staff/by-role', { params: { role: 'ADMIN' } }),
          apiRequest.get('/users/staff/by-role', { params: { role: 'STAFF' } }),
        ]);
        setStaffList([...(adminRes.data || []), ...(staffRes.data || [])]);
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };
    fetchStaff();
  }, [activeConversation?.id]);

  if (!activeConversation) {
    return (
      <div className="support-info-panel support-info-panel--empty">
        <FiUser size={48} />
        <p>Select a conversation to view customer details</p>
      </div>
    );
  }

  const avatarUrl = customer?.avatar
    ? customer.avatar.startsWith('http')
      ? customer.avatar
      : `${window.location.origin}${customer.avatar}`
    : null;

  const propertyImage = (() => {
    if (!property?.images) return null;
    const imgs = Array.isArray(property.images) ? property.images : (() => { try { return JSON.parse(property.images); } catch { return []; } })();
    const first = imgs[0];
    if (!first) return null;
    return first.startsWith('http') ? first : `${window.location.origin}${first}`;
  })();

  const handleAssign = async (staffId) => {
    await assignStaff(activeConversation.id, staffId);
    setShowAssignMenu(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote(activeConversation.id, noteText.trim(), notePinned);
    setNoteText('');
    setNotePinned(false);
    setShowNotesAdd(false);
  };

  const handleScheduleCallback = async () => {
    if (!callbackForm.scheduledAt) return;
    await scheduleCallback(activeConversation.id, {
      scheduledAt: new Date(callbackForm.scheduledAt).toISOString(),
      note: callbackForm.note,
      assignedToId: callbackForm.assignedToId || activeConversation.assignedToId || undefined,
    });
    setCallbackForm({ scheduledAt: '', note: '', assignedToId: '' });
    setShowCallbackForm(false);
  };

  return (
    <div className="support-info-panel">
      {/* Customer Info */}
      <section className="support-info-panel__section">
        <h3>Customer Information</h3>
        <div className="support-info-panel__customer">
          <div className="support-info-panel__avatar-wrap">
            <div className="support-info-panel__avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={customer?.username} />
              ) : (
                <span>{customer?.username?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            {customerOnline && <span className="support-info-panel__online" />}
          </div>
          <div>
            <strong>{customer?.username}</strong>
            <small>
              {customerOnline ? '🟢 Online now' : customer?.lastSeenAt ? `Last seen ${formatDistanceToNow(new Date(customer.lastSeenAt))}` : 'Offline'}
            </small>
          </div>
        </div>

        <div className="support-info-panel__field">
          <FiPhone size={14} />
          <span>{customer?.phone || '—'}</span>
        </div>
        <div className="support-info-panel__field">
          <FiMail size={14} />
          <span>{customer?.email || '—'}</span>
        </div>
        <div className="support-info-panel__field">
          <FiUser size={14} />
          <span>Role: {customer?.role?.toLowerCase()}</span>
        </div>
      </section>

      {/* Property Info */}
      {property && (
        <section className="support-info-panel__section">
          <h3>Property Information</h3>
          {propertyImage && (
            <img src={propertyImage} alt={property.title} className="support-info-panel__property-img" />
          )}
          <div className="support-info-panel__field">
            <FiHome size={14} />
            <strong>{property.title}</strong>
          </div>
          <div className="support-info-panel__field">
            <FiTag size={14} />
            <span>ID: #{property.id}</span>
          </div>
          <div className="support-info-panel__field">
            <span style={{ marginLeft: 18 }}>
              ₹{Number(property.price).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="support-info-panel__field">
            <FiMapPin size={14} />
            <span>{property.address}, {property.city}, {property.state}</span>
          </div>
        </section>
      )}

      {/* Lead Info */}
      {lead && (
        <section className="support-info-panel__section">
          <h3>Lead Information</h3>
          <div className="support-info-panel__field">
            <FiTarget size={14} />
            <span>Status: <strong>{lead.status}</strong></span>
          </div>
          <div className="support-info-panel__field">
            <span style={{ marginLeft: 18 }}>Source: {lead.source}</span>
          </div>
          {lead.assignedToId && (
            <div className="support-info-panel__field">
              <FiUser size={14} />
              <span>Assigned: Staff #{lead.assignedToId}</span>
            </div>
          )}
        </section>
      )}

      {/* Actions */}
      <section className="support-info-panel__section">
        <h3>Actions</h3>

        {/* Assign Staff */}
        <div className="support-info-panel__action">
          <button
            onClick={() => setShowAssignMenu(!showAssignMenu)}
            className="support-info-panel__action-btn"
          >
            <FiUserPlus size={14} /> {activeConversation.assignedTo ? `Assigned: ${activeConversation.assignedTo.username}` : 'Assign Staff'}
            {showAssignMenu ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
          </button>
          {showAssignMenu && (
            <div className="support-info-panel__dropdown">
              {staffList.map((s) => (
                <button key={s.id} onClick={() => handleAssign(s.id)}>
                  {s.username} <small>({s.role.toLowerCase()})</small>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Callback */}
        <button
          onClick={() => setShowCallbackForm(!showCallbackForm)}
          className="support-info-panel__action-btn"
        >
          <FiCalendar size={14} /> Schedule Callback
        </button>
        {showCallbackForm && (
          <div className="support-info-panel__form">
            <input
              type="datetime-local"
              value={callbackForm.scheduledAt}
              onChange={(e) => setCallbackForm({ ...callbackForm, scheduledAt: e.target.value })}
            />
            <textarea
              placeholder="Callback note (optional)"
              value={callbackForm.note}
              onChange={(e) => setCallbackForm({ ...callbackForm, note: e.target.value })}
              rows={2}
            />
            <button onClick={handleScheduleCallback} className="support-info-panel__form-submit">
              Schedule
            </button>
          </div>
        )}

        {/* Mark Resolved / Reopen */}
        {activeConversation.status !== 'RESOLVED' && activeConversation.status !== 'ARCHIVED' && (
          <button
            onClick={() => updateStatus(activeConversation.id, 'RESOLVED')}
            className="support-info-panel__action-btn support-info-panel__action-btn--success"
          >
            <FiCheckCircle size={14} /> Mark Resolved
          </button>
        )}
        {activeConversation.status === 'RESOLVED' && (
          <button
            onClick={() => updateStatus(activeConversation.id, 'ACTIVE')}
            className="support-info-panel__action-btn"
          >
            ↻ Reopen
          </button>
        )}
        {activeConversation.status !== 'ARCHIVED' && isAdmin && (
          <button
            onClick={() => updateStatus(activeConversation.id, 'ARCHIVED')}
            className="support-info-panel__action-btn"
          >
            📦 Archive
          </button>
        )}
      </section>

      {/* Notes */}
      <section className="support-info-panel__section">
        <div className="support-info-panel__section-head">
          <h3>Notes ({activeConversation.notes?.length || 0})</h3>
          <button onClick={() => setShowNotesAdd(!showNotesAdd)} className="support-info-panel__add-btn">
            <FiPlus size={12} /> Add
          </button>
        </div>

        {showNotesAdd && (
          <div className="support-info-panel__form">
            <textarea
              placeholder="Add internal note (not visible to customer)..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <label>
              <input
                type="checkbox"
                checked={notePinned}
                onChange={(e) => setNotePinned(e.target.checked)}
              />
              <FiPin size={12} /> Pin to top
            </label>
            <button onClick={handleAddNote} className="support-info-panel__form-submit">
              Save Note
            </button>
          </div>
        )}

        <div className="support-info-panel__notes">
          {activeConversation.notes?.length === 0 ? (
            <p className="support-info-panel__empty-state">No notes yet</p>
          ) : (
            activeConversation.notes?.map((note) => (
              <div key={note.id} className={`support-info-panel__note ${note.pinned ? 'pinned' : ''}`}>
                {note.pinned && <FiPin size={10} className="support-info-panel__pin" />}
                <p>{note.body}</p>
                <small>
                  {note.author?.username} • {format(note.createdAt)}
                  {note.editedAt && ' (edited)'}
                </small>
                {(note.authorId === currentUser?.id || isAdmin) && (
                  <button
                    onClick={() => deleteNote(activeConversation.id, note.id)}
                    className="support-info-panel__note-delete"
                  >
                    <FiTrash2 size={11} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Callbacks */}
      <section className="support-info-panel__section">
        <h3>Callbacks ({activeConversation.callbacks?.length || 0})</h3>
        <div className="support-info-panel__callbacks">
          {activeConversation.callbacks?.length === 0 ? (
            <p className="support-info-panel__empty-state">No callbacks scheduled</p>
          ) : (
            activeConversation.callbacks?.map((cb) => (
              <div key={cb.id} className={`support-info-panel__callback cb-${cb.status.toLowerCase()}`}>
                <FiClock size={12} />
                <div>
                  <strong>{format(new Date(cb.scheduledAt))}</strong>
                  {cb.assignedTo && <small>→ {cb.assignedTo.username}</small>}
                  {cb.note && <p>{cb.note}</p>}
                  <span className={`support-info-panel__cb-status cb-status-${cb.status.toLowerCase()}`}>
                    {cb.status}
                  </span>
                </div>
                {cb.status === 'SCHEDULED' && (
                  <div className="support-info-panel__cb-actions">
                    <button onClick={() => updateCallback(activeConversation.id, cb.id, 'COMPLETED')} title="Mark done">
                      ✓
                    </button>
                    <button onClick={() => updateCallback(activeConversation.id, cb.id, 'CANCELLED')} title="Cancel">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default SupportInfoPanel;
