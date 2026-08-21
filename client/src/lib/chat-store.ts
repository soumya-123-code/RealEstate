import { create } from 'zustand'
import socketClient from './socket-client'
import type {
  DemoUser,
  SupportConversation,
  SupportConversationDetail,
  Message,
  Chat,
  SupportNote,
  SupportStats,
  ConversationStatus,
  PaginatedResponse,
  User,
} from './chat-types'
import { getAuthHeaders } from './chat-types'

// ========================================
// Helper: API fetch with auth headers
// ========================================
async function apiFetch<T>(
  url: string,
  user: DemoUser | null,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(user),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ========================================
// Store State Shape
// ========================================

interface SupportState {
  conversations: SupportConversation[]
  activeConversationId: string | null
  activeConversation: SupportConversationDetail | null
  messages: Message[]
  notes: SupportNote[]
  stats: SupportStats | null
  staffList: User[]
  loading: boolean
  loadingMessages: boolean
  loadingDetail: boolean
  filters: {
    status: ConversationStatus | ''
    search: string
    assignedToId: string
  }
  page: number
  totalPages: number
  total: number
}

interface InternalChatState {
  chats: Chat[]
  activeChatId: string | null
  activeChat: Chat | null
  messages: Message[]
  loading: boolean
  loadingMessages: boolean
}

interface ChatStore {
  // Current demo user
  currentUser: DemoUser | null
  allUsers: DemoUser[]

  // Support conversations
  support: SupportState

  // Internal chats
  internal: InternalChatState

  // Online users
  onlineUsers: Set<string>

  // Typing indicators: conversationId/chatId -> { userId, timestamp }
  typingIndicators: Map<string, { userId: string; username: string; timestamp: number }>

  // Socket connected
  socketConnected: boolean

  // ---- Actions ----

  // User management
  setCurrentUser: (user: DemoUser | null) => void
  fetchAllUsers: () => Promise<void>

  // Support actions
  fetchSupportConversations: (page?: number) => Promise<void>
  fetchSupportDetail: (conversationId: string) => Promise<void>
  createSupportConversation: (data: { subject?: string; message: string; propertyId?: string; bookingId?: string }) => Promise<SupportConversation>
  sendSupportMessage: (conversationId: string, text: string, isInternal?: boolean) => Promise<Message>
  assignConversation: (conversationId: string, staffId: string) => Promise<void>
  updateConversationStatus: (conversationId: string, status: ConversationStatus) => Promise<void>
  fetchNotes: (conversationId: string) => Promise<void>
  addNote: (conversationId: string, body: string, pinned?: boolean) => Promise<void>
  fetchSupportStats: () => Promise<void>
  fetchStaffList: () => Promise<void>
  setSupportFilter: (key: string, value: string) => void
  setActiveSupportConversation: (id: string | null) => void

  // Internal chat actions
  fetchInternalChats: () => Promise<void>
  createInternalChat: (otherUserId: string) => Promise<Chat>
  fetchInternalChat: (chatId: string) => Promise<void>
  sendInternalMessage: (chatId: string, text: string) => Promise<Message>
  markInternalRead: (chatId: string) => Promise<void>
  setActiveInternalChat: (id: string | null) => void

  // Socket
  initSocket: () => void
  disconnectSocket: () => void

  // Typing
  emitTyping: (conversationIdOrChatId: string, type: 'support' | 'chat') => void
}

// ========================================
// Initial States
// ========================================

const initialSupportState: SupportState = {
  conversations: [],
  activeConversationId: null,
  activeConversation: null,
  messages: [],
  notes: [],
  stats: null,
  staffList: [],
  loading: false,
  loadingMessages: false,
  loadingDetail: false,
  filters: {
    status: '',
    search: '',
    assignedToId: '',
  },
  page: 1,
  totalPages: 1,
  total: 0,
}

const initialInternalState: InternalChatState = {
  chats: [],
  activeChatId: null,
  activeChat: null,
  messages: [],
  loading: false,
  loadingMessages: false,
}

// ========================================
// Store
// ========================================

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: null,
  allUsers: [],
  support: { ...initialSupportState },
  internal: { ...initialInternalState },
  onlineUsers: new Set(),
  typingIndicators: new Map(),
  socketConnected: false,

  // ---- User Management ----

  setCurrentUser: (user) => {
    const prev = get().currentUser
    set({
      currentUser: user,
      support: { ...initialSupportState },
      internal: { ...initialInternalState },
      typingIndicators: new Map(),
    })
    if (user) {
      get().initSocket()
      // Load data based on role
      if (user.role === 'USER' || user.role === 'AGENT') {
        get().fetchSupportConversations()
      } else {
        get().fetchSupportConversations()
        get().fetchSupportStats()
        get().fetchStaffList()
        get().fetchInternalChats()
      }
    } else if (prev) {
      get().disconnectSocket()
    }
  },

  fetchAllUsers: async () => {
    try {
      const users = await apiFetch<DemoUser[]>('/api/users', null)
      set({ allUsers: users })
    } catch (err) {
      console.error('[Store] Failed to fetch users:', err)
    }
  },

  // ---- Support Actions ----

  fetchSupportConversations: async (page = 1) => {
    const { currentUser, support } = get()
    if (!currentUser) return
    set((s) => ({ support: { ...s.support, loading: true, page } }))
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (support.filters.status) params.set('status', support.filters.status)
      if (support.filters.search) params.set('search', support.filters.search)
      if (support.filters.assignedToId) params.set('assignedToId', support.filters.assignedToId)
      const res = await apiFetch<PaginatedResponse<SupportConversation>>(
        `/api/support/conversations?${params}`,
        currentUser
      )
      set((s) => ({
        support: {
          ...s.support,
          conversations: res.data,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
          loading: false,
        },
      }))
    } catch (err) {
      console.error('[Store] Failed to fetch conversations:', err)
      set((s) => ({ support: { ...s.support, loading: false } }))
    }
  },

  fetchSupportDetail: async (conversationId) => {
    const { currentUser } = get()
    if (!currentUser) return
    set((s) => ({ support: { ...s.support, loadingDetail: true } }))
    try {
      const detail = await apiFetch<SupportConversationDetail>(
        `/api/support/conversations/${conversationId}`,
        currentUser
      )
      set((s) => ({
        support: {
          ...s.support,
          activeConversationId: conversationId,
          activeConversation: detail,
          messages: detail.messages,
          notes: detail.notes || [],
          loadingDetail: false,
        },
      }))
    } catch (err) {
      console.error('[Store] Failed to fetch conversation detail:', err)
      set((s) => ({ support: { ...s.support, loadingDetail: false } }))
    }
  },

  createSupportConversation: async (data) => {
    const { currentUser } = get()
    if (!currentUser) throw new Error('No user')
    const conv = await apiFetch<SupportConversation>(
      '/api/support/conversations',
      currentUser,
      { method: 'POST', body: JSON.stringify(data) }
    )
    // Refresh the list
    get().fetchSupportConversations(1)
    // Open the new conversation
    get().fetchSupportDetail(conv.id)
    return conv
  },

  sendSupportMessage: async (conversationId, text, isInternal = false) => {
    const { currentUser } = get()
    if (!currentUser) throw new Error('No user')
    const msg = await apiFetch<Message>(
      `/api/support/conversations/${conversationId}/messages`,
      currentUser,
      { method: 'POST', body: JSON.stringify({ text, isInternal }) }
    )
    // Optimistically add to messages
    set((s) => ({
      support: {
        ...s.support,
        messages: [...s.support.messages, msg],
      },
    }))
    return msg
  },

  assignConversation: async (conversationId, staffId) => {
    const { currentUser } = get()
    if (!currentUser) throw new Error('No user')
    const updated = await apiFetch<SupportConversation>(
      `/api/support/conversations/${conversationId}/assign`,
      currentUser,
      { method: 'POST', body: JSON.stringify({ staffId }) }
    )
    // Update in state
    set((s) => ({
      support: {
        ...s.support,
        activeConversation: updated ? { ...s.support.activeConversation!, ...updated } : s.support.activeConversation,
        conversations: s.support.conversations.map((c) =>
          c.id === conversationId ? { ...c, assignedToId: staffId, assignedTo: updated?.assignedTo || null } : c
        ),
      },
    }))
  },

  updateConversationStatus: async (conversationId, status) => {
    const { currentUser } = get()
    if (!currentUser) throw new Error('No user')
    const updated = await apiFetch<SupportConversation>(
      `/api/support/conversations/${conversationId}/status`,
      currentUser,
      { method: 'POST', body: JSON.stringify({ status }) }
    )
    set((s) => ({
      support: {
        ...s.support,
        activeConversation: updated ? { ...s.support.activeConversation!, ...updated } : s.support.activeConversation,
        conversations: s.support.conversations.map((c) =>
          c.id === conversationId ? { ...c, status } : c
        ),
      },
    }))
    // Refresh stats
    get().fetchSupportStats()
  },

  fetchNotes: async (conversationId) => {
    const { currentUser } = get()
    if (!currentUser) return
    try {
      const notes = await apiFetch<SupportNote[]>(
        `/api/support/conversations/${conversationId}/notes`,
        currentUser
      )
      set((s) => ({ support: { ...s.support, notes } }))
    } catch (err) {
      console.error('[Store] Failed to fetch notes:', err)
    }
  },

  addNote: async (conversationId, body, pinned = false) => {
    const { currentUser } = get()
    if (!currentUser) throw new Error('No user')
    const note = await apiFetch<SupportNote>(
      `/api/support/conversations/${conversationId}/notes`,
      currentUser,
      { method: 'POST', body: JSON.stringify({ body, pinned }) }
    )
    set((s) => ({
      support: {
        ...s.support,
        notes: [note, ...s.support.notes],
      },
    }))
  },

  fetchSupportStats: async () => {
    const { currentUser } = get()
    if (!currentUser) return
    try {
      const stats = await apiFetch<SupportStats>('/api/support/stats', currentUser)
      set((s) => ({ support: { ...s.support, stats } }))
    } catch (err) {
      console.error('[Store] Failed to fetch stats:', err)
    }
  },

  fetchStaffList: async () => {
    const { currentUser } = get()
    if (!currentUser) return
    try {
      const staff = await apiFetch<User[]>('/api/support/staff', currentUser)
      set((s) => ({ support: { ...s.support, staffList: staff } }))
    } catch (err) {
      console.error('[Store] Failed to fetch staff list:', err)
    }
  },

  setSupportFilter: (key, value) => {
    set((s) => ({
      support: {
        ...s.support,
        filters: { ...s.support.filters, [key]: value },
        page: 1,
      },
    }))
    get().fetchSupportConversations(1)
  },

  setActiveSupportConversation: (id) => {
    set((s) => ({ support: { ...s.support, activeConversationId: id } }))
    if (id) {
      get().fetchSupportDetail(id)
    } else {
      set((s) => ({
        support: { ...s.support, activeConversation: null, messages: [], notes: [] },
      }))
    }
  },

  // ---- Internal Chat Actions ----

  fetchInternalChats: async () => {
    const { currentUser } = get()
    if (!currentUser) return
    set((s) => ({ internal: { ...s.internal, loading: true } }))
    try {
      const chats = await apiFetch<Chat[]>('/api/chat', currentUser)
      set((s) => ({ internal: { ...s.internal, chats, loading: false } }))
    } catch (err) {
      console.error('[Store] Failed to fetch internal chats:', err)
      set((s) => ({ internal: { ...s.internal, loading: false } }))
    }
  },

  createInternalChat: async (otherUserId) => {
    const { currentUser } = get()
    if (!currentUser) throw new Error('No user')
    const chat = await apiFetch<Chat>('/api/chat', currentUser, {
      method: 'POST',
      body: JSON.stringify({ userId: otherUserId }),
    })
    // Refresh list
    get().fetchInternalChats()
    return chat
  },

  fetchInternalChat: async (chatId) => {
    const { currentUser } = get()
    if (!currentUser) return
    set((s) => ({ internal: { ...s.internal, loadingMessages: true } }))
    try {
      const chat = await apiFetch<Chat>(`/api/chat/${chatId}`, currentUser)
      set((s) => ({
        internal: {
          ...s.internal,
          activeChatId: chatId,
          activeChat: chat,
          messages: chat.messages || [],
          loadingMessages: false,
        },
      }))
      // Mark as read
      get().markInternalRead(chatId)
    } catch (err) {
      console.error('[Store] Failed to fetch internal chat:', err)
      set((s) => ({ internal: { ...s.internal, loadingMessages: false } }))
    }
  },

  sendInternalMessage: async (chatId, text) => {
    const { currentUser } = get()
    if (!currentUser) throw new Error('No user')
    const msg = await apiFetch<Message>(
      `/api/chat/${chatId}/messages`,
      currentUser,
      { method: 'POST', body: JSON.stringify({ text }) }
    )
    set((s) => ({
      internal: {
        ...s.internal,
        messages: [...s.internal.messages, msg],
      },
    }))
    return msg
  },

  markInternalRead: async (chatId) => {
    const { currentUser } = get()
    if (!currentUser) return
    try {
      await apiFetch(`/api/chat/${chatId}/read`, currentUser, { method: 'POST' })
    } catch {
      // Silently fail
    }
  },

  setActiveInternalChat: (id) => {
    set((s) => ({ internal: { ...s.internal, activeChatId: id } }))
    if (id) {
      get().fetchInternalChat(id)
    } else {
      set((s) => ({
        internal: { ...s.internal, activeChat: null, messages: [] },
      }))
    }
  },

  // ---- Socket ----

  initSocket: () => {
    const { currentUser } = get()
    if (!currentUser) return

    const socket = socketClient.connect(currentUser.id)
    set({ socketConnected: true })

    // Online users
    socketClient.on('onlineUsers', (userIds: unknown) => {
      set({ onlineUsers: new Set(userIds as string[]) })
    })

    // Internal chat message
    socketClient.on('chat:message', (msg: unknown) => {
      const message = msg as Message
      const { internal } = get()
      // If we're viewing this chat, append the message
      if (internal.activeChatId === message.chatId) {
        set((s) => ({
          internal: {
            ...s.internal,
            messages: [...s.internal.messages, message],
          },
        }))
        // Mark as read
        get().markInternalRead(message.chatId)
      }
      // Refresh chat list to update lastMessage
      get().fetchInternalChats()
    })

    // Support message new
    socketClient.on('support:message:new', (payload: unknown) => {
      const { conversationId, message } = payload as { conversationId: string; message: Message }
      const { support, currentUser: user } = get()
      if (support.activeConversationId === conversationId && user) {
        // Don't add our own messages (they're already added optimistically)
        if (message.senderId !== user.id) {
          set((s) => ({
            support: {
              ...s.support,
              messages: [...s.support.messages, message],
            },
          }))
        }
      }
      // Refresh conversation list
      get().fetchSupportConversations(support.page)
    })

    // Support typing
    socketClient.on('support:typing', (payload: unknown) => {
      const { conversationId, userId } = payload as { conversationId: string; userId: string }
      const { allUsers } = get()
      const user = allUsers.find((u) => u.id === userId)
      if (user) {
        set((s) => {
          const newMap = new Map(s.typingIndicators)
          newMap.set(conversationId, { userId, username: user.username, timestamp: Date.now() })
          return { typingIndicators: newMap }
        })
        // Auto-clear after 3s
        setTimeout(() => {
          set((s) => {
            const newMap = new Map(s.typingIndicators)
            const existing = newMap.get(conversationId)
            if (existing && existing.userId === userId) {
              newMap.delete(conversationId)
            }
            return { typingIndicators: newMap }
          })
        }, 3000)
      }
    })

    // New support conversation (for staff)
    socketClient.on('support:conversation:new', () => {
      const { currentUser: user } = get()
      if (user && (user.role === 'ADMIN' || user.role === 'STAFF')) {
        get().fetchSupportConversations(get().support.page)
        get().fetchSupportStats()
      }
    })

    // Conversation updated (assignment etc.)
    socketClient.on('support:conversation:updated', (payload: unknown) => {
      const { id, assignedToId, assignedAt } = payload as { id: string; assignedToId: string | null; assignedAt: string }
      const { support } = get()
      if (support.activeConversationId === id) {
        set((s) => ({
          support: {
            ...s.support,
            activeConversation: s.support.activeConversation
              ? { ...s.support.activeConversation, assignedToId, assignedAt: new Date(assignedAt) }
              : null,
          },
        }))
      }
      get().fetchSupportConversations(support.page)
    })

    // Conversation status changed
    socketClient.on('support:conversation:status', (payload: unknown) => {
      const { id, status } = payload as { id: string; status: ConversationStatus }
      const { support } = get()
      if (support.activeConversationId === id) {
        set((s) => ({
          support: {
            ...s.support,
            activeConversation: s.support.activeConversation
              ? { ...s.support.activeConversation, status }
              : null,
          },
        }))
      }
      set((s) => ({
        support: {
          ...s.support,
          conversations: s.support.conversations.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        },
      }))
      get().fetchSupportStats()
    })

    // Connection status
    socket.on('connect', () => set({ socketConnected: true }))
    socket.on('disconnect', () => set({ socketConnected: false }))
  },

  disconnectSocket: () => {
    socketClient.disconnect()
    set({ socketConnected: false, onlineUsers: new Set() })
  },

  // ---- Typing ----
  emitTyping: (conversationIdOrChatId, type) => {
    const event = type === 'support' ? 'support:typing' : 'chat:typing'
    socketClient.emit(event, { [type === 'support' ? 'conversationId' : 'chatId']: conversationIdOrChatId })
  },
}))
