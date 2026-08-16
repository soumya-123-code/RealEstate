import { useEffect, useRef, useState } from "react";
import { useCall } from "../../context/CallContext";
import "./CallModal.scss";

function CallModal() {
  const {
    activeCall,
    callStatus,
    setCallStatus,
    setActiveCall,
    endCall,
    answerCall,
    rejectCall,
    getLocalStream,
    getRemoteStream,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  const isVideo = activeCall?.callType === "video";

  // Attach streams when connected
  useEffect(() => {
    if (callStatus === "connected") {
      const localStream = getLocalStream();
      const remoteStream = getRemoteStream();

      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current && remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }

      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [callStatus, getLocalStream, getRemoteStream]);

  // End call handler
  const handleEnd = () => {
    if (activeCall?.isIncoming && callStatus === "ringing") {
      rejectCall();
    } else {
      endCall();
    }
  };

  // Toggle mic
  const toggleMute = () => {
    const stream = getLocalStream();
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setMuted(!muted);
    }
  };

  // Toggle camera
  const toggleVideo = () => {
    const stream = getLocalStream();
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setVideoOff(!videoOff);
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?";
  };

  if (!activeCall) return null;

  const statusText =
    callStatus === "ringing"
      ? activeCall.isIncoming
        ? "Incoming call..."
        : "Calling..."
      : callStatus === "connected"
      ? formatDuration(callDuration)
      : "Call ended";

  return (
    <div className="call-modal">
      {/* Full-screen remote video (video call) */}
      {isVideo && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="call-modal__remote-video"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`call-modal__local-video ${videoOff ? "hidden" : ""}`}
          />
        </>
      )}

      {/* Audio element for audio-only calls */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Overlay */}
      <div className={`call-modal__overlay ${!isVideo ? "call-modal__overlay--audio" : ""}`}>
        {/* Top: caller info */}
        <div className="call-modal__header">
          <div className="call-modal__avatar-wrap">
            {activeCall.remoteUserAvatar && !isVideo ? (
              <img
                src={activeCall.remoteUserAvatar}
                alt=""
                className="call-modal__avatar-img"
              />
            ) : (
              <div className="call-modal__avatar-fallback">
                {getInitials(activeCall.remoteUserName)}
              </div>
            )}
            {callStatus === "ringing" && (
              <div className="call-modal__ring-pulse" />
            )}
          </div>
          <h2 className="call-modal__name">{activeCall.remoteUserName}</h2>
          <p className="call-modal__status">{statusText}</p>
        </div>

        {/* Bottom: controls */}
        <div className="call-modal__controls">
          {activeCall.isIncoming && callStatus === "ringing" ? (
            /* Incoming: answer + reject */
            <div className="call-modal__btn-row">
              <button
                className="call-modal__btn call-modal__btn--reject"
                onClick={handleEnd}
                title="Decline"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
              <button
                className="call-modal__btn call-modal__btn--answer"
                onClick={answerCall}
                title="Answer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>
            </div>
          ) : callStatus !== "ended" ? (
            /* In-call: mute + video toggle + end */
            <div className="call-modal__btn-row">
              <button
                className={`call-modal__btn call-modal__btn--secondary ${muted ? "active" : ""}`}
                onClick={toggleMute}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .87-.16 1.71-.46 2.49" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>

              {isVideo && (
                <button
                  className={`call-modal__btn call-modal__btn--secondary ${videoOff ? "active" : ""}`}
                  onClick={toggleVideo}
                  title={videoOff ? "Turn camera on" : "Turn camera off"}
                >
                  {videoOff ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 2H8a2 2 0 0 0-2 2v16m0-16 2.5 2.5M14 2l-2.5 2.5M2 16.5A2.5 2.5 0 0 1 4.5 14h0a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 4.5 19h0A2.5 2.5 0 0 1 2 16.5z" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M23 7l-7 5 7 5V7z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  )}
                </button>
              )}

              <button
                className="call-modal__btn call-modal__btn--end"
                onClick={handleEnd}
                title="End call"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="call-modal__btn call-modal__btn--secondary"
              onClick={() => {
                setActiveCall(null);
                setCallStatus("idle");
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallModal;