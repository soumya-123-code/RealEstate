import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiPhone,
  FiPhoneOff,
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiRepeat,
  FiVolume2,
  FiX,
} from "react-icons/fi";

// ── Sound wave animation bars (CSS-driven) ────────────────────────────────
function SoundWave({ active }) {
  return (
    <div className={`sc-call-sound-wave${active ? " sc-call-sound-wave--active" : ""}`}>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="sc-call-sound-wave__bar"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

// ── Avatar display ──────────────────────────────────────────────────────────
function CallAvatar({ name, avatar, size = 96 }) {
  return (
    <div className="sc-call-avatar" style={{ width: size, height: size }}>
      {avatar ? (
        <img src={avatar} alt={name} />
      ) : (
        <span className="sc-call-avatar__letter">
          {(name || "?")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ── Call control button ───────────────────────────────────────────────────
function CallButton({ icon: Icon, label, color, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`sc-call-btn sc-call-btn--${color || "default"}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <Icon size={22} />
      <span className="sc-call-btn__label">{label}</span>
    </button>
  );
}

// ── Incoming call ring animation ───────────────────────────────────────────
function RingAnimation() {
  return (
    <div className="sc-call-ring">
      <div className="sc-call-ring__circle sc-call-ring__circle--1" />
      <div className="sc-call-ring__circle sc-call-ring__circle--2" />
      <div className="sc-call-ring__circle sc-call-ring__circle--3" />
    </div>
  );
}

export default function CallScreen({
  callState,
  callType,
  callInfo,
  callDuration,
  formattedDuration,
  isMuted,
  isCameraOff,
  callEndedReason,
  localStreamRef,
  remoteStreamRef,
  incomingCall,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ── Attach streams to video elements ────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStreamRef?.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, localStreamRef]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef?.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState, remoteStreamRef]);

  const displayName = callInfo?.targetName || incomingCall?.callerName || "Unknown";
  const displayAvatar = callInfo?.targetAvatar || incomingCall?.callerAvatar || null;

  // ── Incoming call screen ─────────────────────────────────────────────────
  if (callState === "incoming" && incomingCall) {
    return (
      <div className="sc-call-screen sc-call-screen--incoming">
        <div className="sc-call-screen__backdrop" />
        <div className="sc-call-screen__content">
          <RingAnimation />
          <CallAvatar name={incomingCall.callerName} avatar={incomingCall.callerAvatar} size={100} />
          <h2 className="sc-call-screen__name">{incomingCall.callerName || "Unknown"}</h2>
          <p className="sc-call-screen__type">
            {incomingCall.type === "video" ? "Video Call" : "Audio Call"}
          </p>
          <div className="sc-call-screen__actions sc-call-screen__actions--incoming">
            <CallButton
              icon={FiPhoneOff}
              label="Decline"
              color="red"
              onClick={onReject}
            />
            <CallButton
              icon={incomingCall.type === "video" ? FiVideo : FiPhone}
              label="Accept"
              color="green"
              onClick={onAccept}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Outgoing call screen ─────────────────────────────────────────────────
  if (callState === "outgoing") {
    return (
      <div className="sc-call-screen sc-call-screen--outgoing">
        <div className="sc-call-screen__backdrop" />
        <div className="sc-call-screen__content">
          <RingAnimation />
          <CallAvatar name={displayName} avatar={displayAvatar} size={100} />
          <h2 className="sc-call-screen__name">{displayName}</h2>
          <p className="sc-call-screen__type">Calling...</p>
          <div className="sc-call-screen__actions">
            <CallButton icon={FiPhoneOff} label="Cancel" color="red" onClick={onEnd} />
          </div>
        </div>
      </div>
    );
  }

  // ── Active call screen ───────────────────────────────────────────────────
  if (callState === "active") {
    return (
      <div className="sc-call-screen sc-call-screen--active">
        <div className="sc-call-screen__backdrop" />

        {callType === "video" ? (
          /* ── Video call layout ─────────────────────────────────────────── */
          <div className="sc-call-screen__video">
            {/* Remote video (large) */}
            <video
              ref={remoteVideoRef}
              className="sc-call-screen__remote-video"
              autoPlay
              playsInline
              muted={false}
            />
            <CallAvatar
              name={displayName}
              avatar={displayAvatar}
              size={80}
            />

            {/* Self video (pip) */}
            <div className="sc-call-screen__local-video-wrap">
              <video
                ref={localVideoRef}
                className="sc-call-screen__local-video"
                autoPlay
                playsInline
                muted={true}
              />
              {isCameraOff && (
                <div className="sc-call-screen__local-placeholder">
                  <FiVideoOff size={24} />
                </div>
              )}
            </div>

            {/* Call info overlay */}
            <div className="sc-call-screen__video-info">
              <span className="sc-call-screen__name">{displayName}</span>
              <span className="sc-call-screen__timer">{formattedDuration}</span>
            </div>

            {/* Controls */}
            <div className="sc-call-screen__controls sc-call-screen__controls--video">
              <CallButton icon={FiMic} label={isMuted ? "Unmute" : "Mute"} color={isMuted ? "red" : "default"} onClick={onToggleMute} />
              <CallButton icon={FiVideoOff} label={isCameraOff ? "Camera On" : "Camera Off"} color={isCameraOff ? "red" : "default"} onClick={onToggleCamera} />
              <CallButton icon={FiRepeat} label="Flip" color="default" onClick={onSwitchCamera} />
              <CallButton icon={FiPhoneOff} label="End" color="red" onClick={onEnd} />
            </div>
          </div>
        ) : (
          /* ── Audio call layout ─────────────────────────────────────────── */
          <div className="sc-call-screen__audio">
            <CallAvatar name={displayName} avatar={displayAvatar} size={100} />
            <SoundWave active={!isMuted} />
            <h2 className="sc-call-screen__name">{displayName}</h2>
            <span className="sc-call-screen__timer">{formattedDuration}</span>

            <div className="sc-call-screen__controls">
              <CallButton icon={FiMic} label={isMuted ? "Unmute" : "Mute"} color={isMuted ? "red" : "default"} onClick={onToggleMute} />
              <CallButton icon={FiVolume2} label="Speaker" color="default" />
              <CallButton icon={FiPhoneOff} label="End" color="red" onClick={onEnd} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Call ended screen ────────────────────────────────────────────────────
  if (callState === "ended") {
    return (
      <div className="sc-call-screen sc-call-screen--ended">
        <div className="sc-call-screen__backdrop" />
        <div className="sc-call-screen__content">
          <CallAvatar name={displayName} avatar={displayAvatar} size={80} />
          <h2 className="sc-call-screen__name">{displayName}</h2>
          {callEndedReason && (
            <p className="sc-call-screen__reason">{callEndedReason}</p>
          )}
          <p className="sc-call-screen__timer sc-call-screen__timer--ended">
            {formattedDuration}
          </p>
          <div className="sc-call-screen__actions">
            <CallButton
              icon={FiPhone}
              label="Call Again"
              color="green"
              onClick={onEnd}
            />
            <CallButton icon={FiX} label="Close" color="default" onClick={onEnd} />
          </div>
        </div>
      </div>
    );
  }

  // Idle state — render nothing
  return null;
}
