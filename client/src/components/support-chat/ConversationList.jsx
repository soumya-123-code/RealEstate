import { useState, useRef, useCallback, useEffect, memo } from "react";
import { format } from "timeago.js";
import {
  FiSearch,
  FiMessageCircle,
  FiFilter,
  FiChevronDown,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

// ── Skeleton loader ────────────────────────────────────────────────────────
function ConversationSkeleton() {
  return (
    <div className="sc-conv-skeleton">
      <div className="sc-conv-skeleton__avatar" />
      <div className="sc-conv-skeleton__body">
        <div className="sc-conv-skeleton__name" />
        <div className="sc-conv-skeleton__preview" />
      </div>
      <div className="sc-conv-skeleton__time" />
    </div>
  );
}

// ── Single conversation item ───────────────────────────────────────────────
const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  isOnline,
  isTyping,
  onSelect,
}) {
  const customerName = conversation.customerName || "Unknown";
  const customerAvatar = conversation.customerAvatar || null;
  const lastMessage = conversation.lastMessage || "";
  const updatedAt = conversation.updatedAt || conversation.lastMessageAt;
  const unreadCount = conversation.unreadCount || 0;
  const propertyName = conversation.propertyName || "";
  const assignedStaff = conversation.assignedStaff || null;

  return (
    <div
      className={`sc-conv${isActive ? " sc-conv--active" : ""}${unreadCount > 0 ? " sc-conv--unread" : ""}`}
      onClick={() => onSelect(conversation)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect(conversation);
      }}
    >
      {/* Avatar */}
      <div className="sc-conv__avatar">
        {customerAvatar ? (
          <img src={customerAvatar} alt={customerName} loading="lazy" />
        ) : (
          <span>{customerName[0].toUpperCase()}</span>
        )}
        <span className={`sc-conv__dot${isOnline ? " sc-conv__dot--on" : ""}`} />
      </div>

      {/* Content */}
      <div className="sc-conv__body">
        <div className="sc-conv__top">
          <span className="sc-conv__name">{customerName}</span>
          <span className="sc-conv__time">{updatedAt ? format(updatedAt) : ""}</span>
        </div>

        <div className="sc-conv__info">
          {propertyName && (
            <span className="sc-conv__property">🏢 {propertyName}</span>
          )}
        </div>

        <div className="sc-conv__bottom">
          <span className="sc-conv__preview">
            {isTyping ? (
              <span className="sc-conv__typing">typing...</span>
            ) : lastMessage ? (
              <>
                {conversation.lastMessageSender === "staff" && (
                  <span className="sc-conv__preview-label">You: </span>
                )}
                {lastMessage.length > 45
                  ? lastMessage.slice(0, 45) + "..."
                  : lastMessage}
              </>
            ) : (
              "No messages yet"
            )}
          </span>

          <div className="sc-conv__indicators">
            {assignedStaff && (
              <div className="sc-conv__staff-avatar" title={`Assigned: ${assignedStaff.username}`}>
                {assignedStaff.avatar ? (
                  <img src={assignedStaff.avatar} alt={assignedStaff.username} />
                ) : (
                  <span>{assignedStaff.username[0].toUpperCase()}</span>
                )}
              </div>
            )}
            {unreadCount > 0 && (
              <span className="sc-conv__badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── ConversationList component ──────────────────────────────────────────────
const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "assigned", label: "Assigned" },
  { key: "unassigned", label: "Unassigned" },
  { key: "resolved", label: "Resolved" },
  { key: "archived", label: "Archived" },
];

export default function ConversationList({
  conversations,
  activeConversation,
  loading,
  filter,
  searchQuery,
  isUserOnline,
  isConversationTyping,
  onSelectConversation,
  onFilterChange,
  onSearchChange,
  onRefresh,
  onBack,
  showBack,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const listRef = useRef(null);
  const touchStartYRef = useRef(null);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    const scrollTop = listRef.current?.scrollTop || 0;
    if (scrollTop <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartYRef.current === null) return;
    const diff = e.touches[0].clientY - touchStartYRef.current;
    if (diff > 60) {
      setIsRefreshing(true);
      touchStartYRef.current = null;
      onRefresh?.();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [onRefresh]);

  const handleTouchEnd = useCallback(() => {
    touchStartYRef.current = null;
  }, []);

  const activeFilter = FILTER_TABS.find((t) => t.key === filter);

  return (
    <div className="sc-conv-list">
      {/* Header */}
      <div className="sc-conv-list__header">
        {showBack && (
          <button
            type="button"
            className="sc-conv-list__back"
            onClick={onBack}
          >
            ← Back
          </button>
        )}
        <h2 className="sc-conv-list__title">Chats</h2>
        <span className="sc-conv-list__count">
          {conversations.length > 0 ? conversations.length : ""}
        </span>
        <button
          type="button"
          className="sc-conv-list__refresh"
          onClick={onRefresh}
          title="Refresh"
        >
          <FiRefreshCw size={14} className={isRefreshing ? "sc-spin" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="sc-conv-list__filters">
        <div className="sc-conv-list__filter-scroll">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`sc-conv-list__filter-tab${filter === tab.key ? " sc-conv-list__filter-tab--active" : ""}`}
              onClick={() => onFilterChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="sc-conv-list__search">
        <FiSearch size={14} />
        <input
          type="text"
          placeholder="Search by name, phone, property..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
        {searchQuery && (
          <button
            type="button"
            className="sc-conv-list__search-clear"
            onClick={() => onSearchChange("")}
          >
            ×
          </button>
        )}
      </div>

      {/* Conversation list */}
      <div
        ref={listRef}
        className="sc-conv-list__list"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isRefreshing && (
          <div className="sc-conv-list__pull-indicator">
            <FiRefreshCw size={14} className="sc-spin" />
            <span>Refreshing...</span>
          </div>
        )}

        {loading ? (
          <div className="sc-conv-list__loading">
            {[...Array(6)].map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="sc-conv-list__empty">
            <FiMessageCircle size={36} />
            <p>
              {searchQuery || filter !== "all"
                ? "No conversations match your filters"
                : "No conversations yet"}
            </p>
            {searchQuery && (
              <button
                type="button"
                className="sc-conv-list__clear-search"
                onClick={() => onSearchChange("")}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversation?.id === conv.id}
              isOnline={conv.customerId ? isUserOnline(conv.customerId) : false}
              isTyping={
                isConversationTyping?.senderId === conv.customerId
                  ? true
                  : false
              }
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
