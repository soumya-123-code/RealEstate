import { useEffect, useState } from 'react';
import { FiCheckCircle, FiChevronDown, FiChevronUp, FiMail, FiMapPin, FiPhone, FiPlus, FiTag, FiUser, FiUserPlus } from 'react-icons/fi';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import apiRequest from '../../lib/apiRequest';
import './SupportInfoPanel.scss';

function SupportInfoPanel() {
  const { activeConversation, assignStaff, updateStatus, addNote, deleteNote } = useSupport();
  const { currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const [staffList, setStaffList] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!activeConversation) return;
    apiRequest.get('/support/conversations/staff').then((res) => setStaffList(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, [activeConversation?.id]);

  if (!activeConversation) return <div className="support-info-panel support-info-panel--empty"><FiUser size={42}/><p>Select a conversation to view details</p></div>;

  const customer = activeConversation.customer || { id: activeConversation.customerId, username: activeConversation.customerName, email: activeConversation.customerEmail, phone: activeConversation.customerPhone, avatar: activeConversation.customerAvatar };
  const property = activeConversation.property;
  const status = String(activeConversation.status || 'OPEN').toUpperCase();

  const saveNote = async () => {
    if (!note.trim()) return;
    await addNote(activeConversation.id, note.trim(), pinned);
    setNote(''); setPinned(false); setNoteOpen(false);
  };

  return <div className="support-info-panel">
    <section className="support-info-panel__section">
      <h3>Customer</h3>
      <div className="support-info-panel__customer">
        <div className="support-info-panel__avatar">{customer.avatar ? <img src={customer.avatar} alt=""/> : <span>{customer.username?.[0]?.toUpperCase() || '?'}</span>}</div>
        <div><strong>{customer.username || 'Customer'}</strong><small>{isUserOnline(customer.id) ? 'Online now' : 'Offline'}</small></div>
      </div>
      <div className="support-info-panel__field"><FiPhone/><span>{customer.phone || '—'}</span></div>
      <div className="support-info-panel__field"><FiMail/><span>{customer.email || '—'}</span></div>
    </section>

    {property && <section className="support-info-panel__section"><h3>Property</h3><div className="support-info-panel__field"><FiTag/><strong>{property.title}</strong></div><div className="support-info-panel__field"><FiMapPin/><span>{[property.city, property.state].filter(Boolean).join(', ') || '—'}</span></div></section>}

    <section className="support-info-panel__section">
      <h3>Conversation</h3>
      <div className="support-info-panel__field"><span>Status</span><strong>{status.toLowerCase()}</strong></div>
      <div className="support-info-panel__field"><span>Assigned</span><strong>{activeConversation.assignedTo?.username || 'Unassigned'}</strong></div>
      <div className="support-info-panel__action">
        <button className="support-info-panel__action-btn" onClick={() => setAssignOpen((v) => !v)}><FiUserPlus/> Assign staff {assignOpen ? <FiChevronUp/> : <FiChevronDown/>}</button>
        {assignOpen && <div className="support-info-panel__dropdown">{staffList.map((s) => <button key={s.id} onClick={() => { assignStaff(activeConversation.id, s.id); setAssignOpen(false); }}>{s.username} <small>{s.role}</small></button>)}</div>}
      </div>
      <div className="support-info-panel__status-actions">
        {['OPEN','PENDING','RESOLVED','CLOSED'].map((next) => <button key={next} className={status === next ? 'active' : ''} onClick={() => updateStatus(activeConversation.id, next)}>{next.toLowerCase()}</button>)}
      </div>
      {status === 'CLOSED' && <button className="support-info-panel__action-btn support-info-panel__action-btn--success" onClick={() => updateStatus(activeConversation.id, 'OPEN')}><FiCheckCircle/> Reopen</button>}
    </section>

    <section className="support-info-panel__section">
      <div className="support-info-panel__section-head"><h3>Internal notes</h3><button onClick={() => setNoteOpen((v) => !v)}><FiPlus/> Add</button></div>
      {noteOpen && <div className="support-info-panel__form"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only staff can see this note…" rows={3}/><label><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)}/> Pin note</label><button onClick={saveNote}>Save note</button></div>}
      <div className="support-info-panel__notes">{activeConversation.notes?.length ? activeConversation.notes.map((n) => <div className={`support-info-panel__note ${n.pinned ? 'pinned' : ''}`} key={n.id}><p>{n.body}</p><small>{n.author?.username || 'Staff'}</small>{(Number(n.authorId) === Number(currentUser?.id) || currentUser?.role === 'ADMIN') && <button onClick={() => deleteNote(activeConversation.id, n.id)}>Delete</button>}</div>) : <p className="support-info-panel__empty-state">No internal notes</p>}</div>
    </section>
  </div>;
}
export default SupportInfoPanel;
