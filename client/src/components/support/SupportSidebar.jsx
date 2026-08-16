/**
 * SupportSidebar.jsx
 *
 * Left pane of the support dashboard.
 *
 * Contains:
 *   - Filter tabs (All / Unread / Mine / Unassigned / Resolved / Archived)
 *   - Search bar (customer name, mobile, property ID/name)
 *   - Conversation list (each row = SupportConversationItem)
 *   - "+ New Chat" button (admin only) — opens customer picker modal
 *   - Admin stats summary (top widget, admin only)
 */

import { useState, useEffect } from 'react';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
import SupportConversationItem from './SupportConversationItem';
import NewSupportConversationModal from './NewSupportConversationModal';
import { FiSearch, FiPlus, FiRefreshCw, FiX, FiCheckCircle, FiClock, FiInbox, FiUserCheck } from 'react-icons/fi';
import './SupportSidebar.scss';

const FILTERS = [
  { key: 'all', label: 'All', icon: FiInbox },
  { key: 'unread', label: 'Unread', icon: FiClock },
  { key: 'mine', label: 'Mine', icon: FiUserCheck },
  { key: 'unassigned', label: 'Unassigned', icon: FiUserCheck },
  { key: 'resolved', label: 'Resolved', icon: FiCheckCircle },
  { key: 'archived', label: 'Archived', icon: FiInbox },
];

function SupportSidebar() {
  const {
    conversations,
    loadingList,
    filter,
    setFilter,
    search,
    setSearch,
    selectConversation,
    activeConversation,
    fetchConversations,
    stats,
  } = useSupport();
  const { currentUser } = useAuth();
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <div className="support-sidebar">
      {/* Header */}
      <div className="support-sidebar__header">
        <h2>Support Inbox</h2>
        <div className="support-sidebar__header-actions">
          <button
            onClick={() => fetchConversations()}
            title="Refresh"
            className="support-sidebar__icon-btn"
          >
            <FiRefreshCw size={14} />
          </button>
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setShowNewModal(true)}
              title="New conversation"
              className="support-sidebar__new-btn"
            >
              <FiPlus size={14} /> New
            </button>
          )}
        </div>
      </div>

      {/* Admin stats widget */}
      {currentUser?.role === 'ADMIN' && stats && (
        <div className="support-sidebar__stats">
          <div className="support-sidebar__stat">
            <span>{stats.active}</span>
            <small>Active</small>
          </div>
          <div className="support-sidebar__stat">
            <span>{stats.pending}</span>
            <small>Pending</small>
          </div>
          <div className="support-sidebar__stat support-sidebar__stat--warning">
            <span>{stats.unassigned}</span>
            <small>Unassigned</small>
          </div>
          <div className="support-sidebar__stat support-sidebar__stat--success">
            <span>{stats.resolved}</span>
            <small>Resolved</small>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="support-sidebar__search">
        <FiSearch size={14} />
        <input
          type="text"
          placeholder="Search name, mobile, property..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="support-sidebar__filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? 'active' : ''}
            onClick={() => setFilter(f.key)}
          >
            <f.icon size={12} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="support-sidebar__list">
        {loadingList && conversations.length === 0 ? (
          <div className="support-sidebar__empty">
            <FiRefreshCw className="spin" size={24} />
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="support-sidebar__empty">
            <FiInbox size={32} />
            <p>No conversations found</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <SupportConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversation?.id === conv.id}
              onClick={() => selectConversation(conv.id)}
            />
          ))
        )}
      </div>

      {/* New conversation modal */}
      {showNewModal && (
        <NewSupportConversationModal onClose={() => setShowNewModal(false)} />
      )}
    </div>
  );
}

export default SupportSidebar;
