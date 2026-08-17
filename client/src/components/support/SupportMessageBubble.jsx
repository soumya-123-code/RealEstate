/**
 * SupportMessageBubble.jsx
 *
 * A single message in the chat window.
 */

import { useState, useRef, useEffect } from 'react';
import { format } from 'timeago.js';
import {
  FiCornerUpLeft, FiForward, FiEdit2, FiTrash2, FiCopy, FiDownload,
  FiCheck, FiCheckCircle, FiMoreHorizontal, FiFile,
} from 'react-icons/fi';
import './SupportMessageBubble.scss';

function SupportMessageBubble({
  message,
  isOwn,
  conversationId,
  currentUserId,
  onReply,
  onMarkRead,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt;
  const isRead = (message.readReceipts || []).some((r) => r.userId !== currentUserId && r.userId !== message.senderId);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace('/api', '') || window.location.origin;
  const fullUrl = (u) => (u && u.startsWith('http') ? u : `${apiBase}${u}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setMenuOpen(false);
  };

  const handleDownload = (att) => {
    const a = document.createElement('a');
    a.href = fullUrl(att.url);
    a.download = att.fileName;
    a.target = '_blank';
    a.click();
  };

  const sender = message.sender;
  const avatarUrl = sender?.avatar
    ? sender.avatar.startsWith('http') ? sender.avatar : `${apiBase}${sender.avatar}`
    : null;

  return (
    <div className={`support-msg ${isOwn ? 'own' : 'other'} ${isDeleted ? 'deleted' : ''}`}>
      {!isOwn && (
        <div className="support-msg__avatar">
          {avatarUrl ? <img src={avatarUrl} alt={sender?.username} /> : <span>{sender?.username?.[0]?.toUpperCase() || '?'}</span>}
        </div>
      )}
      <div className="support-msg__col">
        {message.replyTo && (
          <div className="support-msg__reply-preview">
            <div className="support-msg__reply-bar" />
            <div><small>Replying to message</small><p>{message.replyTo.text || '[Attachment]'}</p></div>
          </div>
        )}
        <div className="support-msg__bubble-wrap">
          {!isOwn && <span className="support-msg__sender-name">{sender?.username}</span>}
          <div className={`support-msg__bubble ${isOwn ? 'own' : 'other'}`}>
            {isDeleted ? (
              <em className="support-msg__deleted-text">🗑️ This message was deleted</em>
            ) : (
              <>
                {message.text && <p className="support-msg__text">{message.text}</p>}
                {message.attachments?.map((att, idx) => {
                  if (att.type === 'IMAGE') return <a key={idx} href={fullUrl(att.url)} target="_blank" rel="noopener noreferrer" className="support-msg__image"><img src={fullUrl(att.url)} alt={att.fileName} /></a>;
                  if (att.type === 'AUDIO') return <div key={idx} className="support-msg__audio"><audio controls src={fullUrl(att.url)} style={{ width: '100%', maxWidth: 280 }} /><small>{att.fileName} • {(att.fileSize / 1024).toFixed(0)} KB</small></div>;
                  if (att.type === 'VIDEO') return <video key={idx} controls src={fullUrl(att.url)} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 4 }} />;
                  return <button key={idx} onClick={() => handleDownload(att)} className="support-msg__file"><FiFile size={20} /><div><strong>{att.fileName}</strong><small>{(att.fileSize / 1024).toFixed(0)} KB • {att.mimeType}</small></div><FiDownload size={14} /></button>;
                })}
                {message.forwardedFromId && <small className="support-msg__forwarded">↪ Forwarded</small>}
              </>
            )}
          </div>
          {!isDeleted && (
            <div className="support-msg__actions">
              <button onClick={() => onReply?.(message)} title="Reply"><FiCornerUpLeft size={12} /></button>
              <button onClick={handleCopy} title="Copy">{copied ? <FiCheck size={12} /> : <FiCopy size={12} />}</button>
              {isOwn && <button title="Edit" onClick={() => setMenuOpen(!menuOpen)}><FiEdit2 size={12} /></button>}
              <div className="support-msg__more-wrapper" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} title="More"><FiMoreHorizontal size={12} /></button>
                {menuOpen && <div className="support-msg__menu">
                  <button onClick={() => { onReply?.(message); setMenuOpen(false); }}><FiCornerUpLeft size={12} /> Reply</button>
                  <button onClick={() => setMenuOpen(false)}><FiForward size={12} /> Forward</button>
                  {message.attachments?.map((att, i) => <button key={i} onClick={() => handleDownload(att)}><FiDownload size={12} /> Download {att.fileName.slice(0, 20)}</button>)}
                  {isOwn && message.text && <button onClick={() => setMenuOpen(false)}><FiEdit2 size={12} /> Edit</button>}
                  <button onClick={() => setMenuOpen(false)} className="danger"><FiTrash2 size={12} /> Delete</button>
                </div>}
              </div>
            </div>
          )}
        </div>
        <div className="support-msg__meta">
          <small>{format(message.createdAt)}</small>
          {isEdited && <small className="support-msg__edited">edited</small>}
          {isOwn && !isDeleted && <span className="support-msg__read-tick">{isRead ? <FiCheckCircle size={12} /> : <FiCheck size={12} />}</span>}
        </div>
      </div>
    </div>
  );
}

export default SupportMessageBubble;
