/**
 * SupportChatWindow.jsx
 *
 * Center pane of the support dashboard.
 *
 * Contains:
 *   - Chat header (customer avatar/name/online + call buttons + actions menu)
 *   - Message list (scrollable, with typing indicator)
 *   - Message composer (textarea + attach + emoji + send)
 *
 * Empty state: shows placeholder when no conversation selected.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import SupportChatHeader from './SupportChatHeader';
import SupportMessageBubble from './SupportMessageBubble';
import SupportMessageComposer from './SupportMessageComposer';
import apiRequest from '../../lib/apiRequest';
import { format } from 'timeago.js';
import { FiMessageCircle, FiChevronDown } from 'react-icons/fi';
import './SupportChatWindow.scss';

function SupportChatWindow({ onToggleInfo }) {
  const {
    activeConversation,
    loadingDetail,
    sendMessage,
    uploadAttachment,
    markAllRead,
    markMessageRead,
    typingUsers,
    emitTyping,
  } = useSupport();
  const { currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const { startCall } = useCall();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages?.length]);

  // Mark all as read when opening
  useEffect(() => {
    if (activeConversation?.id && (activeConversation.staffUnreadCount > 0 || activeConversation.customerUnreadCount > 0)) {
      markAllRead(activeConversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  const handleSend = useCallback(async ({ text, replyToId, attachments }) => {
    if (!activeConversation) return;
    await sendMessage(activeConversation.id, { text, replyToId, attachments });
  }, [activeConversation, sendMessage]);

  const handleFileUpload = useCallback(async (file) => {
    if (!activeConversation) return null;
    return await uploadAttachment(activeConversation.id, file);
  }, [activeConversation, uploadAttachment]);

  const handleAudioCall = useCallback(() => {
    if (!activeConversation?.customer) return;
    startCall(activeConversation.customer.id, 'AUDIO', {
      id: activeConversation.customer.id,
      username: activeConversation.customer.username,
      avatar: activeConversation.customer.avatar,
      role: activeConversation.customer.role,
    });
  }, [activeConversation, startCall]);

  const handleVideoCall = useCallback(() => {
    if (!activeConversation?.customer) return;
    startCall(activeConversation.customer.id, 'VIDEO', {
      id: activeConversation.customer.id,
      username: activeConversation.customer.username,
      avatar: activeConversation.customer.avatar,
      role: activeConversation.customer.role,
    });
  }, [activeConversation, startCall]);

  if (!activeConversation) {
    return (
      <div className="support-chat-window support-chat-window--empty">
        <FiMessageCircle size={64} />
        <h2>Select a conversation</h2>
        <p>Choose a conversation from the sidebar to start messaging with customers.</p>
      </div>
    );
  }

  if (loadingDetail) {
    return (
      <div className="support-chat-window support-chat-window--loading">
        <div className="support-chat-window__spinner" />
        <p>Loading conversation...</p>
      </div>
    );
  }

  const typing = typingUsers[activeConversation.id];
  const customerOnline = isUserOnline(activeConversation.customer?.id);

  return (
    <div className="support-chat-window">
      <SupportChatHeader
        conversation={activeConversation}
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
        onToggleInfo={onToggleInfo}
        customerOnline={customerOnline}
      />

      <div className="support-chat-window__messages" ref={messagesContainerRef}>
        {activeConversation.messages?.length === 0 ? (
          <div className="support-chat-window__no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          activeConversation.messages?.map((msg) => (
            <SupportMessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUser?.id}
              conversationId={activeConversation.id}
              currentUserId={currentUser?.id}
              onMarkRead={(msgId) => markMessageRead(activeConversation.id, msgId)}
            />
          ))
        )}

        {typing && (
          <div className="support-chat-window__typing">
            <div className="support-chat-window__typing-bubble">
              <span /> <span /> <span />
            </div>
            <small>{typing.senderName || 'Customer'} is typing...</small>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <SupportMessageComposer
        onSend={handleSend}
        onUpload={handleFileUpload}
        onTyping={(isTyping) => emitTyping(activeConversation.id, isTyping)}
        disabled={activeConversation.status === 'CLOSED'}
      />
    </div>
  );
}

export default SupportChatWindow;
