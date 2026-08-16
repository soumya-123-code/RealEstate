import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import useSupportChat from "../../hooks/useSupportChat";
import useWebRTC from "../../hooks/useWebRTC";
import ConversationList from "../../components/support-chat/ConversationList";
import ChatWindow from "../../components/support-chat/ChatWindow";
import CustomerInfoPanel from "../../components/support-chat/CustomerInfoPanel";
import CallScreen from "../../components/support-chat/CallScreen";
import {
  FiMessageSquare,
  FiLogOut,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import "./SupportChat.scss";

// ── Mobile view states ──────────────────────────────────────────────────────
const MOBILE_VIEW = {
  LIST: "list",
  CHAT: "chat",
  INFO: "info",
};

export default function SupportChat() {
  const { currentUser, logout } = useAuth();

  const {
    // State
    conversations,
    activeConversation,
    messages,
    loading,
    loadingMessages,
    sending,
    filter,
    searchQuery,
    customerInfo,
    propertyInfo,
    staffList,
    hasMoreMessages,
    isConversationTyping,
    filteredConversations,
    activeCustomer,
    newMessagesAtBottom,
    // Setters
    setFilter,
    setSearchQuery,
    // Actions
    fetchConversations,
    selectConversation,
    sendMessage,
    sendAttachment,
    editMessage,
    deleteMessage,
    forwardMessage,
    assignStaff,
    resolveConversation,
    archiveConversation,
    loadMoreMessages,
    handleTyping,
  } = useSupportChat();

  const {
    // WebRTC state
    callState,
    callInfo,
    callType,
    callDuration,
    formattedDuration,
    isMuted,
    isCameraOff,
    callEndedReason,
    incomingCall,
    hasWebRTC,
    // WebRTC refs
    localStreamRef,
    remoteStreamRef,
    // WebRTC actions
    initiateAudioCall,
    initiateVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useWebRTC();

  // ── Mobile view management ────────────────────────────────────────────────
  const [mobileView, setMobileView] = useState(MOBILE_VIEW.LIST);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  // ── Mobile navigation ────────────────────────────────────────────────────
  const handleSelectConversation = useCallback(
    (conv) => {
      selectConversation(conv);
      setMobileView(MOBILE_VIEW.CHAT);
    },
    [selectConversation]
  );

  const handleGoBack = useCallback(() => {
    setMobileView(MOBILE_VIEW.LIST);
  }, []);

  const handleShowInfo = useCallback(() => {
    setMobileView(MOBILE_VIEW.INFO);
  }, []);

  const handleBackFromInfo = useCallback(() => {
    setMobileView(MOBILE_VIEW.CHAT);
  }, []);

  // ── Responsive panel visibility ───────────────────────────────────────────
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Show info panel on desktop
  useEffect(() => {
    if (!isMobile) {
      setShowInfoPanel(true);
    }
  }, [isMobile]);

  // ── Handle logout ─────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [logout]);

  // ── Determine which panels to show ────────────────────────────────────────
  const showLeft = !isMobile || mobileView === MOBILE_VIEW.LIST;
  const showCenter = !isMobile || mobileView === MOBILE_VIEW.CHAT;
  const showRight = !isMobile ? showInfoPanel : mobileView === MOBILE_VIEW.INFO;

  return (
    <div className="sc-root">
      {/* ── Incoming call screen ────────────────────────────────────────────── */}
      {callState === "incoming" && incomingCall && (
        <CallScreen
          callState={callState}
          callType={callType}
          callInfo={callInfo}
          callDuration={callDuration}
          formattedDuration={formattedDuration}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          callEndedReason={callEndedReason}
          localStreamRef={localStreamRef}
          remoteStreamRef={remoteStreamRef}
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onSwitchCamera={switchCamera}
        />
      )}

      {/* ── Call overlay (non-incoming) ────────────────────────────────────── */}
      {(callState === "outgoing" || callState === "active" || callState === "ended") && (
        <CallScreen
          callState={callState}
          callType={callType}
          callInfo={callInfo}
          callDuration={callDuration}
          formattedDuration={formattedDuration}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          callEndedReason={callEndedReason}
          localStreamRef={localStreamRef}
          remoteStreamRef={remoteStreamRef}
          incomingCall={null}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onSwitchCamera={switchCamera}
        />
      )}

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <header className="sc-header">
        <div className="sc-header__left">
          <FiMessageSquare size={20} />
          <span className="sc-header__brand">Support Chat</span>
        </div>
        <div className="sc-header__center">
          {activeCustomer && (
            <span className="sc-header__active">
              Chatting with {activeCustomer.name}
            </span>
          )}
        </div>
        <div className="sc-header__right">
          {currentUser && (
            <div className="sc-header__user">
              <div className="sc-header__user-avatar">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.username} />
                ) : (
                  <span>{(currentUser.username || "?")[0].toUpperCase()}</span>
                )}
              </div>
              <span className="sc-header__user-name">{currentUser.username}</span>
            </div>
          )}
          <button
            type="button"
            className="sc-header__logout"
            onClick={handleLogout}
            title="Logout"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="sc-layout">
        {/* Left sidebar — Conversation list */}
        {showLeft && (
          <aside className="sc-layout__left">
            <ConversationList
              conversations={filteredConversations}
              activeConversation={activeConversation}
              loading={loading}
              filter={filter}
              searchQuery={searchQuery}
              isUserOnline={(id) => {
                // Use the socket's isUserOnline through useSupportChat
                return false; // Will be handled by the hook
              }}
              isConversationTyping={isConversationTyping}
              onSelectConversation={handleSelectConversation}
              onFilterChange={setFilter}
              onSearchChange={setSearchQuery}
              onRefresh={fetchConversations}
              onBack={handleGoBack}
              showBack={isMobile && mobileView === MOBILE_VIEW.CHAT}
            />
          </aside>
        )}

        {/* Center — Chat window */}
        {showCenter && (
          <main className="sc-layout__center">
            <ChatWindow
              activeConversation={activeConversation}
              messages={messages}
              loadingMessages={loadingMessages}
              sending={sending}
              activeCustomer={activeCustomer}
              isConversationTyping={isConversationTyping}
              hasMoreMessages={hasMoreMessages}
              newMessagesAtBottom={newMessagesAtBottom}
              conversations={conversations}
              onSendMessage={sendMessage}
              onSendAttachment={sendAttachment}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onForwardMessage={forwardMessage}
              onHandleTyping={handleTyping}
              onLoadMoreMessages={loadMoreMessages}
              onGoBack={handleGoBack}
              onInitiateAudioCall={
                hasWebRTC
                  ? (userId, convId, name, avatar) =>
                      initiateAudioCall(userId, convId, name, avatar)
                  : undefined
              }
              onInitiateVideoCall={
                hasWebRTC
                  ? (userId, convId, name, avatar) =>
                      initiateVideoCall(userId, convId, name, avatar)
                  : undefined
              }
              showBack={isMobile}
              onShowInfo={handleShowInfo}
            />
          </main>
        )}

        {/* Right panel — Customer info */}
        {showRight && (
          <aside className="sc-layout__right">
            <CustomerInfoPanel
              activeCustomer={activeCustomer}
              activeConversation={activeConversation}
              customerInfo={customerInfo}
              propertyInfo={propertyInfo}
              staffList={staffList}
              callHistory={[]}
              onAssignStaff={assignStaff}
              onResolveConversation={resolveConversation}
              onArchiveConversation={archiveConversation}
              onClose={() => setShowInfoPanel(false)}
              showBack={isMobile}
              onBack={handleBackFromInfo}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
