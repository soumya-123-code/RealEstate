// ========================================// Chat System TypeScript Interfaces
// ========================================

export type UserRole = 'ADMIN' | 'STAFF' | 'AGENT' | 'USER'

export interface User {
  id: string
  email: string
  username: string
  avatar?: string | null
  phone?: string | null
  role: UserRole
  isActive: boolean
  canAccessAdminPanel?: boolean
  permissions?: string | null
}

// Demo user from /api/users
export interface DemoUser {
  id: string
  username: string
  email: string
  role: UserRole
  avatar?: string | null
  canAccessAdminPanel?: boolean
  permissions?: string | null
}

// Chat Participant
export interface ChatParticipant {
  id: string
  chatId: string
  userId: string
  hasSeen: boolean
  createdAt: string
  user?: User
}

// Internal Chat
export interface Chat {
  id: string
  lastMessage: string | null
  createdAt: string
  updatedAt: string
  participants: ChatParticipant[]
  messageCount?: number
  messages?: Message[]
}

// Message
export interface Message {
  id: string
  chatId: string
  conversationId?: string | null
  senderId: string
  text: string
  type: 'TEXT' | 'ATTACHMENT'
  attachments: unknown[]
  readReceipts: unknown[]
  isInternal: boolean
  edited: boolean
  deleted: boolean
  sender: {
    id: string
    username: string
    avatar?: string | null
    role?: UserRole
  } | null
  createdAt: string
  updatedAt: string
}

// Conversation Types & Statuses
export type ConversationType = 'CUSTOMER_SUPPORT' | 'INTERNAL'
export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED'

// Support Conversation (list item)
export interface SupportConversation {
  id: string
  chatId: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAvatar: string | null
  customer: {
    id: string
    username: string
    email: string
    phone?: string | null
    avatar?: string | null
    isActive: boolean
  } | null
  assignedToId: string | null
  assignedTo: {
    id: string
    username: string
    email: string
    avatar?: string | null
    role?: UserRole
  } | null
  propertyId: string | null
  property: {
    id: string
    title: string
    slug: string
    city: string
    state: string
  } | null
  bookingId: string | null
  booking: {
    id: string
    bookingStatus: string
  } | null
  type: ConversationType
  status: ConversationStatus
  subject: string | null
  customerUnreadCount: number
  staffUnreadCount: number
  unreadCount: number
  assignedAt: string | null
  createdAt: string
  updatedAt: string
  lastMessage: string | null
}

// Full Support Conversation (detail view)
export interface SupportConversationDetail extends SupportConversation {
  messages: Message[]
  notes?: SupportNote[]
}

// Support Note
export interface SupportNote {
  id: string
  body: string
  pinned: boolean
  author: {
    id: string
    username: string
    email: string
    avatar?: string | null
    phone?: string | null
    role?: UserRole
    isActive: boolean
  }
  createdAt: string
  updatedAt: string
}

// Notification
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'INQUIRY' | 'BOOKING' | 'CHAT' | 'PROPERTY_UPDATE' | 'LEAD'
  isRead: boolean
  link?: string | null
  createdAt: string
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Support Stats
export interface SupportStats {
  byStatus: Record<ConversationStatus, number>
  total: number
}

// Socket Event Payloads
export interface SocketEvents {
  'onlineUsers': string[]
  'chat:message': Message
  'chat:typing': { chatId: string; userId: string }
  'support:message:new': { conversationId: string; message: Message }
  'support:typing': { conversationId: string; userId: string }
  'support:conversation:new': { id: string; customerId: string; subject: string | null }
  'support:conversation:updated': { id: string; assignedToId: string | null; assignedAt: string }
  'support:conversation:status': { id: string; status: ConversationStatus }
  'support:message:read': { conversationId: string; userId: string }
}

// API Helper - headers for demo auth
export function getAuthHeaders(user: DemoUser | null): Record<string, string> {
  if (!user) return {}
  return {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-role': user.role,
    'x-user-admin': String(user.role === 'ADMIN' || user.canAccessAdminPanel),
    'x-user-permissions': user.permissions || '',
  }
}
