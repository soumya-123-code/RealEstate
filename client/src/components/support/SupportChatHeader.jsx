/**
 * SupportChatHeader.jsx
 *
 * Top bar of the chat window — shows customer info + call buttons + actions menu.
 */

import { useState, useRef, useEffect } from 'react';
import { format } from 'timeago.js';
import {
  FiPhone, FiVideo, FiMoreVertical, FiArrowLeft, FiInfo,
  FiCheckCircle, FiArchive, FiRotateCcw, FiDownload,
} from 'react-icons/fi';
import apiRequest from '../../lib/apiRequest';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
import './SupportChatWindow.scss';

function SupportChatHeader({ conversation, onAudioCall, onVideoCall, onToggleInfo, customerOnline }) {
  const { updateStatus } = useSupport();
  const { currentUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isAdmin = currentUser?.role === 'ADMIN';

  const customer = conversation.customer;
  const avatarUrl = customer?.avatar
    ? customer.avatar.startsWith('http')
      ? customer.avatar
      : `${window.location.origin}${customer.avatar}`
    : null;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async () => {
    try {
      const res = await apiRequest.get(`/support/conversations/${conversation.id}/export?format=json`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversation.conversationCode}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const lastSeenText = () => {
    if (customerOnline) return 'Online';
    if (customer?.lastSeenAt) return `Last seen ${format(new Date(customer.lastSeenAt))}`;
    return 'Offline';
  };

  return (
    <div className="support-chat-header">
      <div className="support-chat-header__left">
        <div className="support-chat-header__avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={customer?.username} />
          ) : (
            <span>{customer?.username?.[0]?.toUpperCase() || '?'}</span>
          )}
          {customerOnline && <span className="support-chat-header__online-dot" />}
        </div>
        <div className="support-chat-header__info">
          <strong>{customer?.username}</strong>
          <small className={customerOnline ? 'online' : 'offline'}>
            {lastSeenText()}
          </small>
        </div>
      </div>

      <div className="support-chat-header__actions">
        <button
          onClick={onAudioCall}
          title="Audio call"
          className="support-chat-header__btn"
        >
          <FiPhone size={18} />
        </button>
        <button
          onClick={onVideoCall}
          title="Video call"
          className="support-chat-header__btn"
        >
          <FiVideo size={18} />
        </button>
        <button
          onClick={onToggleInfo}
          title="Customer info"
          className="support-chat-header__btn"
        >
          <FiInfo size={18} />
        </button>

        <div className="support-chat-header__menu-wrapper" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="support-chat-header__btn"
            title="More actions"
          >
            <FiMoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="support-chat-header__menu">
              {conversation.status !== 'RESOLVED' && (
                <button onClick={() => { updateStatus(conversation.id, 'RESOLVED'); setMenuOpen(false); }}>
                  <FiCheckCircle size={14} /> Mark Resolved
                </button>
              )}
              {conversation.status === 'RESOLVED' && (
                <button onClick={() => { updateStatus(conversation.id, 'ACTIVE'); setMenuOpen(false); }}>
                  <FiRotateCcw size={14} /> Reopen
                </button>
              )}
              {conversation.status !== 'ARCHIVED' && (
                <button onClick={() => { updateStatus(conversation.id, 'ARCHIVED'); setMenuOpen(false); }}>
                  <FiArchive size={14} /> Archive
                </button>
              )}
              {isAdmin && (
                <button onClick={handleExport}>
                  <FiDownload size={14} /> Export
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportChatHeader;
