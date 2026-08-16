import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

export const SupportSocketContext = createContext();

// ── Call notification sound (Web Audio API — no file needed) ──────────────────
function playRingtone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, start, dur, vol = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, start);
      osc.type = "sine";
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };
    // Ring pattern: two short tones, pause, two short tones
    for (let i = 0; i < 3; i++) {
      const t = ctx.currentTime + i * 0.8;
      playTone(523, t, 0.25);
      playTone(659, t + 0.25, 0.25);
    }
  } catch(_) { /* intentionally ignored */ }
}

function playCallEndSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch(_) { /* intentionally ignored */ }
}

export const SupportSocketContextProvider = ({ children }) => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState(null);
  const [chatAssigned, setChatAssigned] = useState(null);
  const ringtoneRef = useRef(null);
  const ringIntervalRef = useRef(null);

  // ── Socket listeners for support-specific events ──────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onCallOffer = (data) => {
      setIncomingCall({
        type: data.callType || "audio",
        from: data.from,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        conversationId: data.conversationId,
        signal: data.signal,
        timestamp: Date.now(),
      });

      // Play ringtone
      playRingtone();
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = setInterval(() => {
        playRingtone();
      }, 3000);

      toast.custom(
        (t) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              background: "#1a1a2e",
              color: "#fff",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
            onClick={() => toast.dismiss(t.id)}
            role="button"
            tabIndex={0}
          >
            <span style={{ fontSize: "20px" }}>
              {data.callType === "video" ? "📹" : "📞"}
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "13px" }}>
                {data.callerName || "Incoming Call"}
              </p>
              <p style={{ margin: 0, fontSize: "11px", opacity: 0.7 }}>
                {data.callType === "video" ? "Video Call" : "Audio Call"}
              </p>
            </div>
          </div>
        ),
        { duration: 8000, position: "top-right" }
      );
    };

    const onCallReject = () => {
      clearIncomingCall();
      playCallEndSound();
    };

    const onCallEnd = () => {
      clearIncomingCall();
      playCallEndSound();
    };

    const onChatAssigned = (data) => {
      setChatAssigned(data);
      toast.success(`Chat assigned to ${data.staffName || "staff"}`);
    };

    const onChatUpdated = (data) => {
      // Dispatch a custom event so the useSupportChat hook can react
      window.dispatchEvent(
        new CustomEvent("support:chatUpdated", { detail: data })
      );
    };

    socket.on("call:offer", onCallOffer);
    socket.on("call:reject", onCallReject);
    socket.on("call:end", onCallEnd);
    socket.on("chat:assigned", onChatAssigned);
    socket.on("chat:updated", onChatUpdated);

    return () => {
      socket.off("call:offer", onCallOffer);
      socket.off("call:reject", onCallReject);
      socket.off("call:end", onCallEnd);
      socket.off("chat:assigned", onChatAssigned);
      socket.off("chat:updated", onChatUpdated);
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, [socket]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  const emitCallSignal = useCallback(
    (event, data) => {
      if (socket) {
        socket.emit(event, data);
      }
    },
    [socket]
  );

  const sendCallOffer = useCallback(
    (payload) => {
      emitCallSignal("call:offer", payload);
    },
    [emitCallSignal]
  );

  const sendCallAnswer = useCallback(
    (payload) => {
      emitCallSignal("call:answer", payload);
    },
    [emitCallSignal]
  );

  const sendICECandidate = useCallback(
    (payload) => {
      emitCallSignal("call:ice-candidate", payload);
    },
    [emitCallSignal]
  );

  const sendCallReject = useCallback(
    (payload) => {
      emitCallSignal("call:reject", payload);
    },
    [emitCallSignal]
  );

  const sendCallEnd = useCallback(
    (payload) => {
      emitCallSignal("call:end", payload);
    },
    [emitCallSignal]
  );

  return (
    <SupportSocketContext.Provider
      value={{
        incomingCall,
        clearIncomingCall,
        chatAssigned,
        setChatAssigned,
        sendCallOffer,
        sendCallAnswer,
        sendICECandidate,
        sendCallReject,
        sendCallEnd,
        playRingtone,
        playCallEndSound,
      }}
    >
      {children}
    </SupportSocketContext.Provider>
  );
};

export const useSupportSocket = () => {
  const ctx = useContext(SupportSocketContext);
  if (!ctx)
    throw new Error(
      "useSupportSocket must be used within SupportSocketContextProvider"
    );
  return ctx;
};
