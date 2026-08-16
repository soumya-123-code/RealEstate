/**
 * SupportDashboard.jsx
 *
 * 3-pane WhatsApp-Web-style support dashboard.
 *
 * Layout:
 *   - Desktop (≥1024px): 3 panes side-by-side (sidebar | chat | info)
 *   - Tablet  (768–1023px): 2 panes (sidebar | chat), info as drawer
 *   - Mobile  (<768px): single pane with bottom-nav switcher
 *
 * Route: /admin/support, /staff/support, /agent/support (all point here)
 *
 * Wrapped by SupportContextProvider (in App.jsx) so all child components
 * can use `useSupport()` hook for state + actions.
 */

import { useState, useEffect } from 'react';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
import SupportSidebar from '../../components/support/SupportSidebar';
import SupportChatWindow from '../../components/support/SupportChatWindow';
import SupportInfoPanel from '../../components/support/SupportInfoPanel';
import { FiMessageCircle, FiUser, FiPhone, FiX, FiMenu } from 'react-icons/fi';
import './SupportDashboard.scss';

function SupportDashboard() {
  const { activeConversation } = useSupport();
  const { currentUser } = useAuth();
  const [mobilePane, setMobilePane] = useState('list'); // 'list' | 'chat' | 'info'
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // When a conversation is selected on mobile, switch to chat pane
  useEffect(() => {
    if (activeConversation && window.innerWidth < 768) {
      setMobilePane('chat');
    }
  }, [activeConversation]);

  const roleLabel = currentUser?.role?.toLowerCase() || 'staff';

  return (
    <div className={`support-dashboard support-dashboard--${roleLabel}`}>
      {/* Mobile top bar */}
      <div className="support-dashboard__mobile-top">
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="support-dashboard__mobile-menu-btn">
          <FiMenu />
        </button>
        <h1>Support Dashboard</h1>
        <div className="support-dashboard__mobile-user">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.username} />
          ) : (
            <span>{currentUser?.username?.[0]?.toUpperCase()}</span>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="support-dashboard__mobile-nav">
        <button
          className={mobilePane === 'list' ? 'active' : ''}
          onClick={() => setMobilePane('list')}
        >
          <FiMessageCircle /> Chats
        </button>
        <button
          className={mobilePane === 'chat' ? 'active' : ''}
          onClick={() => setMobilePane('chat')}
          disabled={!activeConversation}
        >
          <FiUser /> Chat
        </button>
        <button
          className={mobilePane === 'info' ? 'active' : ''}
          onClick={() => setMobilePane('info')}
          disabled={!activeConversation}
        >
          <FiPhone /> Info
        </button>
      </div>

      {/* 3-pane layout */}
      <div className="support-dashboard__layout">
        {/* LEFT SIDEBAR */}
        <aside
          className={`support-dashboard__sidebar ${
            mobilePane === 'list' ? 'is-visible-mobile' : 'is-hidden-mobile'
          }`}
        >
          <SupportSidebar />
        </aside>

        {/* CENTER CHAT */}
        <main
          className={`support-dashboard__chat ${
            mobilePane === 'chat' ? 'is-visible-mobile' : 'is-hidden-mobile'
          }`}
        >
          <SupportChatWindow onToggleInfo={() => setShowInfoDrawer(true)} />
        </main>

        {/* RIGHT INFO PANEL */}
        <aside
          className={`support-dashboard__info ${
            mobilePane === 'info' ? 'is-visible-mobile' : 'is-hidden-mobile'
          } ${showInfoDrawer ? 'is-drawer-open' : ''}`}
        >
          <button
            className="support-dashboard__info-close"
            onClick={() => setShowInfoDrawer(false)}
          >
            <FiX />
          </button>
          <SupportInfoPanel />
        </aside>
      </div>

      {/* Overlay when drawer is open (tablet) */}
      {showInfoDrawer && (
        <div
          className="support-dashboard__overlay"
          onClick={() => setShowInfoDrawer(false)}
        />
      )}
    </div>
  );
}

export default SupportDashboard;
