import { io, Socket } from 'socket.io-client'

type EventCallback = (...args: unknown[]) => void

const SOCKET_URL = '/?XTransformPort=3003'

class SocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private currentUserId: string | null = null

  /** Connect and register with a userId */
  connect(userId: string): Socket {
    // If already connected with same user, just return
    if (this.socket?.connected && this.currentUserId === userId) {
      return this.socket
    }

    // Disconnect old socket if switching user
    if (this.socket) {
      this.removeAllListeners()
      this.socket.disconnect()
    }

    this.currentUserId = userId

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })

    // Register user on connect
    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id)
      this.socket?.emit('register', userId)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })

    // Re-attach all stored listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb)
      })
    })

    return this.socket
  }

  /** Register a userId with the socket server */
  register(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('register', userId)
      this.currentUserId = userId
    }
  }

  /** Listen to a socket event */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    this.socket?.on(event, callback)
  }

  /** Remove a specific listener */
  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
    this.socket?.off(event, callback)
  }

  /** Remove all listeners for a specific event or all events */
  removeAllListeners(event?: string): void {
    if (event) {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        callbacks.forEach((cb) => this.socket?.off(event, cb))
        this.listeners.delete(event)
      }
    } else {
      this.listeners.forEach((callbacks, evt) => {
        callbacks.forEach((cb) => this.socket?.off(evt, cb))
      })
      this.listeners.clear()
    }
  }

  /** Emit an event to the server */
  emit(event: string, ...args: unknown[]): void {
    this.socket?.emit(event, ...args)
  }

  /** Check if connected */
  get connected(): boolean {
    return this.socket?.connected ?? false
  }

  /** Get socket id */
  get id(): string | undefined {
    return this.socket?.id
  }

  /** Disconnect */
  disconnect(): void {
    this.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
    this.currentUserId = null
  }
}

// Singleton instance
export const socketClient = new SocketClient()
export default socketClient
