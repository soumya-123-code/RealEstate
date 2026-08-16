import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useSupportSocket } from "../context/SupportSocketContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const hasWebRTCSupport = () => {
  return typeof window !== "undefined" && !!window.RTCPeerConnection;
};

export default function useWebRTC() {
  const { socket } = useSocket();
  const { currentUser } = useAuth();
  const {
    incomingCall,
    clearIncomingCall,
    sendCallOffer,
    sendCallAnswer,
    sendICECandidate,
    sendCallReject,
    sendCallEnd,
  } = useSupportSocket();

  const [callState, setCallState] = useState("idle"); // idle | incoming | outgoing | active | ended
  const [callInfo, setCallInfo] = useState(null);
  const [callType, setCallType] = useState("audio"); // audio | video
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callEndedReason, setCallEndedReason] = useState("");

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const callStateRef = useRef("idle");
  callStateRef.current = callState;

  // ── Cleanup resources ──────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, []);

  // ── Create peer connection ──────────────────────────────────────────────
  const createPeerConnection = useCallback(
    (targetUserId, conversationId) => {
      if (!hasWebRTCSupport()) {
        toast.error("WebRTC is not supported in this browser");
        return null;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendICECandidate({
            targetUserId,
            conversationId,
            candidate: event.candidate,
          });
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
          case "connected":
            // Call is now active
            break;
          case "disconnected":
          case "failed":
          case "closed":
            if (callStateRef.current === "active") {
              endCall("Connection lost");
            }
            break;
          default:
            break;
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [sendICECandidate]
  );

  // ── Get media stream ────────────────────────────────────────────────────
  const getMediaStream = useCallback(async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === "video"
          ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("getMediaStream error:", err);

      // Try audio only if video fails
      if (type === "video") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          setIsCameraOff(true);
          toast("Camera not available, using audio only");
          return stream;
        } catch (_) {
          toast.error("Could not access microphone");
          return null;
        }
      }

      toast.error("Could not access microphone");
      return null;
    }
  }, []);

  // ── Start duration timer ─────────────────────────────────────────────────
  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    const startTime = Date.now();

    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(elapsed);
    }, 1000);
  }, []);

  // ── Initiate audio call ──────────────────────────────────────────────────
  const initiateAudioCall = useCallback(
    async (targetUserId, conversationId, targetName, targetAvatar) => {
      if (!hasWebRTCSupport()) {
        toast.error("Video/audio calls are not supported in this browser");
        return;
      }

      const stream = await getMediaStream("audio");
      if (!stream) return;

      setCallType("audio");
      setCallState("outgoing");
      setCallInfo({
        targetUserId,
        conversationId,
        targetName: targetName || "Customer",
        targetAvatar: targetAvatar || null,
      });

      const pc = createPeerConnection(targetUserId, conversationId);
      if (!pc) {
        cleanup();
        return;
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendCallOffer({
          targetUserId,
          conversationId,
          callType: "audio",
          signal: { type: "offer", sdp: offer },
          from: currentUser.id,
          callerName: currentUser.username,
          callerAvatar: currentUser.avatar || null,
        });
      } catch (err) {
        console.error("initiateAudioCall error:", err);
        cleanup();
        toast.error("Failed to start call");
        setCallState("idle");
      }
    },
    [currentUser, getMediaStream, createPeerConnection, sendCallOffer, cleanup]
  );

  // ── Initiate video call ──────────────────────────────────────────────────
  const initiateVideoCall = useCallback(
    async (targetUserId, conversationId, targetName, targetAvatar) => {
      if (!hasWebRTCSupport()) {
        toast.error("Video/audio calls are not supported in this browser");
        return;
      }

      const stream = await getMediaStream("video");
      if (!stream) return;

      setCallType("video");
      setCallState("outgoing");
      setCallInfo({
        targetUserId,
        conversationId,
        targetName: targetName || "Customer",
        targetAvatar: targetAvatar || null,
      });

      const pc = createPeerConnection(targetUserId, conversationId);
      if (!pc) {
        cleanup();
        return;
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendCallOffer({
          targetUserId,
          conversationId,
          callType: "video",
          signal: { type: "offer", sdp: offer },
          from: currentUser.id,
          callerName: currentUser.username,
          callerAvatar: currentUser.avatar || null,
        });
      } catch (err) {
        console.error("initiateVideoCall error:", err);
        cleanup();
        toast.error("Failed to start call");
        setCallState("idle");
      }
    },
    [currentUser, getMediaStream, createPeerConnection, sendCallOffer, cleanup]
  );

  // ── Accept incoming call ─────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const stream = await getMediaStream(incomingCall.type);
    if (!stream) {
      rejectCall();
      return;
    }

    setCallType(incomingCall.type);
    setCallState("active");
    setCallInfo({
      targetUserId: incomingCall.from,
      conversationId: incomingCall.conversationId,
      targetName: incomingCall.callerName || "Unknown",
      targetAvatar: incomingCall.callerAvatar || null,
    });

    clearIncomingCall();
    startDurationTimer();

    const pc = createPeerConnection(incomingCall.from, incomingCall.conversationId);
    if (!pc) {
      cleanup();
      setCallState("idle");
      return;
    }

    try {
      if (incomingCall.signal?.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendCallAnswer({
          targetUserId: incomingCall.from,
          conversationId: incomingCall.conversationId,
          signal: { type: "answer", sdp: answer },
        });
      }
    } catch (err) {
      console.error("acceptCall error:", err);
      cleanup();
      setCallState("idle");
      toast.error("Failed to accept call");
    }
  }, [incomingCall, getMediaStream, createPeerConnection, sendCallAnswer, clearIncomingCall, startDurationTimer, cleanup]);

  // ── Reject incoming call ────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (incomingCall) {
      sendCallReject({
        targetUserId: incomingCall.from,
        conversationId: incomingCall.conversationId,
      });
      clearIncomingCall();
    }
    setCallState("idle");
    cleanup();
  }, [incomingCall, sendCallReject, clearIncomingCall, cleanup]);

  // ── End call ─────────────────────────────────────────────────────────────
  const endCall = useCallback(
    (reason = "") => {
      if (callInfo) {
        sendCallEnd({
          targetUserId: callInfo.targetUserId,
          conversationId: callInfo.conversationId,
          duration: callDuration,
        });
      }

      setCallState("ended");
      setCallEndedReason(reason);
      cleanup();

      // Auto-close ended screen after 5s
      setTimeout(() => {
        setCallState("idle");
        setCallInfo(null);
        setCallEndedReason("");
      }, 5000);
    },
    [callInfo, callDuration, sendCallEnd, cleanup]
  );

  // ── Toggle mute ──────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // ── Toggle camera ────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  // ── Switch camera (mobile) ────────────────────────────────────────────────
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const track = videoTracks[0];
    const currentFacingMode = track.getSettings().facingMode;
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";

    try {
      // Stop current video track and get new one
      track.stop();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      const newTrack = newStream.getVideoTracks()[0];
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }

      // Replace track in local stream
      localStreamRef.current.removeTrack(track);
      localStreamRef.current.addTrack(newTrack);
    } catch (err) {
      console.error("switchCamera error:", err);
      toast.error("Failed to switch camera");
    }
  }, []);

  // ── Handle incoming socket signals ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onCallAnswer = async (data) => {
      if (!peerConnectionRef.current) return;

      try {
        if (data.signal?.type === "answer") {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.signal)
          );
          setCallState("active");
          startDurationTimer();
        }
      } catch (err) {
        console.error("onCallAnswer error:", err);
        cleanup();
        setCallState("idle");
      }
    };

    const onICECandidate = async (data) => {
      if (!peerConnectionRef.current || !data.candidate) return;

      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (err) {
        console.error("onICECandidate error:", err);
      }
    };

    const onCallRejected = () => {
      cleanup();
      setCallState("idle");
      setCallInfo(null);
      toast("Call rejected", { icon: "📞" });
    };

    const onCallEndedByRemote = () => {
      cleanup();
      setCallState("ended");
      setCallEndedReason("Call ended by remote party");
      setTimeout(() => {
        setCallState("idle");
        setCallInfo(null);
        setCallEndedReason("");
      }, 5000);
    };

    socket.on("call:answer", onCallAnswer);
    socket.on("call:ice-candidate", onICECandidate);
    socket.on("call:reject", onCallRejected);
    socket.on("call:end", onCallEndedByRemote);

    return () => {
      socket.off("call:answer", onCallAnswer);
      socket.off("call:ice-candidate", onICECandidate);
      socket.off("call:reject", onCallRejected);
      socket.off("call:end", onCallEndedByRemote);
    };
  }, [socket, cleanup, startDurationTimer]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ── Format duration ──────────────────────────────────────────────────────
  const formattedDuration = (() => {
    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  })();

  return {
    // State
    callState,
    callInfo,
    callType,
    callDuration,
    formattedDuration,
    isMuted,
    isCameraOff,
    callEndedReason,
    incomingCall,
    hasWebRTC: hasWebRTCSupport(),

    // Refs for video elements
    localStreamRef,
    remoteStreamRef,

    // Actions
    initiateAudioCall,
    initiateVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  };
}
