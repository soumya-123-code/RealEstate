/**
 * SupportConversationItem.jsx
 *
 * A single row in the sidebar conversation list.
 */

import { useSocket } from '../../context/SocketContext';
import { format } from 'timeago.js';
import './SupportConversationItem.scss';

const STATUS_COLORS = {
  ACTIVE: '#16a34a',
  PENDING: '#f59e0b',
  RESOLVED: '#64748b',
  ARCHIVED: '#94a3b8',
};

const MESSAGE_TYPE_ICON = {
  image: '📷',
  pdf: '📄',
  audio: '🎵',
  video: '📹',
  file: '📎',
  text: '',
};

function SupportConversationItem({ conversation, isActive, onClick }) {
  const { isUserOnline } = useSocket();

  const customer = conversation.customer;
  const property = conversation.property;
  const isOnline = isUserOnline(customer?.id);
  const hasUnread = (conversation.staffUnreadCount || 0) > 0;

  const avatarUrl = customer?.avatar
    ? customer.avatar.startsWith('http')
      ? customer.avatar
      : `${window.location.origin}${customer.avatar}`
    : null;

  const lastMsgPreview = conversation.lastMessageText
    ? (MESSAGE_TYPE_ICON[conversation.lastMessageType] || '') + ' ' + conversation.lastMessageText
    : 'No messages yet';

  const statusColor = STATUS_COLORS[conversation.status] || STATUS_COLORS.ACTIVE;

  return (
    <button
      className={`support-conv-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}`}
      onClick={onClick}
      style={{ borderLeft: `3px solid ${statusColor}` }}
    >
      <div className="support-conv-item__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={customer?.username} />
        ) : (
          <span>{customer?.username?.[0]?.toUpperCase() || '?'}</span>
        )}
        {isOnline && <span className="support-conv-item__online-dot" />}
      </div>

      <div className="support-conv-item__body">
        <div className="support-conv-item__top">
          <strong>{customer?.username || 'Unknown'}</strong>
          <small>
            {conversation.lastMessageAt ? format(conversation.lastMessageAt) : ''}
          </small>
        </div>

        <div className="support-conv-item__subtitle">
          {property ? (
            <span className="support-conv-item__property">
              🏠 {property.title?.length > 30 ? property.title.slice(0, 30) + '…' : property.title}
            </span>
          ) : (
            <span className="support-conv-item__property support-conv-item__property--none">
              No property linked
            </span>
          )}
        </div>

        <div className="support-conv-item__preview">
          <span className="support-conv-item__preview-text">
            {lastMsgPreview.length > 40 ? lastMsgPreview.slice(0, 40) + '…' : lastMsgPreview}
          </span>
          {hasUnread && (
            <span className="support-conv-item__unread-badge">
              {conversation.staffUnreadCount}
            </span>
          )}
        </div>

        <div className="support-conv-item__meta">
          {conversation.assignedTo ? (
            <span className="support-conv-item__assigned">
              👤 {conversation.assignedTo.username}
            </span>
          ) : (
            <span className="support-conv-item__assigned support-conv-item__assigned--unassigned">
              Unassigned
            </span>
          )}
          {customer?.phone && (
            <span className="support-conv-item__phone">📞 {customer.phone}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default SupportConversationItem;
