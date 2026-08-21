'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useChatStore } from '@/lib/chat-store'
import type { ConversationStatus, DemoUser, Message, SupportConversation, Chat } from '@/lib/chat-types'
import { formatDistanceToNow } from 'date-fns'
import {
  Building2,
  Send,
  MessageSquare,
  Users,
  Search,
  Filter,
  UserCheck,
  Pin,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  X,
  Paperclip,
  Shield,
  Hash,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  StickyNote,
  Circle,
  CircleDot,
  MinusCircle,
  XCircle,
  MessageCircle,
  LayoutGrid,
  User,
  Menu,
  ChevronDown,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// ========================================
// Constants
// ========================================

const STATUS_COLORS: Record<ConversationStatus, string> = {
  OPEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  RESOLVED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  CLOSED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/30 dark:text-neutral-500',
}

const STATUS_ICONS: Record<ConversationStatus, typeof Circle> = {
  OPEN: CircleDot,
  PENDING: Clock,
  RESOLVED: Check,
  CLOSED: MinusCircle,
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

function formatShortTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function isStaffRole(role: string): boolean {
  return role === 'ADMIN' || role === 'STAFF'
}

// ========================================
// Header Component
// ========================================

function Header() {
  const { allUsers, currentUser, setCurrentUser, socketConnected } = useChatStore()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <Building2 className="h-5 w-5 text-foreground" />
          <span className="font-semibold text-sm hidden sm:inline">Suretreaven</span>
        </div>

        {/* Separator */}
        <Separator orientation="vertical" className="h-6" />

        {/* User Switcher */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 ml-2">
              {currentUser ? (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={currentUser.avatar || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(currentUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {currentUser.username}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {currentUser.role}
                  </Badge>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Select User</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Switch Demo User</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => {
                  setCurrentUser(user)
                  setOpen(false)
                }}
                className="flex items-center gap-2 py-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.username}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {user.role}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Connection Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div
                  className={`h-2 w-2 rounded-full ${
                    socketConnected ? 'bg-emerald-500' : 'bg-destructive'
                  }`}
                />
                <span className="hidden md:inline">
                  {socketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {socketConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex-1" />

        {/* Support Chat Title */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline font-medium">Support Chat</span>
        </div>
      </div>
    </header>
  )
}

// ========================================
// Customer View
// ========================================

function CustomerView() {
  const {
    support,
    setActiveSupportConversation,
    fetchSupportConversations,
  } = useChatStore()
  const [newConvOpen, setNewConvOpen] = useState(false)
  const isMobile = useIsMobile()
  const showList = isMobile ? !support.activeConversationId : true
  const showDetail = !isMobile || !!support.activeConversationId

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversation List */}
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-80 lg:w-96'} border-r flex flex-col bg-background`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">My Conversations</h2>
              <Button size="sm" onClick={() => setNewConvOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {support.loading && support.conversations.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : support.conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new support conversation
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {support.conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveSupportConversation(conv.id)}
                    className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                      support.activeConversationId === conv.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {conv.assignedTo ? (
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={conv.assignedTo.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(conv.assignedTo.username)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {conv.subject || 'Support Request'}
                          </span>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatTime(conv.updatedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.lastMessage || 'No messages'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[conv.status]}`}>
                            {conv.status}
                          </span>
                          {conv.assignedTo && (
                            <span className="text-[10px] text-muted-foreground">
                              with {conv.assignedTo.username}
                            </span>
                          )}
                          {conv.customerUnreadCount > 0 && (
                            <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                              {conv.customerUnreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Conversation Detail */}
      {showDetail && (
        <CustomerConversationDetail
          onBack={() => setActiveSupportConversation(null)}
          isMobile={isMobile}
        />
      )}

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={newConvOpen}
        onOpenChange={setNewConvOpen}
      />
    </div>
  )
}

// ========================================
// Customer Conversation Detail
// ========================================

function CustomerConversationDetail({ onBack, isMobile }: { onBack: () => void; isMobile: boolean }) {
  const {
    support,
    sendSupportMessage,
    emitTyping,
    currentUser,
  } = useChatStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>

  const conv = support.activeConversation
  const messages = support.messages
  const convId = support.activeConversationId

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = useCallback(async () => {
    if (!text.trim() || !convId || sending) return
    setSending(true)
    try {
      await sendSupportMessage(convId, text.trim())
      setText('')
    } catch (err) {
      console.error('Failed to send:', err)
    }
    setSending(false)
  }, [text, convId, sending, sendSupportMessage])

  const handleTyping = useCallback(() => {
    if (!convId) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {}, 0)
    emitTyping(convId, 'support')
  }, [convId, emitTyping])

  if (support.loadingDetail) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!conv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">Select a conversation</p>
        <p className="text-xs mt-1">Choose from the list or start a new one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-14 border-b flex items-center gap-3 px-4 shrink-0">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {conv.subject || 'Support Conversation'}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[conv.status]}`}>
              {conv.status}
            </span>
            {conv.assignedTo && (
              <span className="text-[11px] text-muted-foreground">
                {conv.assignedTo.username}
              </span>
            )}
          </div>
        </div>
        {conv.property && (
          <Badge variant="outline" className="text-[10px] shrink-0">
            <Building2 className="h-3 w-3 mr-1" />
            {conv.property.title}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUser?.id} />
        ))}
        {messages.length === 0 && !support.loadingDetail && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Say hello!
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            disabled={sending || conv.status === 'CLOSED'}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || sending || conv.status === 'CLOSED'}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ========================================
// Message Bubble
// ========================================

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarImage src={message.sender?.avatar || undefined} />
        <AvatarFallback className="text-[10px]">
          {message.sender ? getInitials(message.sender.username) : '?'}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          {!isOwn && message.sender && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {message.sender.username}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/60">
            {formatShortTime(message.createdAt)}
          </span>
          {message.isInternal && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600 border-amber-300">
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              Internal
            </Badge>
          )}
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
            message.isInternal
              ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              : isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  )
}

// ========================================
// Staff/Admin View
// ========================================

function StaffView() {
  const { currentUser } = useChatStore()
  const isAdmin = currentUser?.role === 'ADMIN'

  return (
    <Tabs defaultValue="support" className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="border-b px-4">
        <TabsList className="bg-transparent h-12 p-0 gap-0">
          <TabsTrigger
            value="support"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Support
            <UnreadBadge section="support" />
          </TabsTrigger>
          <TabsTrigger
            value="internal"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
          >
            <Users className="h-4 w-4 mr-2" />
            Team Chat
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="support" className="flex-1 m-0 overflow-hidden">
        <SupportInbox />
      </TabsContent>

      <TabsContent value="internal" className="flex-1 m-0 overflow-hidden">
        <InternalChatView />
      </TabsContent>
    </Tabs>
  )
}

// ========================================
// Unread Badge Helper
// ========================================

function UnreadBadge({ section }: { section: 'support' | 'internal' }) {
  const { support, internal } = useChatStore()
  const count =
    section === 'support'
      ? support.conversations.reduce((sum, c) => sum + c.unreadCount, 0)
      : internal.chats.reduce(
          (sum, c) =>
            sum + (c.participants.find((p) => !p.hasSeen && p.userId !== useChatStore.getState().currentUser?.id) ? 1 : 0),
          0
        )

  if (count === 0) return null
  return (
    <span className="ml-1.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-semibold">
      {count}
    </span>
  )
}

// ========================================
// Support Inbox (Staff/Admin)
// ========================================

function SupportInbox() {
  const {
    support,
    setActiveSupportConversation,
    setSupportFilter,
    fetchSupportConversations,
  } = useChatStore()
  const isMobile = useIsMobile()
  const showList = isMobile ? !support.activeConversationId : true
  const showDetail = !isMobile || !!support.activeConversationId

  return (
    <div className="flex h-full">
      {/* Left: Conversation list */}
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-80 lg:w-[360px]'} border-r flex flex-col`}>
          {/* Stats Bar */}
          {support.stats && (
            <div className="grid grid-cols-5 border-b text-center">
              {(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const).map((status) => {
                const count = support.stats.byStatus[status]
                return (
                  <button
                    key={status}
                    onClick={() => setSupportFilter('status', support.filters.status === status ? '' : status)}
                    className={`py-2.5 text-xs transition-colors hover:bg-accent ${
                      support.filters.status === status ? 'bg-accent font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="text-base font-bold text-foreground">{count}</div>
                    <div className="mt-0.5">{status}</div>
                  </button>
                )
              })}
              <div className="py-2.5 text-xs">
                <div className="text-base font-bold text-foreground">{support.stats.total}</div>
                <div className="mt-0.5 text-muted-foreground">Total</div>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={support.filters.search}
                onChange={(e) => setSupportFilter('search', e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={support.filters.assignedToId}
                onValueChange={(v) => setSupportFilter('assignedToId', v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Assigned to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {support.staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {support.filters.status && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setSupportFilter('status', '')}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {support.loading && support.conversations.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : support.conversations.length === 0 ? (
              <div className="p-8 text-center">
                <InboxIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              <div className="divide-y">
                {support.conversations.map((conv) => (
                  <ConversationListItem
                    key={conv.id}
                    conv={conv}
                    active={support.activeConversationId === conv.id}
                    onClick={() => setActiveSupportConversation(conv.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {support.totalPages > 1 && (
            <div className="border-t p-2 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={support.page <= 1}
                onClick={() => fetchSupportConversations(support.page - 1)}
              >
                Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                {support.page} / {support.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={support.page >= support.totalPages}
                onClick={() => fetchSupportConversations(support.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Right: Conversation Detail */}
      {showDetail && (
        <StaffConversationDetail
          onBack={() => setActiveSupportConversation(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// ========================================
// Conversation List Item (Staff view)
// ========================================

function ConversationListItem({
  conv,
  active,
  onClick,
}: {
  conv: SupportConversation
  active: boolean
  onClick: () => void
}) {
  const StatusIcon = STATUS_ICONS[conv.status]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 hover:bg-accent transition-colors ${active ? 'bg-accent' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarImage src={conv.customerAvatar || undefined} />
          <AvatarFallback className="text-[10px]">
            {getInitials(conv.customerName || 'U')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium truncate">{conv.customerName}</span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatTime(conv.updatedAt)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {conv.subject || conv.lastMessage || 'No messages'}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[conv.status]}`}>
              <StatusIcon className="h-2.5 w-2.5" />
              {conv.status}
            </span>
            {conv.assignedTo ? (
              <span className="text-[10px] text-muted-foreground">
                <UserCheck className="h-2.5 w-2.5 inline mr-0.5" />
                {conv.assignedTo.username}
              </span>
            ) : (
              <span className="text-[10px] text-amber-600">Unassigned</span>
            )}
            {conv.staffUnreadCount > 0 && (
              <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                {conv.staffUnreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ========================================
// Staff Conversation Detail
// ========================================

function StaffConversationDetail({
  onBack,
  isMobile,
}: {
  onBack: () => void
  isMobile: boolean
}) {
  const {
    support,
    sendSupportMessage,
    updateConversationStatus,
    assignConversation,
    addNote,
    emitTyping,
    currentUser,
    onlineUsers,
  } = useChatStore()

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [assigningId, setAssigningId] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const conv = support.activeConversation
  const messages = support.messages
  const convId = support.activeConversationId

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = useCallback(async () => {
    if (!text.trim() || !convId || sending) return
    setSending(true)
    try {
      await sendSupportMessage(convId, text.trim(), isInternal)
      setText('')
    } catch (err) {
      console.error('Failed to send:', err)
    }
    setSending(false)
  }, [text, convId, sending, isInternal, sendSupportMessage])

  const handleStatusChange = useCallback(
    async (status: ConversationStatus) => {
      if (!convId) return
      try {
        await updateConversationStatus(convId, status)
      } catch (err) {
        console.error('Failed to update status:', err)
      }
    },
    [convId, updateConversationStatus]
  )

  const handleAssign = useCallback(async () => {
    if (!convId || !assigningId) return
    try {
      await assignConversation(convId, assigningId)
      setShowAssign(false)
      setAssigningId('')
    } catch (err) {
      console.error('Failed to assign:', err)
    }
  }, [convId, assigningId, assignConversation])

  const handleAddNote = useCallback(async () => {
    if (!convId || !noteText.trim()) return
    setAddingNote(true)
    try {
      await addNote(convId, noteText.trim())
      setNoteText('')
    } catch (err) {
      console.error('Failed to add note:', err)
    }
    setAddingNote(false)
  }, [convId, noteText, addNote])

  if (support.loadingDetail) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!conv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">Select a conversation</p>
        <p className="text-xs mt-1">Pick a conversation from the inbox</p>
      </div>
    )
  }

  const customerOnline = onlineUsers.has(conv.customerId)

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-14 border-b flex items-center gap-3 px-4 shrink-0">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarImage src={conv.customerAvatar || undefined} />
          <AvatarFallback className="text-xs">{getInitials(conv.customerName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{conv.customerName}</span>
            <div
              className={`h-2 w-2 rounded-full ${
                customerOnline ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              }`}
            />
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {conv.subject || conv.customerEmail}
          </div>
        </div>

        {/* Status Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <span className={`inline-block h-2 w-2 rounded-full ${
                conv.status === 'OPEN' ? 'bg-emerald-500' :
                conv.status === 'PENDING' ? 'bg-amber-500' :
                conv.status === 'RESOLVED' ? 'bg-sky-500' : 'bg-muted-foreground/40'
              }`} />
              {conv.status}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => handleStatusChange(s)}
                className={conv.status === s ? 'font-semibold' : ''}
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assign */}
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setShowAssign(true)}
        >
          <UserCheck className="h-3.5 w-3.5 mr-1" />
          {conv.assignedTo ? conv.assignedTo.username : 'Assign'}
        </Button>

        {/* Notes */}
        <Button
          variant={showNotes ? 'secondary' : 'outline'}
          size="sm"
          className="text-xs"
          onClick={() => setShowNotes(!showNotes)}
        >
          <StickyNote className="h-3.5 w-3.5 mr-1" />
          Notes
          {support.notes.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
              {support.notes.length}
            </Badge>
          )}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Conversation Info Bar */}
          {(conv.property || conv.booking) && (
            <div className="px-4 py-2 bg-muted/50 border-b text-xs flex items-center gap-3">
              {conv.property && (
                <Badge variant="outline" className="text-[10px]">
                  <Building2 className="h-3 w-3 mr-1" />
                  {conv.property.title} — {conv.property.city}
                </Badge>
              )}
              {conv.booking && (
                <Badge variant="outline" className="text-[10px]">
                  Booking: {conv.booking.bookingStatus}
                </Badge>
              )}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUser?.id}
              />
            ))}
            {messages.length === 0 && !support.loadingDetail && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No messages yet
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-3">
            {isInternal && (
              <div className="mb-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-1.5">
                <Shield className="h-3 w-3" />
                Internal note — only staff can see this
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant={isInternal ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => setIsInternal(!isInternal)}
                title="Toggle internal note mode"
              >
                <Shield className="h-3.5 w-3.5 mr-1" />
                Internal
              </Button>
              <Input
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (convId) emitTyping(convId, 'support')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={isInternal ? 'Write an internal note...' : 'Reply to customer...'}
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                size="icon"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Notes Panel */}
        {showNotes && (
          <div className="w-72 border-l flex flex-col shrink-0 hidden md:flex">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold">Internal Notes</h3>
            </div>
            <ScrollArea className="flex-1">
              {support.notes.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No notes yet
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {support.notes.map((note) => (
                    <Card key={note.id} className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {note.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-xs font-medium">
                            {note.author.username}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-3 border-t">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="text-xs min-h-[60px] resize-none"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={!noteText.trim() || addingNote}
                  onClick={() => handleAddNote()}
                >
                  {addingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add Note'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={!noteText.trim() || addingNote}
                  onClick={() => handleAddNote()}
                >
                  <Pin className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Conversation</DialogTitle>
          </DialogHeader>
          <Select value={assigningId} onValueChange={setAssigningId}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {support.staffList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.username} ({s.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!assigningId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Notes Sheet */}
      <Sheet open={showNotes && isMobile} onOpenChange={setShowNotes}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Internal Notes</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {support.notes.map((note) => (
              <Card key={note.id} className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium">{note.author.username}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(note.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-4 border-t pt-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="text-xs min-h-[60px] resize-none"
            />
            <Button
              size="sm"
              className="w-full mt-2 text-xs"
              disabled={!noteText.trim() || addingNote}
              onClick={() => handleAddNote()}
            >
              {addingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add Note'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ========================================
// Internal Chat View
// ========================================

function InternalChatView() {
  const {
    internal,
    setActiveInternalChat,
    support,
    createInternalChat,
    currentUser,
  } = useChatStore()
  const isMobile = useIsMobile()
  const showList = isMobile ? !internal.activeChatId : true
  const showDetail = !isMobile || !!internal.activeChatId

  // Get staff list for new chat dialog
  const otherStaff = support.staffList.filter((s) => s.id !== currentUser?.id)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const handleNewChat = async () => {
    if (!selectedStaffId) return
    try {
      const chat = await createInternalChat(selectedStaffId)
      setActiveInternalChat(chat.id)
      setNewChatOpen(false)
      setSelectedStaffId('')
    } catch (err) {
      console.error('Failed to create chat:', err)
    }
  }

  return (
    <div className="flex h-full">
      {/* Chat List */}
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-72 lg:w-80'} border-r flex flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Team Chat</h2>
              <Button size="sm" onClick={() => setNewChatOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Chat
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {internal.loading && internal.chats.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : internal.chats.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No team chats yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a conversation with a team member
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {internal.chats.map((chat) => {
                  const otherParticipant = chat.participants.find(
                    (p) => p.userId !== currentUser?.id
                  )
                  const otherUser = otherParticipant?.user
                  const hasUnread =
                    otherParticipant && !otherParticipant.hasSeen

                  return (
                    <button
                      key={chat.id}
                      onClick={() => setActiveInternalChat(chat.id)}
                      className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                        internal.activeChatId === chat.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={otherUser?.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {otherUser ? getInitials(otherUser.username) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">
                              {otherUser?.username || 'Unknown'}
                            </span>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {formatTime(chat.updatedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {chat.lastMessage || 'No messages'}
                          </p>
                          {hasUnread && (
                            <span className="inline-block mt-1.5 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat Detail */}
      {showDetail && (
        <InternalChatDetail
          onBack={() => setActiveInternalChat(null)}
          isMobile={isMobile}
        />
      )}

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Team Chat</DialogTitle>
          </DialogHeader>
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team member" />
            </SelectTrigger>
            <SelectContent>
              {otherStaff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.username} ({s.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewChat} disabled={!selectedStaffId}>
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ========================================
// Internal Chat Detail
// ========================================

function InternalChatDetail({
  onBack,
  isMobile,
}: {
  onBack: () => void
  isMobile: boolean
}) {
  const {
    internal,
    sendInternalMessage,
    emitTyping,
    currentUser,
  } = useChatStore()

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const chat = internal.activeChat
  const messages = internal.messages
  const chatId = internal.activeChatId

  const otherParticipant = chat?.participants.find((p) => p.userId !== currentUser?.id)
  const otherUser = otherParticipant?.user

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = useCallback(async () => {
    if (!text.trim() || !chatId || sending) return
    setSending(true)
    try {
      await sendInternalMessage(chatId, text.trim())
      setText('')
    } catch (err) {
      console.error('Failed to send:', err)
    }
    setSending(false)
  }, [text, chatId, sending, sendInternalMessage])

  if (internal.loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">Select a chat</p>
        <p className="text-xs mt-1">Choose a team conversation</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-14 border-b flex items-center gap-3 px-4 shrink-0">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherUser?.avatar || undefined} />
          <AvatarFallback className="text-xs">
            {otherUser ? getInitials(otherUser.username) : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{otherUser?.username}</div>
          <div className="text-[11px] text-muted-foreground">{otherUser?.role}</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUser?.id} />
        ))}
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (chatId) emitTyping(chatId, 'chat')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ========================================
// New Conversation Dialog
// ========================================

function NewConversationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { createSupportConversation } = useChatStore()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await createSupportConversation({
        subject: subject.trim() || undefined,
        message: message.trim(),
      })
      setSubject('')
      setMessage('')
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Support Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========================================
// Placeholder Icon Components
// ========================================

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

// ========================================
// Mobile Hook
// ========================================

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ========================================
// Main Page
// ========================================

export default function Home() {
  const { currentUser, fetchAllUsers } = useChatStore()

  // Fetch users on mount
  useEffect(() => {
    fetchAllUsers()
  }, [fetchAllUsers])

  const role = currentUser?.role

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {!currentUser ? (
            <WelcomeScreen />
          ) : role === 'USER' || role === 'AGENT' ? (
            <CustomerView />
          ) : (
            <StaffView />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}

// ========================================
// Welcome Screen
// ========================================

function WelcomeScreen() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Building2 className="h-8 w-8 text-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Suretreaven Support</h1>
        <p className="text-muted-foreground mb-6">
          Select a demo user from the dropdown above to experience the support chat system.
          Different roles show different views.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Customer</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Create support tickets and chat with agents about properties.
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Staff</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage conversations, reply to customers, and collaborate internally.
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Admin</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Full access to all conversations, staff management, and system stats.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
