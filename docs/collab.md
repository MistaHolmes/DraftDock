Assistant messages from this chat (verbatim)

---

Let me first deeply understand the existing codebase before brainstorming.

---

Now I have a deep enough understanding of the codebase. Here is the thorough implementation plan:

---

# Collaboration Feature — Full Implementation Plan

## What "Collaboration" Actually Means Here

The existing `CoAuthor` system is just invite/accept infrastructure — no actual real-time co-editing exists. The feature to build is **Google Docs-style real-time collaborative editing**: two or more accepted co-authors editing the same blog post simultaneously, seeing each other's cursors and changes in real time, with conflict-free merging.

---

## 1. Technology Choice Analysis

### The Core Problem: Concurrent Edits
When User A and User B both type at the same time, their edits conflict. There are two classical solutions:

**Operational Transform (OT)** — what Google Docs originally used. Every operation (insert/delete) is transformed against concurrent operations. Extremely hard to implement correctly in a distributed system.

**CRDT (Conflict-free Replicated Data Type)** — a mathematically sound data structure that guarantees eventual consistency regardless of operation order. No server arbitration needed.

**Decision: Use Yjs (CRDT library)**

Yjs is the industry standard for real-time collaboration in modern apps. It is used by Notion, Heptabase, and dozens of others. It handles all conflict resolution internally, has out-of-the-box cursor/presence (called "Awareness"), and has first-class integrations for every major editor.

### The Server Component

**Hocuspocus** (by the TipTap team) is a production-ready Yjs WebSocket server built in Node.js. It:
- Manages Y.Doc lifecycle (create/destroy per document)
- Has an extension API for hooks (onAuthenticate, onChange, onLoadDocument, onStoreDocument)
- Has a built-in Redis extension for horizontal scaling (pub/sub between multiple backend instances)
- Has a built-in database extension for persistence

This fits our stack perfectly. It runs as a standalone websocket server, similar to how our current WS server already runs on port 3001.

### The Editor Component

The current editor is `@uiw/react-md-editor` (a controlled React component). It does **not** support CRDT. The options are:

| Option | Editor | Yjs Binding | Markdown |
|--------|--------|-------------|----------|
| A | TipTap | `@tiptap/extension-collaboration` (native) | Via StarterKit + custom serializer |
| B | CodeMirror 6 | `y-codemirror.next` | Raw markdown, plain text |
| C | ProseMirror | `y-prosemirror` | Via remark serializer |

**Decision: TipTap + Collaboration extension**

TipTap is already built on ProseMirror under the hood, but with a much better React API. The `@tiptap/extension-collaboration` and `@tiptap/extension-collaboration-cursor` extensions drop directly onto an existing TipTap instance. This gives us collaborative editing with named colored cursors in ~50 lines of code once the server is set up. We can render TipTap output as HTML that maps cleanly to our existing blog rendering.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   CollaborativeBlogForm.tsx                          │  │
│  │                                                      │  │
│  │   TipTap Editor                                      │  │
│  │   ├── CollaborationExtension (Y.Doc binding)         │  │
│  │   ├── CollaborationCursorExtension (Awareness)       │  │
│  │   └── HocuspocusProvider (WebSocket client)          │  │
│  │       └── ws://backend:3002/collab/{blogId}          │  │
│  │                                                      │  │
│  │   Co-Author Sidebar                                  │  │
│  │   ├── Online presence list (from Awareness)          │  │
│  │   ├── Invite panel (existing HTTP API)               │  │
│  │   └── Save / Publish controls                        │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │  WebSocket (Yjs sync protocol + Awareness)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              HOCUSPOCUS SERVER  (port 3002)                 │
│                                                             │
│  onAuthenticate  → Verify Clerk JWT + CoAuthor DB check     │
│  onLoadDocument  → Load Y.Doc state from Redis              │
│  onStoreDocument → Persist to Redis + snapshot to Postgres  │
│  onChange        → Debounced auto-save + XP award           │
│                                                             │
│  Extensions:                                                │
│  ├── Redis extension  (pub/sub for multi-instance scale)    │
│  └── Database extension (Postgres snapshots via Prisma)     │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
      Redis                PostgreSQL
  (live Y.Doc state)    (BlogVersion + Blog.content)
```

Port allocation:
- `3000` — existing HTTP API (unchanged)
- `3001` — existing WebSocket (messaging, WebRTC signaling) (unchanged)
- `3002` — new Hocuspocus collaboration server

---

## 3. Database Changes

### New: `CollabSession` model (optional but recommended for audit)
```prisma
model CollabSession {
  id        String   @id @default(cuid())
  blogId    String
  userId    String
  joinedAt  DateTime @default(now())
  leftAt    DateTime?
  blog      Blog     @relation(fields: [blogId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@index([blogId])
  @@index([userId])
}
```

### Changes to `Blog` model
Add `ydocState Bytes?` — stores the binary Y.Doc state for the blog. This is separate from `content` (which holds the final saved HTML/Markdown). The Y.Doc is the source of truth during an active session; `content` is written when the author explicitly saves or publishes.

### Changes to `BlogVersion`
Already exists and is perfect for snapshots. No changes needed — Hocuspocus's `onStoreDocument` hook will call the existing `BlogVersion` creation logic.

---

## 4. Backend — Hocuspocus Server

### File: `apps/backend/src/lib/collabServer.ts`

This file creates and exports the Hocuspocus server instance. It is initialized in `server.ts` alongside `initWebSocket()`.

**`onAuthenticate` hook** — This is called when a browser connects. It receives the connection's JWT token (sent in the provider's `token` option).
- Call Clerk's `verifyToken()` with the token
- Extract `userId` from the Clerk session payload
- Look up the `CoAuthor` record: `prisma.coAuthor.findFirst({ where: { blogId, userId, status: 'ACCEPTED' } })`
- Also allow the blog's original `authorId` without a CoAuthor record
- If neither condition passes, `throw new Error('Unauthorized')` — Hocuspocus automatically closes the connection

**`onLoadDocument` hook** — Called when the first client connects to a document (identified by the `documentName`, which we set to the `blogId`).
- Check Redis for `collab:ydoc:{blogId}` key
- If found, decode the binary and apply it to the Y.Doc: `Y.applyUpdate(document.ydoc, Buffer.from(cached, 'base64'))`
- If not found, load the blog's `ydocState` from Postgres
- If neither exists (first time), initialize the Y.Doc from the blog's current `content` field by converting it to a ProseMirror document, then importing it into the Y.Doc

**`onStoreDocument` hook** — Called when all clients have disconnected (or on a periodic interval via Hocuspocus's debounce option).
- Encode the Y.Doc: `const update = Y.encodeStateAsUpdate(document.ydoc)`
- Write to Redis: `redis.set('collab:ydoc:{blogId}', Buffer.from(update).toString('base64'), { EX: 86400 })`
- Write to Postgres: `prisma.blog.update({ where: { id: blogId }, data: { ydocState: Buffer.from(update) } })`
- Create a `BlogVersion` snapshot (call the same version-creation logic used in the existing `blogs.ts` route)
- Invalidate `invalidateUserBlogsCache()` for the blog's authorId

**`onChange` hook** — Called on every change (debounced).
- Award a small amount of XP to the user who made the change (via `achievement.service.ts`)
- Write the update to Redis immediately (for fast reconnection)

### File: `apps/backend/src/lib/ydocToContent.ts`

Contains two utility functions:
- `ydocToMarkdown(ydoc)` — serializes Y.Doc's ProseMirror content to Markdown using `prosemirror-to-markdown` + `remark` for storage in `Blog.content`
- `contentToYdoc(content, ydoc)` — parses existing Markdown/HTML content and initializes a fresh Y.Doc from it using `prosemirror-markdown`

This is the bridge between the CRDT world and the existing `Blog.content` string field.

---

## 5. New HTTP Routes

### File: `apps/backend/src/routes/collab.ts`

**`POST /api/collab/:blogId/start`** — The primary author calls this to "open" a live session.
- Verifies ownership
- Sets a Redis key `collab:active:{blogId}` = `true` with 24h TTL (so clients know a session is live)
- Returns the list of accepted co-authors so the frontend can show who to expect

**`POST /api/collab/:blogId/save`** — Explicit save triggered by the author from the editor.
- Reads the current Y.Doc from Redis
- Runs `ydocToMarkdown()` to produce the final content string
- Updates `Blog.content` in Postgres
- Creates a `BlogVersion` entry
- Returns `{ savedAt, version }`

**`GET /api/collab/:blogId/status`** — Returns whether a live session is currently open and who is connected (from Hocuspocus's internal awareness state).

**`DELETE /api/collab/:blogId/end`** — Author ends the session.
- Flushes Y.Doc from Redis → Postgres
- Deletes `collab:active:{blogId}` key
- Sends a WebSocket notification to all participants (via existing `userConnections` map from `websocket.ts`) that the session has ended

---

## 6. Frontend — Components

### `useCollaboration` hook (`src/hooks/useCollaboration.ts`)

This hook encapsulates everything about the collaboration state:

```typescript
const {
  editor,          // TipTap editor instance (pass to <EditorContent>)
  provider,        // HocuspocusProvider instance
  connected,       // boolean — is WS connected
  awareness,       // array of { userId, name, color, cursor } for all connected users
  status,          // 'connecting' | 'connected' | 'disconnected' | 'error'
  isSaving,        // boolean — debounced save in progress
  lastSavedAt,     // Date | null
  save,            // () => Promise<void> — explicit save
  localUser,       // { name, color } — this user's cursor identity
} = useCollaboration({ blogId, token, userProfile });
```

Internally it:
1. Gets a Clerk token: `await getToken()`
2. Creates a `HocuspocusProvider` pointing to `wss://api.draftdock.com/collab` (proxied) with the token
3. Creates a TipTap editor with `Collaboration.configure({ document: provider.document })` and `CollaborationCursor.configure({ provider, user: { name, color } })`
4. Sets the user's awareness info (name, avatar, color) on connect
5. Exposes a debounced `save()` that calls `POST /api/collab/:blogId/save`

### `CollaborativeBlogForm.tsx` (`src/pages/CollaborativeBlogForm.tsx`)

This is a new page, separate from the existing `BlogForm.tsx` (which is kept for solo editing). The routing logic is:

```
/blog/new          → BlogForm.tsx          (solo, existing)
/blog/:id/edit     → BlogForm.tsx          (solo, existing)
/blog/:id/collab   → CollaborativeBlogForm.tsx  (NEW — collaborative)
```

The collaborative form:
- Calls `GET /api/collab/:blogId/status` on mount to check if a session is live
- If the current user is the owner, shows a "Start Collaboration Session" button that calls `POST /api/collab/:blogId/start`
- Uses `useCollaboration()` hook to get the TipTap editor
- Renders `<EditorContent editor={editor} />` in place of `<MDEditor>`
- Renders the `<CoAuthorPresenceBar />` component (see below)
- All other fields (title, coverImage, tags, summary) remain unchanged HTTP-controlled inputs — only the **body content** is Yjs-synced

### `CoAuthorPresenceBar.tsx` (`src/components/collab/CoAuthorPresenceBar.tsx`)

A horizontal bar at the top of the editor showing:
- Avatar + colored dot for each connected co-author
- Their name on hover via tooltip
- A flashing indicator if they are actively typing
- An "Invite Co-Author" button that opens the existing invite flow (`POST /api/blogs/:id/coauthors`)
- A "Save Draft" button and a "Publish" button (only visible to the original author)

The color for each user is deterministically generated from their userId using a hashing function (e.g., `HSL(hash(userId) % 360, 70%, 50%)`) so it is always the same for a given user across sessions.

### `CollabCursorStyles.tsx`

TipTap renders remote cursors as DOM elements with custom classes. We inject a `<style>` tag dynamically that generates CSS rules like:
```css
.collaboration-cursor__caret--{userId} { border-color: #e74c3c; }
.collaboration-cursor__label--{userId} { background-color: #e74c3c; }
```
This is driven by the awareness data from `useCollaboration`.

---

## 7. State Management & Conflict Resolution Details

### What is actually CRDT-synced vs HTTP
| Field | Sync Method |
|-------|-------------|
| `content` (body) | Yjs CRDT via TipTap/Hocuspocus |
| `title` | HTTP form state (not real-time) |
| `tags` | HTTP form state (not real-time) |
| `coverImage` | HTTP form state (not real-time) |
| `published` status | HTTP only, owner-only |

Keeping title/tags as plain HTTP state is intentional. Real-time sync of every field adds significant complexity for minimal benefit — the body is the only field with meaningful concurrent editing.

### Conflict Resolution Flow
With Yjs, there are no "conflicts" in the traditional sense. The CRDT algorithm guarantees convergence:
- If User A and User B type at the same position simultaneously, Yjs deterministically orders both insertions (by a lamport clock + unique client ID tiebreaker)
- Both users end up with the exact same document state after sync, regardless of network latency or ordering of messages

### Offline / Reconnection Handling
The `HocuspocusProvider` handles this automatically:
- If a client loses connection, it continues to track all local changes in the local Y.Doc
- Upon reconnect, it sends a sync message containing only the diff (Y.doc update vector)
- The server merges the offline changes with what happened while the client was gone
- The client receives the server's changes in return
- Both sides converge to the same state

---

## 8. Redis Keys Used

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `collab:active:{blogId}` | String `"1"` | 24h | Whether a live session is open |
| `collab:ydoc:{blogId}` | String (base64) | 24h | Serialized Y.Doc state |
| `collab:users:{blogId}` | Set of userIds | 24h | Fast lookup of who is/was in a session |

---

## 9. Packages to Install

### Backend
```
@hocuspocus/server        # Yjs collaboration server
@hocuspocus/extension-redis  # Redis pub/sub for horizontal scale
yjs                        # CRDT engine
y-protocols               # Yjs sync wire protocol
prosemirror-model         # For doc serialization in ydocToContent util
prosemirror-markdown      # Markdown ↔ ProseMirror converter
```

### Frontend
```
@hocuspocus/provider          # Browser-side WS client for Hocuspocus
@tiptap/react                 # TipTap React wrapper
@tiptap/starter-kit           # Base extensions (bold, italic, headings, etc.)
@tiptap/extension-collaboration  # Yjs binding for TipTap
@tiptap/extension-collaboration-cursor  # Remote cursors via Awareness
yjs                           # CRDT (must match server version exactly)
```

---

## 10. Authentication Flow (Detailed)

```
Browser                      Hocuspocus Server         Postgres/Clerk
   │                               │                        │
   │── connect(token: clerkJWT) ──►│                        │
   │                               │── verifyToken(JWT) ───►│
   │                               │◄─ { userId, ... } ─────│
   │                               │── findCoAuthor(blogId, userId) ──►│
   │                               │◄─ CoAuthor record (ACCEPTED) ─────│
   │◄── OPEN (connection accepted) │                        │
   │                               │                        │
   │── sync request ──────────────►│                        │
   │                               │── loadYdocFromRedis ──►│
   │◄── full Y.Doc state ──────────│◄─ ydoc bytes ──────────│
```

The `token` is sent in the Hocuspocus provider constructor:
```ts
new HocuspocusProvider({
  url: 'wss://...',
  name: blogId,
  token: await getToken(),  // Clerk JWT
})
```

The server receives it in `onAuthenticate({ token, requestParameters })`. `requestParameters` also contains the `documentName` (= `blogId`) so the auth check can be blog-scoped.

---

## 11. Integration Points with Existing Features

### Blog Versioning (`BlogVersion`)
`onStoreDocument` calls the same version-bump logic that `PUT /api/blogs/:id` uses. Every time all collaborators disconnect, a new version is snapshotted. This means the author can revert to any collaborative session's snapshot from the existing version history UI.

### Notifications
When a co-author joins the session (Hocuspocus `onConnect` hook), the owner gets a notification via the existing `broadcastNotificationUpdate` → `prisma.notification.create` pipeline.

### Achievements & XP
The `onChange` hook awards incremental XP using `achievement.service.ts`. A new achievement can be added: **"Collaborator"** — first time a user co-authors and saves a blog (trigger: `onStoreDocument` for a non-owner user).

### Messaging
When the owner invites a co-author (existing `POST /api/blogs/:id/coauthors`), the system can optionally also open a conversation thread between the owner and that co-author using the existing `Conversation`/`Message` models. This gives collaborators a side channel without needing in-editor commenting.

### WebRTC (Existing voice/video calling)
The existing WebRTC signaling in `websocket.ts` already enables video calls between any two connected users. During a collaboration session, the `CoAuthorPresenceBar` can surface a "Call" button that uses this existing infrastructure (the other user is guaranteed to be online since they are connected to the Hocuspocus server).

---

## 12. Nginx / Proxy Configuration

The existing `nginx.conf` needs one additional `location` block to proxy WebSocket connections to the Hocuspocus server:

```nginx
location /collab {
  proxy_pass http://backend:3002;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "Upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 3600s;
  proxy_send_timeout 3600s;
}
```

This is identical to how the existing `/ws` location works for port 3001.

---

## 13. Implementation Order (Sequenced)

| # | Phase | What | Why first |
|---|-------|------|-----------|
| 1 | Backend | Add `ydocState Bytes?` to `Blog` in schema + migrate | Everything else depends on storage |
| 2 | Backend | `lib/collabServer.ts` with `onAuthenticate` + `onLoadDocument` + `onStoreDocument` | Core server logic |
| 3 | Backend | `lib/ydocToContent.ts` utility | Needed by collabServer for init and save |
| 4 | Backend | `routes/collab.ts` (start/save/status/end) | Needed by frontend to control sessions |
| 5 | Backend | Wire `collabServer` into `server.ts` on port 3002 | Makes it reachable |
| 6 | Frontend | `useCollaboration` hook | All UI depends on this |
| 7 | Frontend | `CoAuthorPresenceBar` | Independent UI component |
| 8 | Frontend | `CollaborativeBlogForm` page | Composes the above |
| 9 | Frontend | Add `/blog/:id/collab` route to `App.tsx` | Makes page accessible |
| 10 | Frontend | Add "Collaborate" button to `Dashboard.tsx` for blogs with accepted co-authors | Entry point UX |
| 11 | Nginx | Add `/collab` proxy block to both `nginx.conf` files | Deploy readiness |

---

## 14. Edge Cases to Handle

**Last writer wins on explicit save** — Since only the owner can publish, and the body is CRDT-synced, there's no race condition on publish. The owner's client has the latest merged state at all times.

**Co-author invited but not yet accepted tries to connect** — `onAuthenticate` rejects them. Frontend should check `CoAuthor.status` before even rendering the "Join Collaboration" button.

**Session left open with no one connected** — `onStoreDocument` fires when last client disconnects. The Redis key gets the Y.Doc snapshot. A nightly cron job (extending `scheduler.ts`) can flush any `collab:active:{blogId}` keys older than 24h and persist their Y.Docs.

**Editor content on first load of existing blog** — `onLoadDocument` checks for an existing Y.Doc in Redis/Postgres. If none (fresh blog opened in collab for the first time), convert `Blog.content` (Markdown string) to a ProseMirror document and use it to seed the Y.Doc via `Y.transact`.

**Content serialization** — TipTap stores content as ProseMirror JSON internally. On explicit save, `ydocToMarkdown()` converts this back to Markdown so `Blog.content` remains Markdown-compatible with the existing solo editor and blog renderer.

**Multiple browser tabs by the same user** — Yjs handles this transparently — they are treated as two separate clients and both get synced. The awareness state will show the same user twice with different connection IDs, which should be de-duplicated in the `CoAuthorPresenceBar` by `userId`.

---

This plan reuses the full existing infrastructure — Redis, WebSocket pattern, Prisma, Notification system, Achievement system, BlogVersion, and the co-author invite flow — while adding the minimum new surface area needed for real-time collaborative editing.

---

(End of assistant content)
