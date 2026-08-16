import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

const initialState = {
  activeCall: null,       // { callType, remoteUserId, remoteUserName, remoteUserAvatar, isIncoming }
  callStatus: "idle",     // "idle" | "ringing" | "connected" | "ended"
};

function callReducer(state, action) {
  switch (action.type) {
    case "SET_ACTIVE_CALL":
      return { ...state, activeCall: action.payload };
    case "SET_CALL_STATUS":
      return { ...state, callStatus: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const CallContext = createContext(null);

export function CallContextProvider({ children }) {
  const [state, dispatch] = useReducer(callReducer, initialState);
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);

  const userId = currentUser?.id;
  const username = currentUser?.username;
  const avatar = currentUser?.avatar;

  const createPeerConnection = useCallback((remoteUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("call-ice-candidate", {
          callerId: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      dispatch({ type: "SET_CALL_STATUS", payload: "connected" });
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [userId, socket]);

  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    dispatch({ type: "SET_CALL_STATUS", payload: "ended" });
    setTimeout(() => dispatch({ type: "RESET" }), 1000);
  }, []);

  const startCall = useCallback(async (callType, receiverId, receiverName, receiverAvatar) => {
    if (!socket) return;

    const pc = createPeerConnection(receiverId);

    const constraints = callType === "video"
      ? { audio: true, video: true }
      : { audio: true, video: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      dispatch({
        type: "SET_ACTIVE_CALL",
        payload: {
          callType,
          remoteUserId: receiverId,
          remoteUserName: receiverName,
          remoteUserAvatar: receiverAvatar || null,
          isIncoming: false,
        },
      });
      dispatch({ type: "SET_CALL_STATUS", payload: "ringing" });

      socket.emit("call-offer", {
        callType,
        callerId: userId,
        callerName: username,
        callerAvatar: avatar || null,
        receiverId,
        offer: pc.localDescription,
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      cleanupCall();
    }
  }, [socket, userId, username, avatar, createPeerConnection, cleanupCall]);

  const answerCall = useCallback(async () => {
    if (!socket || !pendingOfferRef.current) return;

    const { remoteUserId, callType } = pendingOfferRef.current;
    const pc = createPeerConnection(remoteUserId);

    const constraints = callType === "video"
      ? { audio: true, video: true }
      : { audio: true, video: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(
        new RTCSessionDescription(pendingOfferRef.current.offer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call-answer", {
        callerId: remoteUserId,
        answer: pc.localDescription,
      });

      dispatch({ type: "SET_CALL_STATUS", payload: "connected" });
    } catch (err) {
      console.error("Failed to answer call:", err);
      cleanupCall();
    }
  }, [socket, createPeerConnection, cleanupCall]);

  const rejectCall = useCallback(() => {
    if (!socket || !state.activeCall) return;
    socket.emit("call-reject", {
      callerId: state.activeCall.remoteUserId,
      receiverId: userId,
    });
    cleanupCall();
  }, [socket, userId, state.activeCall, cleanupCall]);

  const endCall = useCallback(() => {
    if (!socket || !state.activeCall) return;
    socket.emit("call-end", {
      callerId: userId,
      receiverId: state.activeCall.remoteUserId,
    });
    cleanupCall();
  }, [socket, userId, state.activeCall, cleanupCall]);

  // ── Socket listeners for incoming call events ──
  useEffect(() => {
    if (!socket) return;

    const handleOffer = (data) => {
      pendingOfferRef.current = {
        offer: data.offer,
        remoteUserId: data.callerId,
        callType: data.callType,
      };
      dispatch({
        type: "SET_ACTIVE_CALL",
        payload: {
          callType: data.callType,
          remoteUserId: data.callerId,
          remoteUserName: data.callerName || "Unknown",
          remoteUserAvatar: data.callerAvatar || null,
          isIncoming: true,
        },
      });
      dispatch({ type: "SET_CALL_STATUS", payload: "ringing" });
    };

    const handleAnswer = async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        dispatch({ type: "SET_CALL_STATUS", payload: "connected" });
      }
    };

    const handleIceCandidate = async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    };

    const handleReject = () => cleanupCall();
    const handleEnd = () => cleanupCall();

    socket.on("call-offer", handleOffer);
    socket.on("call-answer", handleAnswer);
    socket.on("call-ice-candidate", handleIceCandidate);
    socket.on("call-reject", handleReject);
    socket.on("call-end", handleEnd);

    return () => {
      socket.off("call-offer", handleOffer);
      socket.off("call-answer", handleAnswer);
      socket.off("call-ice-candidate", handleIceCandidate);
      socket.off("call-reject", handleReject);
      socket.off("call-end", handleEnd);
    };
  }, [socket, cleanupCall]);

  const value = {
    activeCall: state.activeCall,
    callStatus: state.callStatus,
    setActiveCall: (call) => dispatch({ type: "SET_ACTIVE_CALL", payload: call }),
    setCallStatus: (status) => dispatch({ type: "SET_CALL_STATUS", payload: status }),
    startCall,
    answerCall,
    rejectCall,
    endCall,
    getLocalStream: () => localStreamRef.current,
    getRemoteStream: () => remoteStreamRef.current,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a <CallContextProvider>");
  }
  return context;
}

export default CallContext;