/**
 * CallHistory.jsx
 *
 * User-facing call history page at /call-history.
 * Shows all audio + video calls (incoming, outgoing, missed, rejected).
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../lib/apiRequest';
import { formatDate } from '../lib/utils';
import {
  FiPhone, FiVideo, FiPhoneOff, FiArrowUpRight, FiArrowDownLeft,
  FiX, FiLoader, FiPhoneMissed,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './CallHistory.scss';

const STATUS_CONFIG = {
  INITIATED: { label: 'Initiated', color: '#f59e0b' },
  ANSWERED: { label: 'Answered', color: '#3b82f6' },
  COMPLETED: { label: 'Completed', color: '#16a34a' },
  REJECTED: { label: 'Rejected', color: '#ef4444' },
  MISSED: { label: 'Missed', color: '#ef4444' },
  FAILED: { label: 'Failed', color: '#ef4444' },
  CANCELLED: { label: 'Cancelled', color: '#64748b' },
};

function formatDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function CallHistory() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/calls', {
        params: { page: 1, limit: 100 },
      });
      setCalls(res.data.calls || []);
    } catch (err) {
      console.error('Error fetching calls:', err);
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const filteredCalls = filter === 'ALL'
    ? calls
    : calls.filter((c) => c.callType === filter);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${window.location.origin}${avatar}`;
  };

  return (
    <div className="call-history-page">
      <div className="container">
        <div className="call-history-header">
          <h1>Call History</h1>
          <p>All your audio and video calls in one place</p>
        </div>

        <div className="call-history-filters">
          <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>
            All ({calls.length})
          </button>
          <button
            className={filter === 'AUDIO' ? 'active' : ''}
            onClick={() => setFilter('AUDIO')}
          >
            📞 Audio ({calls.filter((c) => c.callType === 'AUDIO').length})
          </button>
          <button
            className={filter === 'VIDEO' ? 'active' : ''}
            onClick={() => setFilter('VIDEO')}
          >
            📹 Video ({calls.filter((c) => c.callType === 'VIDEO').length})
          </button>
        </div>

        {loading ? (
          <div className="call-history-loading">
            <FiLoader className="spin" size={32} />
            <p>Loading calls...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="call-history-empty">
            <FiPhone size={48} />
            <h3>No calls yet</h3>
            <p>Start a call from the chat page to see your call history here.</p>
            <Link to="/chat" className="btn-go-chat">Go to Chat</Link>
          </div>
        ) : (
          <div className="call-history-list">
            {filteredCalls.map((call) => {
              const isOutgoing = call.callerId === call._myId;
              const otherParty = isOutgoing ? call.receiver : call.caller;
              const cfg = STATUS_CONFIG[call.status] || STATUS_CONFIG.INITIATED;
              const avatar = getAvatarUrl(otherParty?.avatar);

              return (
                <div key={call.id} className="call-history-item">
                  <div className="call-history-item__avatar">
                    {avatar ? (
                      <img src={avatar} alt={otherParty?.username} />
                    ) : (
                      <span>{otherParty?.username?.[0]?.toUpperCase() || '?'}</span>
                    )}
                  </div>

                  <div className="call-history-item__info">
                    <div className="call-history-item__top">
                      <strong>{otherParty?.username}</strong>
                      <span className="call-history-item__type">
                        {call.callType === 'VIDEO' ? <FiVideo size={14} /> : <FiPhone size={14} />}
                      </span>
                    </div>
                    <div className="call-history-item__meta">
                      <span className={`call-history-item__direction call-history-item__direction--${isOutgoing ? 'out' : 'in'}`}>
                        {isOutgoing ? <FiArrowUpRight size={12} /> : <FiArrowDownLeft size={12} />}
                        {isOutgoing ? 'Outgoing' : 'Incoming'}
                      </span>
                      <span className="call-history-item__status" style={{ color: cfg.color }}>
                        {call.status === 'MISSED' && <FiPhoneMissed size={12} />}
                        {cfg.label}
                      </span>
                      {call.durationSec > 0 && call.status === 'COMPLETED' && (
                        <span className="call-history-item__duration">
                          {formatDuration(call.durationSec)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="call-history-item__time">
                    {formatDate(call.initiatedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CallHistory;
