/* ── API Types (matches existing Express backend) ── */

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "ADMIN" | "STAFF" | "AGENT" | "USER";
  isActive: boolean;
  canAccessAdminPanel?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface ChatParticipant {
  id: number;
  chatId: number;
  userId: number;
  hasSeen: boolean;
  user: User;
}

export interface Message {
  id: number;
  text: string;
  userId: number;
  chatId: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface Chat {
  id: number;
  receiver: User | null;
  participants: ChatParticipant[];
  lastMessage: string | null;
  hasSeen: boolean;
  seenBy: number[];
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface LoginPayload {
  identifier: string;
  otp?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  roleRedirect?: string;
}

export interface SocketMessagePayload {
  id: number;
  chatId: number;
  text: string;
  userId: number;
  senderName?: string;
  senderAvatar?: string | null;
  createdAt: string;
}

export interface TypingPayload {
  chatId: number;
  senderId: string;
  senderName: string;
  isTyping: boolean;
}

export type CallType = "audio" | "video";

export interface CallPayload {
  callType: CallType;
  callerId: number;
  callerName: string;
  callerAvatar?: string | null;
  receiverId: number;
  offer: RTCSessionDescriptionInit;
}

export interface CallAnswerPayload {
  callerId: number;
  answer: RTCSessionDescriptionInit;
}

export interface ICECandidatePayload {
  callerId: number;
  candidate: RTCIceCandidateInit;
}

export interface CallRejectPayload {
  callerId: number;
  receiverId: number;
}

export interface CallEndPayload {
  callerId: number;
  receiverId: number;
}