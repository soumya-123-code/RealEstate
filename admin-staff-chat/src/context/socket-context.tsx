"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { chatApi } from "@/lib/api";
import type {
  SocketMessagePayload,
  TypingPayload,
} from "@/lib/types";

// ─── Types for the WebRTC socket events ──────────────────────────
interface IncomingCallPayload {
  callerId: string;
  callerSocketId: string;
  callerName: string;
  callerAvatar: string | null;
  offer: RTCSessionDescriptionInit;
  callType: "audio" | "video";
  chatId?: number;
}

interface CallAnswerPayload {
  answererId: string;
  answer: RTCSessionDescriptionInit;
}

interface IcePayload {
  fromUserId: string;
  candidate: RTCIceCandidateInit;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    addMessage,
    setTyping,
    setOnlineUsers,
    updateChatInList,
    setActiveCall,
    setCallStatus,
    setChats,
  } = useChatStore();

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  // Store the pending offer from an incoming call so answerCall() can use it
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  // Store caller id so we know where to send our answer
  const callerIdRef = useRef<string | null>(null);

  // ── WebRTC helpers ──────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    // Close any existing connection first
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && currentUser) {
        // FIX: Send to callerIdRef (for answerer) or to active call's remoteUserId (for caller)
        const { activeCall } = useChatStore.getState();
        const targetId = callerIdRef.current || activeCall?.remoteUserId?.toString();
        if (targetId) {
          const socket = connectSocket(currentUser.id);
          socket.emit("call-ice-candidate", {
            targetUserId: targetId,
            candidate: event.candidate.toJSON(),
          });
        }
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0] || null;
      // Trigger re-attach in modal
      const helpers = (window as Record<string, unknown>).__chatCall as Record<string, unknown> | undefined;
      if (helpers && typeof helpers._onRemoteStream === "function") {
        (helpers._onRemoteStream as () => void)();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    callerIdRef.current = null;
    setCallStatus("ended");
    setTimeout(() => {
      setActiveCall(null);
      setCallStatus("idle");
    }, 1500);
  }, [setActiveCall, setCallStatus]);

  // ── Connect socket once when user logs in ───────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const socket = connectSocket(currentUser.id);

    // Online users list
    socket.on("getOnlineUsers", (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    // Incoming chat message
    socket.on("getMessage", (data: SocketMessagePayload) => {
      const msg = {
        id: data.id,
        text: data.text,
        userId: data.userId,
        chatId: data.chatId,
        createdAt: data.createdAt,
        user: {
          id: data.userId,
          username: data.senderName || "Unknown",
          avatar: data.senderAvatar || undefined,
        },
      };

      // Only add to messages if this is the open chat
      const { activeChatId } = useChatStore.getState();
      if (activeChatId === data.chatId) {
        addMessage(msg);
      }

      // Update sidebar (last message + unseen)
      updateChatInList(data.chatId, {
        lastMessage: data.text,
        updatedAt: new Date().toISOString(),
        hasSeen: activeChatId === data.chatId,
      });

      // Notification sound for other chats
      if (activeChatId !== data.chatId) {
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }

      // Refresh chat list for updated unread counts
      chatApi.list().then(setChats).catch(console.error);
    });

    // Typing indicator
    socket.on("userTyping", (data: TypingPayload) => {
      setTyping(data);
    });

    // ── Incoming call ─────────────────────────────────────────────
    socket.on("incoming-call", (data: IncomingCallPayload) => {
      console.log("[Socket] Incoming call from:", data.callerId, data.callType);
      // Store the offer and caller id for when the user answers
      pendingOfferRef.current = data.offer;
      callerIdRef.current = data.callerId;

      setActiveCall({
        callType: data.callType,
        remoteUserId: Number(data.callerId),
        remoteUserName: data.callerName,
        remoteUserAvatar: data.callerAvatar,
        isIncoming: true,
      });
      setCallStatus("ringing");
    });

    // ── Call answer received (caller side) ────────────────────────
    socket.on("call-answer", async (data: CallAnswerPayload) => {
      console.log("[Socket] Call answer received from:", data.answererId);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setCallStatus("connected");
        } catch (err) {
          console.error("[WebRTC] Failed to set remote description:", err);
        }
      }
    });

    // ── ICE candidate received ────────────────────────────────────
    socket.on("call-ice-candidate", async (data: IcePayload) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (err) {
          console.warn("[WebRTC] Failed to add ICE candidate:", err);
        }
      }
    });

    // ── Call rejected ─────────────────────────────────────────────
    socket.on("call-rejected", () => {
      console.log("[Socket] Call was rejected");
      cleanupCall();
    });

    // ── Call ended ────────────────────────────────────────────────
    socket.on("call-ended", () => {
      console.log("[Socket] Call ended by remote");
      cleanupCall();
    });

    // ── Remote user disconnected mid-call ─────────────────────────
    socket.on("call-user-offline", () => {
      console.log("[Socket] Call target is offline");
      cleanupCall();
    });

    socket.on("call-user-disconnected", () => {
      // Only cleanup if we're in an active call
      const { callStatus } = useChatStore.getState();
      if (callStatus !== "idle") {
        cleanupCall();
      }
    });

    return () => {
      socket.off("getOnlineUsers");
      socket.off("getMessage");
      socket.off("userTyping");
      socket.off("incoming-call");
      socket.off("call-answer");
      socket.off("call-ice-candidate");
      socket.off("call-rejected");
      socket.off("call-ended");
      socket.off("call-user-offline");
      socket.off("call-user-disconnected");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // FIX: only re-run when user changes, not on every activeChatId change

  // ── Expose call API to components via window.__chatCall ─────────
  useEffect(() => {
    if (typeof window === "undefined" || !currentUser) return;

    (window as Record<string, unknown>).__chatCall = {
      // ── Outgoing call ───────────────────────────────────────────
      startCall: async (
        callType: "audio" | "video",
        receiverId: number,
        receiverName: string,
        receiverAvatar?: string | null
      ) => {
        const socket = connectSocket(currentUser.id);
        const pc = createPeerConnection();

        const constraints: MediaStreamConstraints =
          callType === "video"
            ? { audio: true, video: { width: 1280, height: 720 } }
            : { audio: true, video: false };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          localStreamRef.current = stream;
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          setActiveCall({
            callType,
            remoteUserId: receiverId,
            remoteUserName: receiverName,
            remoteUserAvatar: receiverAvatar,
            isIncoming: false,
          });
          setCallStatus("ringing");

          // FIX: use correct event name and payload shape that server expects
          socket.emit("call-offer", {
            targetUserId: String(receiverId),
            offer: pc.localDescription,
            callType,
            callerName: currentUser.username,
            callerAvatar: currentUser.avatar || null,
          });
        } catch (err) {
          console.error("[WebRTC] Failed to start call:", err);
          cleanupCall();
        }
      },

      // ── Answer incoming call ────────────────────────────────────
      answerCall: async () => {
        if (!pendingOfferRef.current || !callerIdRef.current) {
          console.error("[WebRTC] No pending offer to answer");
          return;
        }

        const socket = connectSocket(currentUser.id);
        const { activeCall } = useChatStore.getState();
        if (!activeCall) return;

        const pc = createPeerConnection();
        const constraints: MediaStreamConstraints =
          activeCall.callType === "video"
            ? { audio: true, video: { width: 1280, height: 720 } }
            : { audio: true, video: false };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          localStreamRef.current = stream;
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          // FIX: Set remote description from stored offer BEFORE creating answer
          await pc.setRemoteDescription(
            new RTCSessionDescription(pendingOfferRef.current)
          );

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // FIX: use correct event payload shape
          socket.emit("call-answer", {
            targetUserId: callerIdRef.current,
            answer: pc.localDescription,
          });

          setCallStatus("connected");
        } catch (err) {
          console.error("[WebRTC] Failed to answer call:", err);
          cleanupCall();
        }
      },

      // ── Reject incoming call ────────────────────────────────────
      rejectCall: () => {
        const socket = connectSocket(currentUser.id);
        const callerId = callerIdRef.current;
        if (callerId) {
          socket.emit("call-reject", { targetUserId: callerId });
        }
        cleanupCall();
      },

      // ── End active call ─────────────────────────────────────────
      endCall: () => {
        const socket = connectSocket(currentUser.id);
        const { activeCall } = useChatStore.getState();
        if (!activeCall) return;

        // Determine who to notify
        const targetId = activeCall.isIncoming
          ? callerIdRef.current || String(activeCall.remoteUserId)
          : String(activeCall.remoteUserId);

        socket.emit("call-end", {
          targetUserId: targetId,
          callerId: currentUser.id,
          receiverId: activeCall.remoteUserId,
          callType: activeCall.callType,
          duration: 0, // Will be calculated properly by component
        });
        cleanupCall();
      },

      // ── Stream accessors for the modal ──────────────────────────
      getLocalStream: () => localStreamRef.current,
      getRemoteStream: () => remoteStreamRef.current,
    };

    return () => {
      delete (window as Record<string, unknown>).__chatCall;
    };
  }, [currentUser, createPeerConnection, cleanupCall, setActiveCall, setCallStatus]);

  return <>{children}</>;
}
