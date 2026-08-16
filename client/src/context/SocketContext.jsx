import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { SOCKET_URL } from "../lib/config";
import "../styles/chat-toast.scss";

export const SocketContext = createContext();

// ── Notification sound ────────────────────────────────────────────────────────
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, start, dur, vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, start);
      osc.type = "sine";
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };
    const t = ctx.currentTime;
    playTone(880, t, 0.15);
    playTone(1100, t + 0.12, 0.18, 0.2);
  } catch(_) { /* intentionally ignored */ }
}

// ── Ring tone (for incoming calls) ────────────────────────────────────────────
function playRingTone(audioCtxRef) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const ring = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    };
    ring();
    const interval = setInterval(ring, 2000);
    ctx._ringInterval = interval;
    return () => {
      clearInterval(interval);
      ctx.close();
    };
  } catch (_) {
    return () => {};
  }
}

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket]                       = useState(null);
  const [onlineUsers, setOnlineUsers]             = useState([]);
  const [notifications, setNotifications]         = useState([]);
  const [chatNotifications, setChatNotifications] = useState([]);
  const [totalUnread, setTotalUnread]             = useState(0);
  const [typingUsers, setTypingUsers]             = useState({});

  // ── WebRTC call state ─────────────────────────────────────────────────────
  const [callState, setCallState] = useState({
    status: "idle",      // idle | ringing | calling | in-call
    type: null,          // "audio" | "video"
    remoteUser: null,    // { id, username, avatar }
    chatId: null,
    isIncoming: false,
  });

  const activeChatIdRef  = useRef(null);
  const pcRef            = useRef(null);    // RTCPeerConnection
  const localStreamRef   = useRef(null);
  const remoteStreamRef  = useRef(null);
  const ringCleanupRef   = useRef(null);
  const ringAudioCtxRef  = useRef(null);
  const pendingCandidates = useRef([]);
  const callStateRef     = useRef(callState);
  callStateRef.current = callState;

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;

    const sock = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    sock.on("connect", () => {
      console.log("✅ Socket connected:", sock.id);
      sock.emit("newUser", currentUser.id);
    });

    sock.on("getOnlineUsers", (users) => {
      if (Array.isArray(users)) {
        const ids = users.map((u) =>
          typeof u === "object" ? String(u.userId ?? u.id ?? "") : String(u)
        );
        setOnlineUsers(ids);
      }
    });

    sock.on("newInquiry", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    // ── Incoming chat message ─────────────────────────────────────────────
    sock.on("getMessage", (data) => {
      const incomingChatId = Number(data.chatId);
      const isActiveChat   = activeChatIdRef.current === incomingChatId;

      // The server echoes the sender's own messages to their other tabs;
      // never toast for your own message.
      if (String(data.userId) === String(currentUser.id)) return;

      if (!isActiveChat) {
        setChatNotifications((prev) => {
          const idx = prev.findIndex((n) => n.chatId === incomingChatId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], count: next[idx].count + 1, lastMsg: data.text, senderName: data.senderName };
            return next;
          }
          return [...prev, { chatId: incomingChatId, count: 1, lastMsg: data.text, senderName: data.senderName }];
        });
        setTotalUnread((n) => n + 1);
        playNotificationSound();

        toast.custom(
          (t) => (
            <div
              className={`chat-toast ${t.visible ? "chat-toast--in" : "chat-toast--out"}`}
              onClick={() => toast.dismiss(t.id)}
              role="button"
              tabIndex={0}
            >
              <div className="chat-toast__avatar">
                {data.senderAvatar
                  ? <img src={data.senderAvatar} alt="" />
                  : <span>{(data.senderName || "?")[0].toUpperCase()}</span>}
                <span className="chat-toast__dot" />
              </div>
              <div className="chat-toast__body">
                <p className="chat-toast__name">{data.senderName || "New message"}</p>
                <p className="chat-toast__text">
                  {data.text?.length > 60 ? data.text.slice(0, 60) + "…" : data.text}
                </p>
              </div>
              <span className="chat-toast__close">✕</span>
            </div>
          ),
          { duration: 5000, position: "top-right" }
        );
      }
    });

    // ── Typing ────────────────────────────────────────────────────────────
    sock.on("userTyping", ({ chatId, senderId, senderName, isTyping }) => {
      const cid = Number(chatId);
      setTypingUsers((prev) => {
        if (isTyping) return { ...prev, [cid]: { senderId, senderName } };
        const next = { ...prev };
        delete next[cid];
        return next;
      });
    });

    // ── WebRTC Signaling ──────────────────────────────────────────────────
    sock.on("incoming-call", async ({ callerId, callType, chatId, offer, callerName, callerAvatar }) => {
      const from = callerId;
      console.log("[WebRTC] Incoming call from", from, callType);
      // Start ringing
      ringCleanupRef.current = playRingTone(ringAudioCtxRef);
      setCallState({
        status: "ringing",
        type: callType,
        remoteUser: { id: from, username: callerName || "User", avatar: callerAvatar || null },
        chatId,
        isIncoming: true,
        pendingOffer: offer,
        from,
      });
    });

    sock.on("call-answer", async ({ answer }) => {
      console.log("[WebRTC] Call answered");
      if (pcRef.current && answer) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          // Flush pending candidates
          for (const c of pendingCandidates.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
          pendingCandidates.current = [];
        } catch (e) {
          console.error("[WebRTC] setRemoteDescription answer error:", e);
        }
      }
      setCallState((prev) => ({ ...prev, status: "in-call" }));
    });

    sock.on("call-ice-candidate", async ({ candidate }) => {
      if (pcRef.current) {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        } else {
          pendingCandidates.current.push(candidate);
        }
      }
    });

    sock.on("call-ended", () => {
      console.log("[WebRTC] Remote ended call");
      _cleanupCall();
      toast("Call ended", { icon: "📞" });
    });

    sock.on("call-rejected", () => {
      console.log("[WebRTC] Call rejected");
      _cleanupCall();
      toast("Call declined", { icon: "❌" });
    });

    sock.on("callBusy", () => {
      _cleanupCall();
      toast("User is busy", { icon: "🔴" });
    });

    sock.on("call-user-offline", ({ targetUserId } = {}) => {
      console.log("[WebRTC] Call target offline:", targetUserId);
      _cleanupCall();
      toast("User is not online right now", { icon: "📴" });
    });

    sock.on("call-user-disconnected", ({ userId } = {}) => {
      const cs = callStateRef.current;
      if (cs.status !== "idle" && String(userId) === String(cs.remoteUser?.id)) {
        console.log("[WebRTC] Remote user disconnected mid-call");
        _cleanupCall();
        toast("The other user disconnected", { icon: "📵" });
      }
    });

    sock.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      // Keep call state sane across transient socket drops
      if (reason === "io server disconnect" || reason === "transport close") {
        const cs = callStateRef.current;
        if (cs.status === "calling" || cs.status === "ringing") {
          _cleanupCall();
          toast("Connection lost", { icon: "⚠️" });
        }
      }
    });
    sock.on("connect_error", (err) => console.error("Socket error:", err.message));

    setSocket(sock);
    return () => {
      sock.disconnect();
      _cleanupCall();
    };
  }, [currentUser?.id]);

  // ── Internal call cleanup ─────────────────────────────────────────────────
  const _cleanupCall = useCallback(() => {
    // Stop ring
    if (ringCleanupRef.current) {
      ringCleanupRef.current();
      ringCleanupRef.current = null;
    }
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    pendingCandidates.current = [];
    setCallState({ status: "idle", type: null, remoteUser: null, chatId: null, isIncoming: false });
  }, []);

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const _createPC = useCallback((sock, targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && sock) {
        sock.emit("call-ice-candidate", { targetUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      remoteStreamRef.current = e.streams[0];
      // Dispatch a custom event so UI components can attach the stream
      window.dispatchEvent(new CustomEvent("remoteStream", { detail: e.streams[0] }));
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] PC state:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        _cleanupCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [_cleanupCall]);

  // ── Initiate a call ───────────────────────────────────────────────────────
  const startCall = useCallback(async (remoteUser, chatId, callType = "audio") => {
    if (!socket || callState.status !== "idle") return;

    try {
      const constraints = callType === "video"
        ? { audio: true, video: { width: 640, height: 480 } }
        : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Dispatch local stream event
      window.dispatchEvent(new CustomEvent("localStream", { detail: stream }));

      const pc = _createPC(socket, remoteUser.id);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-offer", {
        targetUserId: remoteUser.id,
        callType,
        chatId,
        offer,
        callerName: currentUser.username,
        callerAvatar: currentUser.avatar || null,
      });

      setCallState({
        status: "calling",
        type: callType,
        remoteUser,
        chatId,
        isIncoming: false,
      });
    } catch (err) {
      console.error("[WebRTC] startCall error:", err);
      _cleanupCall();
      if (err.name === "NotAllowedError") {
        toast.error("Please allow camera/microphone access");
      } else {
        toast.error("Could not start call");
      }
    }
  }, [socket, callState.status, currentUser, _createPC, _cleanupCall]);

  // ── Answer incoming call ──────────────────────────────────────────────────
  const answerCall = useCallback(async () => {
    if (callState.status !== "ringing" || !callState.pendingOffer) return;

    // Stop ring
    if (ringCleanupRef.current) {
      ringCleanupRef.current();
      ringCleanupRef.current = null;
    }

    try {
      const constraints = callState.type === "video"
        ? { audio: true, video: { width: 640, height: 480 } }
        : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      window.dispatchEvent(new CustomEvent("localStream", { detail: stream }));

      const pc = _createPC(socket, callState.from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callState.pendingOffer));
      // Flush pending ICE
      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call-answer", { targetUserId: callState.from, answer });

      setCallState((prev) => ({ ...prev, status: "in-call", isIncoming: false }));
    } catch (err) {
      console.error("[WebRTC] answerCall error:", err);
      rejectCall();
      if (err.name === "NotAllowedError") {
        toast.error("Please allow camera/microphone access");
      }
    }
  }, [callState, socket, _createPC]);

  // ── Reject / end call ─────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (callState.status === "ringing" && socket) {
      socket.emit("call-reject", { targetUserId: callState.from });
    }
    _cleanupCall();
  }, [callState, socket, _cleanupCall]);

  const endCall = useCallback((durationSeconds = 0) => {
    if (callState.remoteUser && socket) {
      socket.emit("call-end", {
        targetUserId: callState.remoteUser.id,
        chatId: callState.chatId,
        callerId: callState.isIncoming ? callState.remoteUser.id : currentUser?.id,
        receiverId: callState.isIncoming ? currentUser?.id : callState.remoteUser.id,
        callType: callState.type,
        duration: Math.max(0, Math.round(durationSeconds) || 0),
      });
    }
    _cleanupCall();
  }, [callState, socket, _cleanupCall]);

  // ── Toggle mute / camera ──────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
  }, []);

  // ── Chat helpers ──────────────────────────────────────────────────────────
  const emitTyping = useCallback(
    (receiverId, chatId, isTyping) => {
      if (socket) {
        socket.emit("typing", { receiverId, chatId, isTyping, senderName: currentUser?.username });
      }
    },
    [socket, currentUser]
  );

  const isUserOnline = useCallback(
    (userId) => {
      if (userId == null) return false;
      return onlineUsers.includes(String(userId));
    },
    [onlineUsers]
  );

  const setActiveChatId = useCallback((chatId) => {
    const cid = chatId ? Number(chatId) : null;
    activeChatIdRef.current = cid;
    if (cid != null) {
      setChatNotifications((prev) => {
        const found = prev.find((n) => n.chatId === cid);
        if (found) setTotalUnread((t) => Math.max(0, t - found.count));
        return prev.filter((n) => n.chatId !== cid);
      });
    }
  }, []);

  const clearChatNotification = useCallback((chatId) => {
    const cid = Number(chatId);
    setChatNotifications((prev) => {
      const found = prev.find((n) => n.chatId === cid);
      if (found) setTotalUnread((t) => Math.max(0, t - found.count));
      return prev.filter((n) => n.chatId !== cid);
    });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        setNotifications,
        chatNotifications,
        totalUnread,
        typingUsers,
        emitTyping,
        isUserOnline,
        setActiveChatId,
        clearChatNotification,
        playNotificationSound,
        // WebRTC
        callState,
        localStreamRef,
        remoteStreamRef,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketContextProvider");
  return ctx;
};
