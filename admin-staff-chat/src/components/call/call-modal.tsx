"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import { cn, getInitials } from "@/lib/utils";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";

type ChatCallHelpers = {
  startCall: (type: "audio" | "video", receiverId: number, receiverName: string, receiverAvatar?: string | null) => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: (duration?: number) => void;
  getLocalStream: () => MediaStream | null;
  getRemoteStream: () => MediaStream | null;
  _onRemoteStream?: () => void;
};

function getCallHelpers(): ChatCallHelpers | undefined {
  return (window as Record<string, unknown>).__chatCall as ChatCallHelpers | undefined;
}

export function CallModal() {
  const { activeCall, callStatus, setCallStatus, setActiveCall } = useChatStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // FIX: attach streams whenever they become available
  const attachStreams = useCallback(() => {
    const helpers = getCallHelpers();
    if (!helpers) return;

    const localStream = helpers.getLocalStream();
    const remoteStream = helpers.getRemoteStream();

    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, []);

  // Attach streams when call connects
  useEffect(() => {
    if (callStatus === "connected") {
      attachStreams();

      // Register callback so socket-context can re-trigger when remote stream arrives
      const helpers = getCallHelpers();
      if (helpers) {
        helpers._onRemoteStream = attachStreams;
      }

      // Start call timer
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [callStatus, attachStreams]);

  // Also attach local stream as soon as we start ringing (local preview)
  useEffect(() => {
    if (callStatus === "ringing") {
      setTimeout(attachStreams, 300);
    }
  }, [callStatus, attachStreams]);

  // Reset on call end
  useEffect(() => {
    if (callStatus === "ended" || callStatus === "idle") {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
      setMuted(false);
      setVideoOff(false);
    }
  }, [callStatus]);

  // ── End / Reject call ──
  const endCall = () => {
    const helpers = getCallHelpers();
    if (activeCall?.isIncoming && callStatus === "ringing") {
      helpers?.rejectCall();
    } else {
      helpers?.endCall(callDuration);
    }
  };

  // ── Answer call ──
  const answerCall = () => {
    getCallHelpers()?.answerCall();
  };

  // ── Toggle mute ──
  const toggleMute = () => {
    const stream = getCallHelpers()?.getLocalStream();
    if (stream) {
      const newMuted = !muted;
      stream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
      setMuted(newMuted);
    }
  };

  // ── Toggle video ──
  const toggleVideo = () => {
    const stream = getCallHelpers()?.getLocalStream();
    if (stream) {
      const newVideoOff = !videoOff;
      stream.getVideoTracks().forEach((t) => (t.enabled = !newVideoOff));
      setVideoOff(newVideoOff);
    }
  };

  if (!activeCall) return null;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isVideo = activeCall.callType === "video";

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center">
      {/* Remote video (full screen) */}
      {isVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Remote audio (audio calls) */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Local video (picture-in-picture) */}
      {isVideo && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute bottom-28 right-4 w-32 h-44 rounded-2xl object-cover border-2 border-white/20 shadow-xl z-10",
            (videoOff || callStatus === "ringing") && "hidden"
          )}
        />
      )}

      {/* Overlay */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center text-white w-full h-full",
          isVideo
            ? "bg-gradient-to-b from-black/60 via-transparent to-black/70"
            : "bg-gradient-to-br from-slate-800 to-slate-900"
        )}
      >
        {/* Caller info */}
        <div className="absolute top-0 left-0 right-0 pt-16 flex flex-col items-center">
          <div className="relative mb-4">
            {activeCall.remoteUserAvatar ? (
              <img
                src={activeCall.remoteUserAvatar}
                alt=""
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-3xl font-bold ring-4 ring-white/20">
                {getInitials(activeCall.remoteUserName)}
              </div>
            )}
            {callStatus === "ringing" && (
              <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
            )}
          </div>

          <h2 className="text-xl font-semibold">{activeCall.remoteUserName}</h2>

          <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
            {callStatus === "ringing" ? (
              <>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
                </span>
                {activeCall.isIncoming ? "Incoming call" : "Calling"}
              </>
            ) : callStatus === "connected" ? (
              formatDuration(callDuration)
            ) : (
              "Call ended"
            )}
          </p>

          {/* Call type label */}
          <span className="mt-2 text-xs text-white/50 uppercase tracking-widest">
            {isVideo ? "Video" : "Audio"} Call
          </span>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-12 flex flex-col items-center gap-6">
          {/* Incoming ringing: Reject + Answer */}
          {activeCall.isIncoming && callStatus === "ringing" ? (
            <div className="flex items-center gap-12">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/30 transition-all active:scale-95"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-xs text-white/60">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={answerCall}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Phone className="w-6 h-6" />
                </button>
                <span className="text-xs text-white/60">Answer</span>
              </div>
            </div>
          ) : callStatus !== "ended" ? (
            /* Active call controls */
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
                    muted ? "bg-red-500/80" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <span className="text-[10px] text-white/50">{muted ? "Unmute" : "Mute"}</span>
              </div>

              {isVideo && (
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={toggleVideo}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
                      videoOff ? "bg-red-500/80" : "bg-white/10 hover:bg-white/20"
                    )}
                  >
                    {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                  <span className="text-[10px] text-white/50">{videoOff ? "Camera On" : "Camera Off"}</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/30 transition-all active:scale-95"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-[10px] text-white/50">End</span>
              </div>
            </div>
          ) : (
            /* Call ended */
            <button
              onClick={() => {
                setActiveCall(null);
                setCallStatus("idle");
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
