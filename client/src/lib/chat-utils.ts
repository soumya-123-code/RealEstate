// Shared client-safe utilities for the chat system.
// Database access belongs in the API/server layer, not the Vite browser bundle.

export const STAFF_ROLES = ['ADMIN', 'STAFF'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export const MAX_TEXT_LENGTH = 5000
export const DEFAULT_PAGE_SIZE = 30

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role as StaffRole)
}

export function canManageSupport(
  role: string,
  canAccessAdminPanel?: boolean,
  permissions?: string | null,
): boolean {
  if (role === 'ADMIN') return true
  if (role !== 'STAFF') return false
  const perms = safeParseJson<string[]>(permissions, [])
  return Boolean(canAccessAdminPanel || perms.includes('*') || perms.includes('SUPPORT_CHAT'))
}

export function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  if (Array.isArray(value)) return value as unknown as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function getUserSelect() {
  return {
    id: true,
    email: true,
    username: true,
    avatar: true,
    phone: true,
    role: true,
    isActive: true,
  }
}

export function formatConversation(conv: any, staffView: boolean) {
  return {
    id: conv.id,
    chatId: conv.chatId,
    customerId: conv.customerId,
    customerName: conv.customer?.username || '',
    customerEmail: conv.customer?.email || '',
    customerPhone: conv.customer?.phone || '',
    customerAvatar: conv.customer?.avatar || null,
    customer: conv.customer
      ? {
          id: conv.customer.id,
          username: conv.customer.username,
          email: conv.customer.email,
          phone: conv.customer.phone,
          avatar: conv.customer.avatar,
          isActive: conv.customer.isActive,
        }
      : null,
    assignedToId: conv.assignedToId,
    assignedTo: conv.assignedTo
      ? {
          id: conv.assignedTo.id,
          username: conv.assignedTo.username,
          email: conv.assignedTo.email,
          avatar: conv.assignedTo.avatar,
          role: conv.assignedTo.role,
        }
      : null,
    propertyId: conv.propertyId,
    property: conv.property
      ? {
          id: conv.property.id,
          title: conv.property.title,
          slug: conv.property.slug,
          city: conv.property.city,
          state: conv.property.state,
        }
      : null,
    bookingId: conv.bookingId,
    booking: conv.booking ? { id: conv.booking.id, bookingStatus: conv.booking.bookingStatus } : null,
    type: conv.type,
    status: conv.status,
    subject: conv.subject,
    customerUnreadCount: conv.customerUnreadCount,
    staffUnreadCount: conv.staffUnreadCount,
    unreadCount: staffView ? conv.staffUnreadCount : conv.customerUnreadCount,
    assignedAt: conv.assignedAt,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    lastMessage: conv.chat?.lastMessage || conv.lastMessage || null,
  }
}

export function formatMessage(m: any) {
  return {
    id: m.id,
    chatId: m.chatId,
    conversationId: m.conversationId,
    senderId: m.userId,
    text: m.text || '',
    type:
      m.meta?.attachments && safeParseJson<any[]>(m.meta.attachments, []).length > 0
        ? 'ATTACHMENT'
        : 'TEXT',
    attachments: safeParseJson<any[]>(m.meta?.attachments, []),
    readReceipts: safeParseJson<any[]>(m.meta?.readReceipts, []),
    isInternal: Boolean(m.meta?.isInternal),
    edited: Boolean(m.meta?.editedAt),
    deleted: Boolean(m.meta?.deletedAt),
    sender: m.user
      ? {
          id: m.user.id,
          username: m.user.username,
          avatar: m.user.avatar,
          role: m.user.role,
        }
      : null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }
}
