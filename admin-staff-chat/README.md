# Admin Staff Chat - Standalone PWA

A fully dynamic, real-time chat application for **Admin & Staff** to communicate with customers directly. Built as a standalone Progressive Web App (PWA) that can be installed on mobile devices or embedded in a webview.

## Features

- **Real-time messaging** via Socket.io
- **Audio & Video calling** via WebRTC
- **PWA installable** on Android/iOS
- **Role-based access** (Admin & Staff only)
- **Dynamic conversations** - connects to your existing Express API
- **Typing indicators** & online status
- **Mobile-first design** with responsive layout
- **New conversation** - start chats with any customer or staff member
- **Tab filtering** - All, Unread, Customers, Staff

## Architecture

```
admin-staff-chat/    <-- This app (Next.js 16, port 3001)
    |  HTTP + Socket.io
your-api/            <-- Your existing Express.js API (port 8800)
    |
MySQL Database       <-- Prisma ORM
```

## Quick Setup

### 1. Install dependencies

```bash
cd admin-staff-chat
npm install
# or: bun install
```

### 2. Configure API URL

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://YOUR_API_SERVER:8800/api
NEXT_PUBLIC_SOCKET_URL=http://YOUR_API_SERVER:8800
```

### 3. Update your API server

Replace (or merge) your existing `socket_handler.js` with the one provided in the root of this zip. It adds WebRTC signaling events (call-offer, call-answer, call-ice-candidate, call-reject, call-end) while keeping all existing functionality.

Make sure your Socket.io CORS config includes the chat app URL:
```js
cors: {
  origin: [
    "http://localhost:5173",   // main client (Vite)
    "http://localhost:3001",   // this admin-staff-chat app
  ],
  methods: ["GET", "POST"],
  credentials: true,
}
```

### 4. Run in development

```bash
npm run dev
# App runs on http://localhost:3001
```

### 5. Build for production

```bash
npm run build
npm start
```

## Using as Webview in Mobile App

Deploy to your server, then embed in Android WebView or iOS WKWebView:
```
https://your-domain.com:3001
```

The PWA manifest allows "Add to Home Screen" for a native-like experience without a wrapper app.

## Main Client App Fix (CallContext)

If your main client app (Vite, at `client/`) has a `CallModal.jsx` that throws:
```
Failed to resolve import "../../context/CallContext"
```

Copy the file from `main-client-patch/context/CallContext.jsx` to `client/src/context/CallContext.jsx` in your main project. Then wrap your app with `CallProvider`:

```jsx
import { CallProvider } from "./context/CallContext";

<CallProvider userId={user.id} username={user.username} avatar={user.avatar} socket={socket}>
  <App />
  <CallModal />
</CallProvider>
```

See `main-client-patch/INSTRUCTIONS.txt` for full details.

## API Endpoints Used

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login with email/phone |
| POST | /api/auth/verify-otp | Verify OTP |
| GET | /api/chats | List conversations |
| GET | /api/chats/:id | Get chat with messages |
| POST | /api/chats | Create/find conversation |
| PUT | /api/chats/read/:id | Mark as read |
| POST | /api/messages/:chatId | Send message |
| GET | /api/users?role=ROLE | List users by role |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| newUser | Client -> Server | Register user online |
| sendMessage | Client -> Server | Send chat message |
| getMessage | Server -> Client | Receive chat message |
| typing | Client -> Server | Typing indicator |
| userTyping | Server -> Client | Typing indicator received |
| getOnlineUsers | Server -> Client | Online user list |
| call-offer | Both | WebRTC call offer |
| call-answer | Both | WebRTC call answer |
| call-ice-candidate | Both | ICE candidate |
| call-reject | Both | Call rejected |
| call-end | Both | Call ended |

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand (state management)
- Socket.io Client
- Lucide React (icons)
- date-fns
- Radix UI primitives