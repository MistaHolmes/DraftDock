# DraftDock — Full-Stack Blogging Platform
## Comprehensive Project Documentation

**Prepared for**: Software Requirements Specification (SRS) Report Generation
**Institution**: C.V. Raman Global University
**Date**: March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Team Members & Contributions](#2-team-members--contributions)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Repository Structure](#5-repository-structure)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Backend — API Reference](#8-backend--api-reference)
   - [8.1 Blogs API](#81-blogs-api)
   - [8.2 User API](#82-user-api)
   - [8.3 Bookmarks API](#83-bookmarks-api)
   - [8.4 Comments API](#84-comments-api)
   - [8.5 Notifications API](#85-notifications-api)
   - [8.6 Follow System API](#86-follow-system-api)
   - [8.7 AI Writing Assistant API](#87-ai-writing-assistant-api)
   - [8.8 Analytics API](#88-analytics-api)
   - [8.9 Messaging API](#89-messaging-api)
   - [8.10 Discovery & Recommendations API](#810-discovery--recommendations-api)
   - [8.11 Achievements API](#811-achievements-api)
   - [8.12 Highlights API](#812-highlights-api)
   - [8.13 Series API](#813-series-api)
   - [8.14 Co-Authors API](#814-co-authors-api)
   - [8.15 Tags API](#815-tags-api)
   - [8.16 Authors API](#816-authors-api)
   - [8.17 Admin API](#817-admin-api)
9. [Frontend — Pages & Components](#9-frontend--pages--components)
   - [9.1 Pages](#91-pages)
   - [9.2 Key Components](#92-key-components)
   - [9.3 Context Providers](#93-context-providers)
10. [Feature Deep-Dives](#10-feature-deep-dives)
    - [10.1 Blog Editor](#101-blog-editor)
    - [10.2 AI Writing Assistant](#102-ai-writing-assistant)
    - [10.3 Real-Time Messaging](#103-real-time-messaging)
    - [10.4 Real-Time Notifications](#104-real-time-notifications)
    - [10.5 Gamification (XP, Levels & Achievements)](#105-gamification-xp-levels--achievements)
    - [10.6 Blog Versioning](#106-blog-versioning)
    - [10.7 Co-Authoring System](#107-co-authoring-system)
    - [10.8 Premium Content & Subscriptions](#108-premium-content--subscriptions)
    - [10.9 Tipping System](#109-tipping-system)
    - [10.10 Personalized Discovery Feed](#1010-personalized-discovery-feed)
    - [10.11 Text Highlights & Annotations](#1011-text-highlights--annotations)
    - [10.12 Analytics Dashboard](#1012-analytics-dashboard)
    - [10.13 Leaderboard](#1013-leaderboard)
    - [10.14 Blog Series](#1014-blog-series)
    - [10.15 Scheduled Publishing](#1015-scheduled-publishing)
    - [10.16 Email Notifications](#1016-email-notifications)
    - [10.17 Reading History & Tracking](#1017-reading-history--tracking)
    - [10.18 Admin Panel](#1018-admin-panel)
    - [10.19 Caching Strategy (Redis)](#1019-caching-strategy-redis)
    - [10.20 Rate Limiting](#1020-rate-limiting)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Environment Variables](#12-environment-variables)
13. [Getting Started (Local Development)](#13-getting-started-local-development)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Future Work](#15-future-work)

---

## 1. Project Overview

**DraftDock** is a modern, feature-rich, full-stack blogging platform designed to empower writers, developers, and content creators. It goes well beyond a standard blog by combining:

- A powerful Markdown-based rich-text blog editor
- An AI writing assistant (title generation, tag suggestions, grammar checks, summary generation, cover image creation)
- A real-time messaging system between users
- A social graph (follow/unfollow authors, personalized feed)
- A gamification engine (XP points, writer levels, badges/achievements)
- A comprehensive analytics dashboard for authors
- A co-authoring system for collaborative blog writing
- A premium content and subscription model
- A tipping system for readers to support authors
- Text highlighting and annotation within blog articles
- Blog versioning with full restore capability
- An Admin panel for platform moderation
- Scheduled post publishing

The platform is built as a monorepo using Turborepo, with a TypeScript Express backend and a React + TypeScript frontend, deployed via Docker and Kubernetes.

**Live Use Cases the Platform Covers:**

| Role | What they can do |
|------|------------------|
| Reader | Browse, read, search, bookmark, comment, tip, highlight, follow authors |
| Author | Write/edit blogs, publish/draft, schedule, use AI tools, track analytics |
| Co-Author | Collaborate on invited blogs |
| Premium Author | Gate content behind paid subscriptions |
| Admin | Manage users, moderate content, view platform-wide stats |

---

## 2. Team Members & Contributions

| Name | Roll Number | Primary Contributions |
|------|-------------|----------------------|
| **Abhash Behera** | 2301020213 | Backend architecture, all core API routes, database schema design, Redis caching layer, WebSocket server, rate limiting middleware, Docker containerization, Kubernetes deployment configurations, CI/CD pipeline |
| **Suprit Kumar Naik** | 2301020457 | Frontend pages (Dashboard, Explore, Profile revamp), frontend-backend integration, API hooks, component wiring, contributed additional backend routes |
| **SK Mustakim Ali** | 2301020456 | Frontend UI components, Radix UI integration, TailwindCSS styling, sidebar, navigation shell, new component library (`new-components`), responsive design |
| **Abhinash Parida** | 2301020214 | Mock UI prototypes, component testing, user flow testing, project documentation |
| **Soumya Ranjan Sahoo** | 2301020173 | Mock UI prototypes, component testing, integration testing, project documentation |

**Institution**: C.V. Raman Global University

---

## 3. Technology Stack

### Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Node.js | 22.x | JavaScript runtime |
| Language | TypeScript | 5.8.x | Type-safe development |
| Framework | Express | 5.1.x | HTTP server and routing |
| ORM | Prisma | 6.7.x | Database access and migrations |
| Database | PostgreSQL (Neon) | 16 | Primary relational database |
| Cache | Redis | 5.x | Caching and session-adjacent state |
| Auth | Clerk (Express SDK) | 1.4.x | Authentication and user management |
| WebSocket | ws | 8.18.x | Real-time messaging and notifications |
| AI | Google Gemini API (`@google/generative-ai`) | 0.24.x | AI writing features |
| AI (alt) | OpenAI SDK | 6.32.x | Alternative AI provider |
| Email | Nodemailer | 7.x | Transactional email (publish notifications) |
| Rate Limiting | express-rate-limit | 8.3.x | API abuse prevention |
| Containerization | Docker | latest | Containerized deployment |
| Orchestration | Kubernetes | latest | Production cluster management |

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Language | TypeScript | 5.x | Type-safe development |
| Framework | React | 19.1.x | UI library |
| Build Tool | Vite | 6.x | Fast dev server and bundler |
| Styling | TailwindCSS | 4.x | Utility-first CSS |
| UI Primitives | Radix UI | Various | Accessible headless components |
| Animations | Framer Motion | 12.x | Page and element animations |
| Charts | Recharts | 3.x | Analytics data visualizations |
| Auth | Clerk React SDK | 5.31.x | Authentication UI and hooks |
| HTTP | Axios | 1.9.x | API requests |
| Routing | React Router DOM | 7.6.x | Client-side routing |
| Markdown Editor | @uiw/react-md-editor | 4.x | Blog writing editor |
| Markdown Render | rehype-sanitize | 6.x | Safe HTML rendering |
| Syntax Highlight | highlight.js | 11.x | Code block highlighting |
| Storage | Supabase JS | 2.x | File/image upload storage |
| Payments | Stripe React + JS | 3.x / 7.x | Premium subscriptions and tipping |
| Toast | Sonner | 2.x | User notifications |
| Icons | Lucide React | 0.510.x | Icon set |
| SEO | react-helmet-async | 3.x | Dynamic meta tags |

### Infrastructure & DevOps

| Tool | Purpose |
|------|---------|
| Turborepo | Monorepo build system and task orchestration |
| Docker & Docker Compose | Local and production containerization |
| Kubernetes (GKE) | Production cluster on Google Cloud |
| Kubernetes Ingress + Managed Cert | HTTPS termination |
| Neon PostgreSQL | Serverless Postgres with connection pooling |
| Redis (managed) | Caching layer |

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                             │
│              React 19 + TypeScript + Vite SPA                       │
│     (Clerk auth, React Router, Radix UI, TailwindCSS, Recharts)     │
└───────────────────────┬──────────────────────┬──────────────────────┘
                        │ HTTPS REST API        │ WebSocket (ws://)
                        ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend (Node.js / Express 5)                   │
│           TypeScript — Clerk Middleware — Rate Limiter               │
│                                                                     │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────────┐   │
│  │  REST Routes │  │  WebSocket  │  │  Background Scheduler    │   │
│  │  (20+ route  │  │  Server     │  │  (scheduled post, follower│  │
│  │   modules)   │  │  (port 3001)│  │   snapshots)             │   │
│  └──────┬───────┘  └─────────────┘  └──────────────────────────┘   │
│         │                                                           │
│  ┌──────▼───────┐  ┌─────────────┐  ┌──────────────────────────┐   │
│  │   Prisma ORM │  │ Redis Client│  │  AI Service Layer        │   │
│  │  (query layer│  │ (cache/TTL) │  │  (Gemini / OpenAI)       │   │
│  └──────┬───────┘  └─────────────┘  └──────────────────────────┘   │
└─────────┼───────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────────┐
│              Data Layer                                             │
│   PostgreSQL (Neon)          Redis (managed)                        │
│   - Main relational DB       - Blog list cache (10 min TTL)         │
│   - Prisma migrations        - Individual blog cache (10 min)       │
│   - Connection pooling       - Search results (2 min)               │
│                              - User blog lists (2 min)               │
│                              - Notifications (1 min)                │
│                              - Leaderboard (5 min)                   │
│                              - Personalized feed (5 min)             │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. Client sends HTTP request to Express backend.
2. Clerk middleware authenticates JWT from request header — sets `req.auth`.
3. Global rate limiter checks request frequency per IP.
4. Route-specific middleware (e.g., `writeLimiter` for mutation endpoints).
5. Route handler calls `syncUser(req)` — syncs Clerk user to local Postgres `User` record.
6. Redis is checked for cached response; on hit, responds immediately.
7. On cache miss, Prisma queries PostgreSQL; response is cached and returned.
8. Mutations invalidate relevant cache keys via `invalidateUserBlogsCache` / `invalidatePublicBlogsCache`.
9. Side effects (notifications, emails, achievement checks, WebSocket broadcasts) fire asynchronously.

### WebSocket Architecture

- A separate WebSocket server runs on port `3001`.
- Each authenticated user registers their connection in an in-memory `userConnections` map (keyed by `userId`).
- When a server event occurs (new message, new follow, new notification), the server pushes a targeted JSON payload to the relevant user's WebSocket connection.
- The frontend listens on this connection and updates React state in real time.

---

## 5. Repository Structure

```
project-root/
├── turbo.json                  # Turborepo pipeline config
├── package.json                # Root workspace config
├── docker-compose.yml          # Local full-stack Docker Compose
│
├── apps/
│   ├── backend/                # Express + TypeScript API server
│   │   ├── src/
│   │   │   ├── server.ts       # App entry point, route mounting
│   │   │   ├── sync.ts         # Clerk ↔ Prisma user syncing
│   │   │   ├── email.ts        # Nodemailer email utilities
│   │   │   ├── cleanup.ts      # DB cleanup utilities
│   │   │   ├── routes/         # All API route modules
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts   # Prisma client singleton
│   │   │   │   ├── redis.ts    # Redis client singleton
│   │   │   │   ├── websocket.ts# WebSocket server + helpers
│   │   │   │   └── scheduler.ts# Cron-like scheduled tasks
│   │   │   ├── middleware/
│   │   │   │   ├── rateLimiter.ts
│   │   │   │   └── requireAdmin.ts
│   │   │   └── services/
│   │   │       ├── ai.service.ts        # AI provider abstraction
│   │   │       ├── readability.service.ts
│   │   │       └── achievement.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Full database schema
│   │   │   └── migrations/     # Prisma migration history
│   │   ├── Dockerfile
│   │   └── deployment/         # K8s manifests
│   │       ├── backend-deployment.yaml
│   │       ├── backend-service.yaml
│   │       ├── redis-deployment.yaml
│   │       ├── redis-service.yaml
│   │       └── ingress.yaml
│   │
│   └── frontend/               # React + TypeScript SPA
│       ├── src/
│       │   ├── App.tsx          # Root router
│       │   ├── main.tsx         # React entry point
│       │   ├── pages/           # Page-level components
│       │   ├── components/      # Shared UI components
│       │   │   ├── layout/      # AppShell, NewAppShell
│       │   │   ├── editor/      # Blog editor components
│       │   │   ├── new-components/ # Revamped pages
│       │   │   ├── social/      # Social interaction components
│       │   │   └── ui/          # Radix-based primitives
│       │   ├── context/         # React context providers
│       │   ├── hooks/           # Custom React hooks
│       │   └── lib/             # Utility functions
│       ├── Dockerfile
│       └── nginx.conf           # Nginx config for production SPA
│
├── packages/
│   ├── ui/                      # Shared component library
│   ├── eslint-config/           # Shared ESLint configs
│   └── typescript-config/       # Shared tsconfig bases
│
├── deployment/
│   ├── docker-compose.ec2.yml   # EC2 deployment config
│   └── nginx.conf               # Top-level nginx config
│
└── docs/
    ├── webrtc-calling-plan.md   # Future feature planning doc
    └── PROJECT_README.md        # This document
```

---

## 6. Database Schema

The database uses PostgreSQL managed by **Neon** (serverless Postgres), accessed exclusively through **Prisma ORM**. All relations are defined with proper indexes for query performance.

### Entity Relationship Overview

```
User ──┬── Blog (1:N, as author)
       ├── CoAuthor (M:N via blogs, as collaborator)
       ├── Comment (1:N)
       ├── Bookmark (1:N)
       ├── Follow (M:N self-referential — followers/following)
       ├── Notification (1:N)
       ├── ReadingHistory (1:N)
       ├── Message (1:N, as sender / receiver)
       ├── Conversation (M:N — participant1/participant2)
       ├── Highlight (1:N)
       ├── UserAchievement (M:N via achievements)
       ├── PersonalizedScore (1:N, per tag)
       ├── PremiumAccess (1:N, subscribed creator plans)
       ├── Subscription (1:N, created plans)
       ├── Tip (1:N, as tipper / receiver)
       ├── Series (1:N)
       └── FollowerSnapshot (1:N, time-series)

Blog ──┬── Tag (M:N)
       ├── Comment (1:N)
       ├── Bookmark (1:N)
       ├── CoAuthor (1:N)
       ├── BlogVersion (1:N — version history)
       ├── Highlight (1:N)
       ├── ReadingHistory (1:N)
       └── Series (N:1)
```

### Model Details

#### `User`
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `email` | String (unique) | User email (synced from Clerk) |
| `name` | String? | Display name |
| `bio` | String? | Author bio |
| `profilePicture` | String? | Avatar URL |
| `role` | Enum (AUTHOR, ADMIN, CONTRIBUTOR) | Access role |
| `isVerified` | Boolean | Verified badge status |
| `writerXP` | Int | Accumulated experience points |
| `writerLevel` | Int | Computed level from XP |
| `readingStreak` | Int | Current consecutive reading days |
| `longestStreak` | Int | All-time best streak |
| `lastReadDate` | DateTime? | Last date user read a blog |
| `createdAt` | DateTime | Account creation timestamp |

#### `Blog`
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `title` | String | Blog title |
| `content` | String | Full Markdown content |
| `summary` | String? | Short description / abstract |
| `coverImage` | String? | Cover image URL |
| `published` | Boolean | Whether publicly visible |
| `featured` | Boolean | Admin-featured flag |
| `isPremium` | Boolean | Premium-gated content flag |
| `views` | Int | Total view counter |
| `likes` | Int | Total like counter |
| `readabilityScore` | Float? | Flesch-Kincaid readability score |
| `readingCompletions` | Int | Count of users who finished reading |
| `scheduledAt` | DateTime? | Scheduled publish time |
| `seriesId` | String? | FK to Series |
| `seriesOrder` | Int? | Order within the series |
| `authorId` | String | FK to User |

#### `Tag`
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `name` | String (unique) | Tag label (lowercase) |

Tags are stored in lowercase and connected to blogs via an implicit M:N join table (`BlogToTag`).

#### `Comment`
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `content` | String | Comment text |
| `authorId` | String | FK to User |
| `blogId` | String | FK to Blog |

#### `Bookmark`
Unique constraint on (`userId`, `blogId`) — a user can bookmark a blog only once.

#### `Notification`
| Field | Type | Description |
|-------|------|-------------|
| `message` | String | Notification text |
| `read` | Boolean | Read/unread status |
| `userId` | String | FK to target User |

#### `Follow`
Unique constraint on (`followerId`, `followingId`) — no duplicate follows allowed.

#### `ReadingHistory`
Unique constraint on (`userId`, `blogId`) — one history record per user+blog.

#### `Series`
Groups multiple blogs into ordered series from a single author.

#### `BlogVersion`
Each version snapshot stores the full `title` and `content` at a point in time. Unique on (`blogId`, `version`).

#### `CoAuthor`
Invitation-based collaboration record.
| Field | Type | Description |
|-------|------|-------------|
| `role` | Enum (CO_AUTHOR, CONTRIBUTOR) | Collaboration role |
| `status` | Enum (PENDING, ACCEPTED, DECLINED) | Invite status |

#### `Conversation` + `Message`
A `Conversation` links exactly two participants. `Message` records are stored per conversation with sender/receiver FKs and a `read` flag.

#### `Achievement` + `UserAchievement`
`Achievement` defines platform-wide badges (name, description, icon, XP reward, criteria string). `UserAchievement` tracks which user has earned which badge (unique on `userId + achievementId`).

#### `Highlight`
Text range highlights on a blog article — stores `startOffset`, `endOffset`, the highlighted `text`, and an optional `note`.

#### `DailyViewStat`
Time-series view counts keyed by `(blogId, date)` — used for the analytics charts.

#### `FollowerSnapshot`
Time-series follower count keyed by `(userId, date)` — used for the follower growth chart.

#### `Subscription` + `PremiumAccess`
`Subscription` defines a creator's tier (name, description, price). `PremiumAccess` records which user has subscribed to which plan and its expiry.

#### `Tip`
Stores one-time tip transactions between users: tipper → receiver, amount in cents, optional message.

#### `PersonalizedScore`
Per-user per-tag affinity scores used for the personalized feed algorithm.

---

## 7. Authentication & Authorization

### Authentication Provider: Clerk

All authentication is delegated to **Clerk**, a third-party auth service that handles:
- Sign-up and sign-in flows (email/password + OAuth providers)
- JWT token issuance and verification
- Session management
- Profile management (name, avatar)

The backend uses `@clerk/express` middleware:

```typescript
app.use(clerkMiddleware()); // Applied globally
router.use(requireAuth());  // Applied per protected route
```

### User Sync

When an authenticated user calls any protected endpoint, the `syncUser(req)` utility:
1. Extracts the Clerk `userId` from `req.auth`.
2. Fetches the Clerk user profile (name, email, profile picture).
3. Upserts a `User` record in the local PostgreSQL database.
4. Returns the local `User` object for use in business logic.

This ensures the database always has an up-to-date record for every Clerk user.

### Roles

| Role | Description | Access |
|------|-------------|--------|
| `AUTHOR` | Default role for all new users | Can create and manage their own content |
| `CONTRIBUTOR` | Contributor-level access | Can contribute to invited co-authored blogs |
| `ADMIN` | Platform administrators | Full access — admin panel, user management, blog moderation |

Admin routes are protected by the `requireAdmin` middleware, which checks `user.role === 'ADMIN'` on the local database record.

### Frontend Auth Guard Components

- `RequireAuth` — wraps routes that need a logged-in user; redirects unauthenticated visitors to the Clerk sign-in page.
- `RequireAdmin` — wraps admin routes; redirects non-admin users.
- `HomeRedirector` — landing component that redirects authenticated users to `/explore` and unauthenticated users to the landing page.

---

## 8. Backend — API Reference

**Base URL**: `https://<domain>/api`
**Authentication**: Bearer JWT via Clerk (for protected endpoints)
**Rate Limiting**:
- `globalLimiter`: 200 requests / 15 minutes per IP (all routes)
- `authLimiter`: Stricter limit on auth-sensitive routes
- `writeLimiter`: Applied to all mutation endpoints (POST/PUT/PATCH/DELETE)

---

### 8.1 Blogs API

**Prefix**: `/api/blogs`

#### `GET /api/blogs`
- **Auth**: Public
- **Description**: Returns all published blogs, sorted by `updatedAt` descending. Excludes the heavy `content` column from list responses for performance.
- **Cache**: Redis key `blogs:all`, TTL **600 seconds**
- **Response**: Array of blog objects (`id`, `title`, `summary`, `coverImage`, `published`, `likes`, `views`, `createdAt`, `updatedAt`, `authorId`, `author`, `tags`)
- **Status Codes**: `200 OK`, `500 Internal Server Error`

#### `GET /api/blogs/trending`
- **Auth**: Public
- **Description**: Returns the top 6 most-viewed blogs published within the last 7 days. Used on the explore/home page.
- **Cache**: Redis key `blogs:trending`, TTL **120 seconds**
- **Response**: Array of up to 6 blog objects, ordered by `views` descending
- **Status Codes**: `200 OK`, `500 Internal Server Error`

#### `GET /api/blogs/featured`
- **Auth**: Public
- **Description**: Returns up to 6 blogs with `featured: true`, as set by admins. Used to highlight curated content.
- **Cache**: Redis key `blogs:featured`, TTL **300 seconds**
- **Response**: Array of up to 6 featured blog objects
- **Status Codes**: `200 OK`, `500 Internal Server Error`

#### `GET /api/blogs/search?q=<query>`
- **Auth**: Public
- **Query Params**: `q` (string) — search query
- **Description**: Full-text search across blog `title` and `content` (case-insensitive `contains`). Returns up to 20 results.
- **Cache**: Redis key `search:<q>`, TTL **120 seconds**
- **Response**: Array of matching blog objects
- **Status Codes**: `200 OK`, `500 Internal Server Error`

#### `GET /api/blogs/by-tag/:tag`
- **Auth**: Public
- **Description**: Returns all published blogs tagged with the given tag name (case-insensitive).
- **Cache**: Redis key `blogs:tag:<tag>`, TTL **300 seconds**
- **Response**: Array of blog objects
- **Status Codes**: `200 OK`, `500 Internal Server Error`

#### `GET /api/blogs/:blogId`
- **Auth**: Public
- **Description**: Fetches a single blog by ID, including its full `content`, author, tags, and series details.
- **Cache**: Redis key `blog:<id>`, TTL **600 seconds**
- **Response**: Full blog object with `content`, `author`, `tags`, `series`
- **Status Codes**: `200 OK`, `404 Not Found`, `500 Internal Server Error`

#### `POST /api/blogs/:blogId/view`
- **Auth**: Public
- **Description**: Increments the view counter for a blog by 1. Called when a user opens a blog article. Also invalidates the individual blog cache.
- **Response**: `{ views: number }`
- **Status Codes**: `200 OK`, `404 Not Found`, `500 Internal Server Error`

#### `GET /api/blogs/:id/related`
- **Auth**: Public
- **Description**: Returns up to 4 related published blogs that share at least one tag with the given blog. Ordered by `views` descending.
- **Response**: Array of blog objects with author and tags
- **Status Codes**: `200 OK`, `404 Not Found`, `500 Internal Server Error`

#### `POST /api/blogs`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ title, content, published?, coverImage?, summary?, scheduledAt?, readabilityScore? }`
- **Description**: Creates a new blog. If `published: true`, a notification is created for the author, a publish confirmation email is sent, the public blog cache is invalidated, and the achievement engine is triggered.
- **Response**: `{ message, blog: { id, title, content, published, createdAt, updatedAt } }`
- **Status Codes**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`

#### `PUT /api/blogs/:id`
- **Auth**: Required (owner only)
- **Rate Limit**: `writeLimiter`
- **Request Body**: Any subset of `{ title, content, published, coverImage, summary, scheduledAt, readabilityScore }`
- **Description**: Updates an existing blog. Only the owner (by `authorId`) can update. Invalidates individual blog cache, user blog cache, and public blog cache.
- **Response**: Updated blog object
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

#### `PATCH /api/blogs/:id/publish`
- **Auth**: Required (owner only)
- **Rate Limit**: `writeLimiter`
- **Description**: Sets a draft blog's `published` flag to `true`. Triggers notification, email, cache invalidation, and achievement checks.
- **Response**: `{ message, blog }`
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

#### `DELETE /api/blogs/:id`
- **Auth**: Required (owner only)
- **Rate Limit**: `writeLimiter`
- **Description**: Hard-deletes a blog and all its cascade-deleted relations (versions, highlights, co-authors). Invalidates all related caches.
- **Response**: `{ message }`
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

#### `PUT /api/blogs/:id/tags`
- **Auth**: Required (owner only)
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ tags: string[] }` — array of tag name strings
- **Description**: Replaces the blog's tag set. Tags are upserted by name (lowercased). The `tags:all` cache key is also invalidated.
- **Response**: `{ message, tags }`
- **Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

#### `PUT /api/blogs/:id/series`
- **Auth**: Required (owner only)
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ seriesId?: string, seriesOrder?: number }`
- **Description**: Assigns or removes a blog from a series and sets its ordering within the series.
- **Response**: Updated blog object
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

#### Blog Versioning

##### `GET /api/blogs/:id/versions`
- **Auth**: Required (owner only)
- **Description**: Returns all saved version snapshots for a blog, sorted newest-first.
- **Response**: Array of `{ id, version, title, content, createdAt }`

##### `POST /api/blogs/:id/versions`
- **Auth**: Required (owner only)
- **Description**: Snapshots the current `title` and `content` as a new numbered version. The version number auto-increments.
- **Response**: The newly created `BlogVersion` object

##### `POST /api/blogs/:id/versions/:versionId/restore`
- **Auth**: Required (owner only)
- **Description**: Restores the blog to a past version's `title` and `content`. The current state is saved as a new version first (to prevent data loss before overwriting).
- **Response**: `{ message, blog }`

---

### 8.2 User API

**Prefix**: `/api/user`

#### `GET /api/user`
- **Auth**: Required
- **Rate Limit**: `authLimiter`
- **Description**: Syncs the Clerk user into the local database and returns the full local `User` record.
- **Response**: Full `User` object
- **Status Codes**: `200 OK`, `401 Unauthorized`

#### `PATCH /api/user/profile`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ name?, bio? }`
- **Description**: Updates the user's `name` and/or `bio`. Invalidates the `author:<id>` Redis cache.
- **Response**: `{ id, email, name, bio }`

#### `GET /api/user/blogs`
- **Auth**: Required
- **Description**: Returns all blogs (published and drafts) authored by the current user. Cached for 120 seconds.
- **Response**: `{ blogs: Blog[] }`

#### `GET /api/user/blogs/published`
- **Auth**: Required
- **Description**: Returns only published blogs for the current user. Cached for 600 seconds.
- **Response**: `{ blogs: Blog[] }`

#### `GET /api/user/blogs/drafts`
- **Auth**: Required
- **Description**: Returns only unpublished (draft) blogs for the current user. Not cached.
- **Response**: `{ blogs: Blog[] }`

---

### 8.3 Bookmarks API

**Prefix**: `/api/user/bookmarks`

#### `GET /api/user/bookmarks`
- **Auth**: Required
- **Description**: Returns all blogs bookmarked by the current user, sorted by bookmark creation date descending. Includes full blog metadata and author info.
- **Response**: Array of blog objects

#### `POST /api/user/bookmarks`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ blogId: string }`
- **Description**: Bookmarks a blog. Uses an upsert so bookmarking an already-bookmarked blog is idempotent.
- **Response**: The `Bookmark` record
- **Status Codes**: `201 Created`, `400 Bad Request`

#### `DELETE /api/user/bookmarks/:blogId`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Description**: Removes the bookmark for the given blog.
- **Response**: `{ message }`

#### `GET /api/user/bookmarks/ids`
- **Auth**: Required
- **Description**: Returns an array of just the `blogId` strings the user has bookmarked. Used by the frontend to efficiently check bookmark state.
- **Response**: `string[]`

---

### 8.4 Comments API

**Prefix**: `/api/comments` and `/api/blogs`

#### `GET /api/comments/blog/:id`
- **Auth**: Public
- **Description**: Returns all comments for a given blog, sorted oldest-first, with author name and email.
- **Response**: Array of comment objects with author details

#### `POST /api/comments/blog/:id`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ content: string }`
- **Description**: Creates a new comment on a blog. After creation, the achievement engine is triggered for both the commenter and the blog's author.
- **Response**: The created comment with author details
- **Status Codes**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

#### `DELETE /api/comments/:id`
- **Auth**: Required (comment owner only)
- **Rate Limit**: `writeLimiter`
- **Description**: Deletes a comment. Only the comment's author can delete it.
- **Response**: `{ message }`
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`

---

### 8.5 Notifications API

**Prefix**: `/api/user/notifications`

#### `GET /api/user/notifications`
- **Auth**: Required
- **Description**: Returns all notifications for the current user along with an `unreadCount`. Results are served from the notification cache (Redis) when available.
- **Response**: `{ notifications: Notification[], unreadCount: number }`

#### `PATCH /api/user/notifications/read-all`
- **Auth**: Required
- **Description**: Marks all unread notifications for the current user as read. Invalidates the notification cache.
- **Response**: `{ message }`

#### `DELETE /api/user/notifications/:id`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Description**: Deletes a specific notification. Only deletes if it belongs to the current user. Invalidates the notification cache.
- **Response**: `{ success, message }`

---

### 8.6 Follow System API

**Prefix**: `/api/user/follow`

#### `POST /api/user/follow`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ userId: string }` — the user to follow
- **Description**: Follows a user. Uses an upsert to prevent duplicate follows. Creates a notification for the followed user and broadcasts it via WebSocket. Invalidates the target user's author cache. Triggers achievement checks for both users.
- **Response**: `{ message, follow }`
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found`

#### `DELETE /api/user/follow/unfollow/:userId`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Description**: Removes the follow relationship. Invalidates the target user's author cache.
- **Response**: `{ message }`

#### `GET /api/user/follow/followers`
- **Auth**: Required
- **Description**: Returns a list of users who follow the current user, with their profile info.
- **Response**: Array of `{ id, email, name, profilePicture, bio }`

#### `GET /api/user/follow/following`
- **Auth**: Required
- **Description**: Returns a list of users the current user is following.
- **Response**: Array of `{ id, email, name, profilePicture, bio }`

---

### 8.7 AI Writing Assistant API

**Prefix**: `/api/ai`

All AI endpoints use the `writeLimiter` rate limit. They are powered by a pluggable `AIProvider` abstraction that supports both **Google Gemini** and **OpenAI**, switchable via environment configuration.

#### `POST /api/ai/suggest-titles`
- **Auth**: Not required (but rate limited)
- **Request Body**: `{ content: string }`
- **Description**: Sends the blog content to the AI model and receives a list of suggested titles. Useful for authors struggling to name their post.
- **Response**: `{ titles: string[] }`

#### `POST /api/ai/suggest-tags`
- **Auth**: Not required
- **Request Body**: `{ content: string }`
- **Description**: Analyzes the blog content and recommends semantically relevant tags. Helps authors categorize content accurately.
- **Response**: `{ tags: string[] }`

#### `POST /api/ai/generate-summary`
- **Auth**: Not required
- **Request Body**: `{ content: string }`
- **Description**: Generates a concise 2–3 sentence summary/abstract of the blog content. Used to auto-populate the blog's `summary` field.
- **Response**: `{ summary: string }`

#### `POST /api/ai/readability`
- **Auth**: Not required
- **Request Body**: `{ content: string }`
- **Description**: Analyzes the blog content **locally** (no external API call) using the `readability.service.ts` service. Computes a Flesch-Kincaid based readability score along with supporting metrics (word count, avg sentence length, avg syllables per word).
- **Response**: `{ score: number, wordCount: number, sentenceCount: number, avgWordsPerSentence: number, readingLevel: string }`

#### `POST /api/ai/grammar-check`
- **Auth**: Not required
- **Request Body**: `{ text: string }`
- **Description**: Checks the provided text for grammatical errors using the AI model and returns a list of suggestions for improvement.
- **Response**: `{ suggestions: string[] }`

#### `POST /api/ai/generate-image`
- **Auth**: Not required
- **Request Body**: `{ prompt: string }`
- **Description**: Generates a cover image for a blog based on a text prompt, using the AI provider's image generation capability.
- **Response**: `{ imageUrl: string }`

---

### 8.8 Analytics API

**Prefix**: `/api/analytics`

All analytics endpoints require authentication and operate on the authenticated user's data.

#### `GET /api/analytics/views`
- **Auth**: Required
- **Description**: Returns daily aggregated view counts across all of the user's blogs over the last 30 days. Data is sourced from the `DailyViewStat` time-series table.
- **Response**: `{ daily: { date: string, views: number }[], total: number }`

#### `GET /api/analytics/engagement`
- **Auth**: Required
- **Description**: Returns a composite engagement score computed as: `(comments×5 + bookmarks×4 + readingCompletions×6) / totalViews × 100`. Also returns the individual components.
- **Response**: `{ engagementRate, totalViews, commentCount, bookmarkCount, totalCompletions, blogCount }`

#### `GET /api/analytics/follower-growth`
- **Auth**: Required
- **Description**: Returns the user's historical follower counts from the `FollowerSnapshot` table (last 30 snapshots) plus the current real-time follower count.
- **Response**: `{ history: { date: string, count: number }[], current: number }`

#### `GET /api/analytics/reading-completion`
- **Auth**: Required
- **Description**: Returns per-blog reading completion rates for the user's top 10 most-viewed blogs. Completion rate = `readingCompletions / views × 100`.
- **Response**: Array of `{ id, title, views, completions, rate }`

#### `GET /api/analytics/reading-time`
- **Auth**: Required
- **Description**: Estimates average reading time per blog based on word count (assumes 200 WPM reading speed). Returns per-blog details and the overall average.
- **Response**: `{ blogs: { id, title, wordCount, readingTimeMin, views }[], avgReadingTime: number }`

#### `GET /api/analytics/leaderboard`
- **Auth**: Public
- **Query Params**: `period` (optional, default `all`)
- **Description**: Returns the top 20 writers on the platform ranked by `writerXP`. Includes rank, profile info, blog count, follower count, and level.
- **Cache**: Redis key `leaderboard:<period>`, TTL **300 seconds**
- **Response**: Array of ranked user objects

#### `GET /api/analytics/versions/:blogId`
- **Auth**: Required (owner only)
- **Description**: Lists all saved version snapshots for a blog (metadata only — no content).
- **Response**: Array of `{ id, version, title, createdAt }`

#### `POST /api/analytics/versions/:blogId`
- **Auth**: Required (owner only)
- **Description**: Saves a new version snapshot of the current blog state.
- **Response**: The new `BlogVersion` object

#### `POST /api/analytics/versions/:blogId/restore/:versionId`
- **Auth**: Required (owner only)
- **Description**: Restores a blog to a specific version. Saves the current state as a new snapshot before overwriting.
- **Response**: `{ message, blog }`

---

### 8.9 Messaging API

**Prefix**: `/api/messaging`

Real-time delivery is handled via WebSocket (port 3001). REST endpoints manage conversation state and message persistence.

#### `GET /api/messaging/conversations`
- **Auth**: Required
- **Description**: Returns all conversations the current user participates in, with the other participant's profile info and the last message preview. Sorted by `lastMessageAt` descending.
- **Response**: Array of `{ id, otherUser, lastMessage, lastMessageAt }`

#### `POST /api/messaging/conversations`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ userId: string }` — the user to start a conversation with
- **Description**: Creates a new conversation between the current user and the target user, or returns the existing one if it already exists (idempotent).
- **Response**: The `Conversation` object

#### `GET /api/messaging/conversations/:id/messages`
- **Auth**: Required (participant only)
- **Description**: Returns up to 100 messages in a conversation, sorted chronologically. Also marks all unread messages (where `receiverId === currentUser.id`) as read.
- **Response**: Array of message objects with sender profile info

#### `POST /api/messaging/conversations/:id/messages`
- **Auth**: Required (participant only)
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ content: string }`
- **Description**: Sends a message in a conversation. After persisting to the database, the message is broadcast to the receiver's WebSocket connection in real time. The `conversation.lastMessageAt` is also updated.
- **Response**: The created `Message` object with sender info
- **Real-time**: Pushes `{ type: 'new_message', message }` to receiver's WebSocket

---

### 8.10 Discovery & Recommendations API

**Prefix**: `/api/discovery`

#### `GET /api/discovery/personalized-feed`
- **Auth**: Required
- **Description**: Generates a personalized blog feed based on two signals:
  1. **Follow graph**: Includes blogs from authors the user follows
  2. **Tag affinity**: Based on the last 20 blogs read, computes per-tag affinity scores and surfaces blogs matching the top 5 tags

  Already-read blogs are excluded from the feed. Results are sorted by `updatedAt` descending.
- **Cache**: Redis key `feed:<userId>`, TTL **300 seconds**
- **Response**: Array of up to 20 blog objects

#### `GET /api/discovery/recommended-authors`
- **Auth**: Required
- **Description**: Suggests up to 6 authors the user doesn't already follow. Candidates are ranked by their follower count. Only authors with at least one published blog are included.
- **Response**: Array of `{ id, name, email, profilePicture, bio, isVerified, writerLevel, blogCount, followerCount }`

---

### 8.11 Achievements API

**Prefix**: `/api/achievements`

#### `GET /api/achievements/user`
- **Auth**: Required
- **Description**: Returns all achievements earned by the current user, including achievement metadata (name, description, icon, XP reward), sorted by most recently awarded.
- **Response**: Array of achievement objects with `earnedAt` timestamp

#### `GET /api/achievements/all`
- **Auth**: Public
- **Description**: Returns the full catalogue of all possible achievements on the platform, sorted by XP reward ascending.
- **Response**: Array of `Achievement` objects

---

### 8.12 Highlights API

**Prefix**: `/api/highlights`

#### `GET /api/highlights/blog/:blogId`
- **Auth**: Public
- **Description**: Returns all text highlights that users have created on a given blog article. Includes the user's name for display.
- **Response**: Array of highlight objects with user info

#### `POST /api/highlights`
- **Auth**: Required
- **Request Body**: `{ blogId, text, startOffset, endOffset, note? }`
- **Description**: Creates a new text highlight on a blog. After creation, awards the highlighter +2 XP as an incentive for engagement.
- **Response**: The created `Highlight` object
- **Status Codes**: `201 Created`, `400 Bad Request`

#### `DELETE /api/highlights/:id`
- **Auth**: Required (owner only)
- **Description**: Deletes a highlight. Only the user who created it can delete it.
- **Response**: `{ message }`

---

### 8.13 Series API

**Prefix**: `/api/series`

#### `POST /api/series`
- **Auth**: Required
- **Rate Limit**: `writeLimiter`
- **Request Body**: `{ name: string, description?: string }`
- **Description**: Creates a new blog series for the current user.
- **Response**: The created `Series` object
- **Status Codes**: `201 Created`, `400 Bad Request`

#### `GET /api/series/:id`
- **Auth**: Public
- **Description**: Returns a series with its author info and all its published blogs, sorted by `seriesOrder` ascending.
- **Response**: Full `Series` object with `author` and `blogs[]`

---

### 8.14 Co-Authors API

**Prefix**: `/api/blogs` (for blog-scoped operations) and `/api/coauthors` (for invite management)

#### `POST /api/blogs/:blogId/coauthors`
- **Auth**: Required (blog owner only)
- **Request Body**: `{ inviteeEmail: string, role?: 'CO_AUTHOR' | 'CONTRIBUTOR' }`
- **Description**: Invites a registered user (by email) to co-author a blog. The invite is created with `status: PENDING`. A notification is sent to the invitee via the database and broadcast via WebSocket.
- **Response**: `{ coAuthor }`
- **Status Codes**: `201 Created`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`

#### `GET /api/blogs/:blogId/coauthors`
- **Auth**: Public
- **Description**: Returns all co-author records for a blog, including each co-author's profile info and their invite status.
- **Response**: Array of co-author objects with `user` details

#### `PATCH /api/coauthors/status/:id`
- **Auth**: Required (invitee only)
- **Request Body**: `{ status: 'ACCEPTED' | 'DECLINED' }`
- **Description**: Allows the invited user to accept or decline a co-authoring invitation. On acceptance, the blog owner is notified.
- **Response**: The updated `CoAuthor` record

---

### 8.15 Tags API

**Prefix**: `/api/tags`
- List all tags, create tags, and fetch blogs by tag. Tags are auto-created on blog save and lowercased for consistency.

---

### 8.16 Authors API

**Prefix**: `/api/authors`
- Fetch public author profiles including blog counts, follower counts, and published blog previews. Cached in Redis with the `author:<id>` key.

---

### 8.17 Admin API

**Prefix**: `/api/admin`
**Auth**: Required + Admin role
All admin routes are protected by both `requireAuth()` and `requireAdmin()` middleware.

#### `GET /api/admin/stats`
- **Description**: Returns platform-wide aggregate statistics.
- **Response**: `{ totalUsers, totalBlogs, totalComments, totalViews, newUsersThisWeek, newBlogsThisWeek }`

#### `GET /api/admin/users`
- **Description**: Returns a paginated, searchable list of all users with role filtering.
- **Query Params**: `page`, `limit`, `search`, `role`
- **Response**: `{ users, pagination: { page, limit, total, totalPages } }`

#### Additional Admin Endpoints
- `GET /api/admin/users/:id` — detailed user profile with full activity history
- `PATCH /api/admin/users/:id/role` — change a user's role
- `DELETE /api/admin/users/:id` — deactivate or delete a user
- `GET /api/admin/blogs` — list all blogs with moderation filters
- `PATCH /api/admin/blogs/:id/feature` — toggle the `featured` flag on a blog
- `DELETE /api/admin/blogs/:id` — hard-delete a blog

---

## 9. Frontend — Pages & Components

### 9.1 Pages

All pages are wrapped inside the `NewAppShell` layout component (or `AppShell` for legacy routes), which provides the sidebar navigation, right panel, header, and footer.

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/` | `HomeRedirector` | Auto | Redirects to `/explore` (authed) or `/landing` (guest) |
| `/landing` | `LandingPage` | Required | Hero landing page with platform introduction |
| `/explore` | `NewExplorePage` | Public | Main blog discovery page — search, trending, featured, all blogs |
| `/blog/:blogId` | `BlogView` | Public | Full blog reading view with comments, highlights, likes, bookmarks |
| `/create-blog` | `BlogForm` | Required | Rich text blog creation form with AI assistant panel |
| `/edit-blog/:blogId` | `BlogForm` | Required | Same form, pre-populated for editing an existing blog |
| `/dashboard` | `NewDashboardPage` | Required | Author analytics dashboard — charts, stats, blog management |
| `/profile` | `NewProfilePage` | Required | User profile with tabs: Published, Drafts, Achievements, Settings |
| `/bookmarks` | `NewBookmarksPage` | Required | Grid of bookmarked blogs |
| `/history` | `NewHistoryPage` | Required | Reading history timeline |
| `/messages` | `Messages` | Required | Real-time direct messaging interface |
| `/leaderboard` | `Leaderboard` | Public | Top writers ranked by XP and level |
| `/settings` | `Settings` | Required | Account settings — profile info, preferences |
| `/author/:userId` | `AuthorProfile` | Public | Public profile of an author |
| `/tags/:tagName` | `TagBlogs` | Public | All blogs with a specific tag |
| `/series/:id` | `SeriesPage` | Public | A blog series with ordered parts |
| `/admin` | `AdminDashboard` | Admin only | Platform admin panel |
| `/admin/users/:id` | `AdminUserDetails` | Admin only | Detailed view of a specific user |
| `/my-story` | `MyStory` | Public | Static About page |
| `/contact` | `Contact` | Public | Static Contact page |

### 9.2 Key Components

| Component | Description |
|-----------|-------------|
| `NewAppShell` | Revamped outer shell — sidebar, header, optional right panel and footer |
| `AppShell` | Legacy outer shell (used for specific older routes) |
| `SideBar` | Collapsible navigation sidebar with route links and user info |
| `BlogList` | Grid/list rendering of multiple blog cards |
| `BlogSkeleton` | Animated loading skeleton for blog cards |
| `Notifications` | Notification dropdown with real-time unread count badge |
| `NotificationTest` | Developer utility to test notification payloads |
| `UserContent` | Renders user-authored content sections in profile |
| `TypeWriter` | Typewriter animation for landing page copy |
| `RotatingWords` | Animated word cycler for hero text |
| `RequireAuth` | HOC/wrapper that gates routes behind Clerk authentication |
| `RequireAdmin` | HOC/wrapper that gates routes behind admin role check |
| `HomeRedirector` | Smart redirect component for the root path |
| `tag-input` | Custom tag input component for blog editor |
| `editor/` | Blog editor sub-components (toolbar, preview, AI panel, image uploader) |
| `CodeUploader` | Dedicated code snippet upload component |
| `social/` | Social interaction components (like button, share, follow button) |
| `ui/` | Low-level Radix UI-based primitives (Button, Dialog, Toast, Switch, etc.) |

### 9.3 Context Providers

The app uses React Context for lightweight global state management:

| Context | Purpose |
|---------|---------|
| `BlogCacheContext` | Caches fetched blog data in memory to avoid redundant API calls during navigation |
| `PageCacheContext` | Caches page-level data (e.g., entire list page responses) across route changes |
| `LikeContext` | Tracks the current user's liked blog IDs for instant UI feedback |
| `BookmarkContext` | Tracks the current user's bookmarked blog IDs for instant UI feedback |

---

## 10. Feature Deep-Dives

### 10.1 Blog Editor

The blog editor at `/create-blog` and `/edit-blog/:blogId` is built on `@uiw/react-md-editor`, providing:
- **Live split-pane preview**: Write Markdown on the left, see rendered HTML on the right simultaneously
- **Syntax-highlighted code blocks**: Powered by `highlight.js` for 190+ programming languages
- **Tag input**: Custom multi-tag input with autocomplete suggestions from existing platform tags
- **Cover image upload**: Drag-and-drop cover image upload to Supabase Storage
- **AI assistant panel**: Inline AI tools accessible from the editor toolbar (see 10.2)
- **Readability meter**: Live Flesch-Kincaid score displayed as the author types
- **Schedule toggle**: Date/time picker to schedule a blog for future publishing
- **Series assignment**: Dropdown to assign a blog to a series and set its order
- **Draft auto-save**: Changes can be saved as a draft at any point
- **Version snapshot**: Manual "save version" button to checkpoint the current state

### 10.2 AI Writing Assistant

Accessible from within the blog editor, the AI assistant provides six tools:

1. **Title Suggester**: Pastes the blog content to Gemini/OpenAI and returns 5 title variants. The author can click any to apply it instantly.
2. **Tag Recommender**: Analyzes content semantics and suggests up to 8 relevant tags. One-click to add suggested tags.
3. **Summary Generator**: Produces a 2–3 sentence executive summary. One-click to insert into the summary field.
4. **Grammar Checker**: Submits a text selection to the AI and returns inline suggestions in a side panel.
5. **Readability Analyzer**: Runs locally (no API call) — computes Flesch-Kincaid score, word count, sentence count, average words per sentence, and maps the score to a reading level label (e.g., "7th Grade", "College", "Very Easy").
6. **Cover Image Generator**: Text-prompt-based image generation for creating custom cover art.

The AI service uses a provider pattern (`getAIProvider()` factory) that abstracts over both Google Gemini and OpenAI backends, allowing the platform to switch or fallback between providers via environment variables.

### 10.3 Real-Time Messaging

The messaging system provides WhatsApp-style direct messaging between users:
- **Conversation List**: Left panel shows all conversations sorted by most recent message
- **Message Thread**: Right panel shows chronological chat history with the selected user
- **Real-time delivery**: Messages sent via REST are simultaneously pushed via WebSocket to the active recipient. If the recipient has the conversation open, they see the message appear instantly without polling.
- **Read receipts**: Messages are marked `read: true` when the recipient opens the conversation
- **Message persistence**: All messages are stored in PostgreSQL (`Message` table)
- **Unread count**: The Messages nav item shows the total unread message count as a badge
- **Create conversation**: Initiating contact with another user creates a `Conversation` record (idempotent — reopens existing conversation if it exists)

### 10.4 Real-Time Notifications

Notifications are generated server-side for:
- New follower: `"<User> started following you."`
- Blog published: `"Your blog '<title>' was successfully published."`
- Co-author invitation: `"<User> invited you to co-author '<blog title>'."`
- Co-author accepted: `"<User> accepted your invitation to co-author '<blog title>'."`

**Delivery flow**:
1. A `Notification` record is created in PostgreSQL.
2. `broadcastNotificationUpdate(userId)` is called, which:
   - Invalidates the `notifications:<userId>` Redis cache
   - Pushes a `{ type: 'notification_update' }` WebSocket message to all of the user's active connections
3. The frontend WebSocket listener receives the push and re-fetches the notification list from the REST API.
4. The notification bell icon badge count updates instantly.

### 10.5 Gamification (XP, Levels & Achievements)

The platform uses a gamification system to incentivize quality writing and engagement.

**XP Events** (examples):
| Action | XP Awarded |
|--------|-----------|
| Publishing a blog | +10 XP |
| Receiving a comment | +5 XP |
| Getting followed | +3 XP |
| Creating a text highlight | +2 XP |
| Receiving a bookmark | +2 XP |

**Writer Levels**: XP accumulates into `writerXP` on the `User` model. `writerLevel` is computed from XP thresholds and displayed on profiles and the leaderboard.

**Achievements**: The `checkAndAwardAchievements(userId)` service is called asynchronously after relevant events. It evaluates criteria defined in the `Achievement` table (e.g., "Published 10 blogs", "Gained 100 followers") and awards `UserAchievement` records with XP bonuses. Achievements are displayed as badges on the user's profile.

### 10.6 Blog Versioning

Authors can maintain a full history of their blog's content:
- **Manual snapshots**: Click "Save Version" in the editor to create a numbered snapshot of the current `title` and `content`.
- **Version list**: The version history panel shows all snapshots with version number, title, and timestamp.
- **Restore**: Clicking restore on a past version:
  1. Saves the current state as a new version (prevents data loss)
  2. Overwrites the blog's `title` and `content` with the historical version
  3. Invalidates the blog cache
- **Version storage**: `BlogVersion` records cascade-delete when the parent blog is deleted.

### 10.7 Co-Authoring System

Enables collaboration on a single blog between multiple registered users:

1. **Invite flow**: The blog owner sends a co-author invite by email address. The invitee receives an in-app notification.
2. **Roles**: `CO_AUTHOR` (full editing rights) or `CONTRIBUTOR` (limited access).
3. **Status lifecycle**: `PENDING → ACCEPTED | DECLINED`. On acceptance, the blog owner is notified.
4. **Display**: Co-authors are shown on the blog's public page with their role.

> **Note**: The current implementation covers the invitation/acceptance workflow and metadata. Live simultaneous editing (collaborative real-time co-authoring) is planned as a future feature (see [Section 15](#15-future-work)).

### 10.8 Premium Content & Subscriptions

Authors can mark individual blogs as `isPremium: true`. Readers must have an active `PremiumAccess` record linked to the author's `Subscription` plan to read gated content. The subscription and payment infrastructure is integrated with **Stripe** on the frontend.

### 10.9 Tipping System

Readers can send one-time monetary tips to authors. Each tip is recorded in the `Tip` table with `tipperId`, `receiverId`, `amountInCents`, and an optional personal message. Stripe handles the actual payment processing on the frontend side.

### 10.10 Personalized Discovery Feed

The `/api/discovery/personalized-feed` endpoint builds a personalized content feed using two signals:

**Signal 1 — Follow Graph**: Fetches all published blogs by users the current user follows.
**Signal 2 — Tag Affinity**: Analyses the last 20 blogs the user has read, computes a frequency score for each tag encountered, selects the top 5affinity tags, and surfaces published blogs matching those tags.

Blogs the user has already read are excluded (`id: { notIn: readBlogIds }`). Results are cached for 5 minutes per user.

### 10.11 Text Highlights & Annotations

While reading a blog, users can:
- Select any text passage to create a highlight
- Optionally attach a personal note to the highlight
- The highlight stores `startOffset` and `endOffset` character positions within the blog content
- Highlights from all users are visible on the blog, fostering community annotation
- Creating a highlight awards the reader +2 XP

### 10.12 Analytics Dashboard

The `/dashboard` page presents a set of charts and metrics powered by **Recharts**:

| Widget | Data Source | Description |
|--------|------------|-------------|
| Daily View Chart | `GET /api/analytics/views` | Area/bar chart of views over the last 30 days |
| Engagement Score | `GET /api/analytics/engagement` | Composite score card with breakdown |
| Follower Growth | `GET /api/analytics/follower-growth` | Line chart of follower count over time |
| Reading Completion | `GET /api/analytics/reading-completion` | Per-blog bar chart of completion rates |
| Reading Time | `GET /api/analytics/reading-time` | Estimated reading time per blog |
| Blog Management | – | Table of user's blogs with quick publish/unpublish/delete actions |

### 10.13 Leaderboard

Accessible at `/leaderboard` (public). Displays the top 20 writers ranked by `writerXP`. Shows rank number, avatar, name, verified badge, writer level, total blog count, and follower count. Refreshes from cache every 5 minutes.

### 10.14 Blog Series

Authors can organize related blogs into numbered series (e.g., "React Deep Dive — Parts 1–5"):
- Create a series with a name and description
- Assign blogs to a series with an explicit `seriesOrder` number
- The series page (`/series/:id`) displays all parts in order with navigation between them

### 10.15 Scheduled Publishing

When creating or editing a blog, the author can set a `scheduledAt` DateTime. The backend scheduler (`initScheduler`, running every 60 seconds) queries for blogs where `scheduledAt <= now()` and `published = false`, then publishes them automatically, triggers notifications, and sends confirmation emails.

### 10.16 Email Notifications

Powered by **Nodemailer**. Currently sends transactional emails when:
- A blog is successfully published (to the author)

The email send is fire-and-forget (errors are caught and logged non-fatally) so they never block the API response.

### 10.17 Reading History & Tracking

Every time a user reads a blog:
1. A `ReadingHistory` record is upserted (unique on `userId + blogId`) — so re-reading a blog updates `readAt` rather than creating duplicates.
2. The blog's `views` counter is incremented via `POST /api/blogs/:blogId/view`.
3. The user's `readingStreak` and `lastReadDate` can be updated by the streak tracking logic.

The reading history page (`/history`) shows a chronological timeline of articles the user has read.

### 10.18 Admin Panel

Accessible at `/admin` (admin role required). Provides:
- **Platform Stats**: Total users, blogs, comments, views; new signups and posts this week
- **User Management**: Paginated, searchable user table with role filtering; ability to change roles, view individual user profiles with activity history
- **Content Moderation**: List all blogs with ability to toggle `featured` status or delete problematic content

The `RequireAdmin` component on the frontend and `requireAdmin` middleware on the backend enforce access at both layers.

### 10.19 Caching Strategy (Redis)

Redis is used as a read-through cache throughout the API. All Redis operations are wrapped in safe helpers (`safeRedisGet`, `safeRedisSet`) that gracefully handle Redis connection failures — the app continues to work even if Redis is unavailable.

| Cache Key Pattern | TTL | Data |
|-------------------|-----|------|
| `blogs:all` | 600s | All public blogs list |
| `blogs:trending` | 120s | Trending blogs |
| `blogs:featured` | 300s | Featured blogs |
| `blog:<id>` | 600s | Individual blog detail |
| `search:<q>` | 120s | Search results |
| `blogs:tag:<tag>` | 300s | Blogs by tag |
| `user_blogs:<userId>` | 120s | User's all blogs |
| `user_blogs_published:<userId>` | 600s | User's published blogs |
| `author:<userId>` | varies | Author profile |
| `notifications:<userId>` | 60s | User notification list |
| `feed:<userId>` | 300s | Personalized feed |
| `leaderboard:<period>` | 300s | Leaderboard |

On startup, the Redis cache is fully flushed (`FLUSHALL`) to prevent stale data from a previous process run.

### 10.20 Rate Limiting

Three tiers of rate limiting using `express-rate-limit`:

| Limiter | Limit | Window | Applied To |
|---------|-------|--------|-----------|
| `globalLimiter` | 200 requests | 15 min | All routes |
| `authLimiter` | Stricter | 15 min | `GET /api/user` and auth-sensitive routes |
| `writeLimiter` | Moderate | 15 min | All POST/PUT/PATCH/DELETE mutation endpoints |

---

## 11. Deployment Architecture

### Docker (Local / EC2)

Both `backend` and `frontend` services have their own `Dockerfile`. A `docker-compose.yml` at the project root orchestrates:
- `backend` service (Node.js server)
- `frontend` service (Nginx serving built React SPA)
- `redis` service (Redis 7 Alpine)

A separate `deployment/docker-compose.ec2.yml` is configured for production-like deployments on AWS EC2.

### Kubernetes (Production — GKE)

Production runs on **Google Kubernetes Engine** with manifests in `apps/backend/deployment/`:

| Manifest | Description |
|----------|-------------|
| `backend-deployment.yaml` | Backend pod deployment (Express server) |
| `backend-service.yaml` | ClusterIP service exposing port 3000 |
| `redis-deployment.yaml` | Redis pod deployment |
| `redis-service.yaml` | ClusterIP service for Redis |
| `ingress.yaml` | GKE Ingress controller for HTTP routing |
| `managed-cert.yaml` | Google-managed TLS certificate for HTTPS |

The frontend is deployed separately and served via a CDN-backed static hosting solution (e.g., Vercel or GCS bucket with Nginx), with `vercel.json` present in the frontend directory.

### Port Layout

| Service | Port | Protocol |
|---------|------|---------|
| Express REST API | 3000 | HTTP |
| WebSocket Server | 3001 | WS |
| Frontend Dev Server | 5173 | HTTP |
| Redis | 6379 | TCP |

---

## 12. Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection URL (pooled) |
| `DIRECT_URL` | Yes | Direct (non-pooled) PostgreSQL URL for Prisma migrations |
| `REDIS_URL` | Yes | Redis connection URL |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret key |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `PORT` | No | HTTP server port (default: 3000) |
| `WS_PORT` | No | WebSocket server port (default: 3001) |
| `GOOGLE_AI_API_KEY` | No* | Google Gemini API key |
| `OPENAI_API_KEY` | No* | OpenAI API key |
| `AI_PROVIDER` | No | `gemini` or `openai` (default: gemini) |
| `SMTP_HOST` | No | Nodemailer SMTP host |
| `SMTP_PORT` | No | Nodemailer SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `FROM_EMAIL` | No | Sender address for transactional emails |

*At least one AI API key is required for AI features.

### Frontend (`apps/frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for React SDK |
| `VITE_BACKEND_URL` | Yes | Base URL for REST API (e.g., `https://api.domain.com`) |
| `VITE_WS_URL` | Yes | WebSocket server URL (e.g., `wss://ws.domain.com`) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL for file uploads |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key for payments |

---

## 13. Getting Started (Local Development)

### Prerequisites

- Node.js v22+
- pnpm (recommended) or npm
- Docker & Docker Compose (for Redis)
- A Clerk account (free tier works)
- A Neon PostgreSQL database (free tier works)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd Techincal-Phase-2-main

# 2. Install all workspace dependencies
npm install

# 3. Start Redis via Docker
docker compose up redis -d

# 4. Configure backend environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your DATABASE_URL, CLERK_SECRET_KEY, REDIS_URL, etc.

# 5. Configure frontend environment
cp apps/frontend/.env.example apps/frontend/.env
# Edit apps/frontend/.env with your VITE_CLERK_PUBLISHABLE_KEY, VITE_BACKEND_URL, etc.

# 6. Run database migrations
cd apps/backend
npx prisma migrate dev

# 7. (Optional) Seed achievements and sample data
npm run seed

# 8. Start all apps (from project root, using Turborepo)
cd ../..
npx turbo dev

# Backend runs at:  http://localhost:3000
# Frontend runs at: http://localhost:5173
# WebSocket at:     ws://localhost:3001
```

### Running with Full Docker Compose

```bash
# Build and start all services (backend + frontend + redis)
docker compose up --build
```

---

## 14. Non-Functional Requirements

### Performance
- Redis caching reduces database load for frequently accessed endpoints by 70–90%
- List endpoints exclude the heavy `content` column via Prisma `select` to reduce payload size
- Prisma database indexes on all foreign keys and common query patterns
- Connection pooling via Neon's serverless pooler + Prisma's `connection_limit` configuration
- Frontend code-splitting via React `lazy()` for all non-critical page components
- `BlogCacheContext` and `PageCacheContext` prevent redundant API calls during navigation

### Scalability
- Stateless REST API — horizontally scalable behind a load balancer
- Redis cache shared across all API replicas (external Redis instance)
- WebSocket connections tracked in a Kubernetes-aware in-memory map (suitable for single-replica; can be extended to Redis Pub/Sub for multi-replica)
- Kubernetes Horizontal Pod Autoscaler compatible architecture

### Security
- All mutation endpoints require Clerk JWT authentication
- Admin endpoints require role verification at the middleware layer
- Rate limiting at global, auth, and write levels
- Input validation before all database writes
- Cascade deletes prevent orphaned data
- CORS configured to restrict cross-origin requests to known frontend origins
- Content size limit (`10mb`) on `express.json` to prevent payload flooding

### Reliability
- Redis helper functions are wrapped with try/catch — Redis downtime degrades to direct DB queries (no service outage)
- Email sends are fire-and-forget (non-fatal errors)
- `P2025` (record not found) Prisma errors are handled gracefully in all routes
- Redis is flushed on startup to prevent serving stale data from crashed instances

### Maintainability
- Monorepo with shared TypeScript configs and ESLint configs via `packages/`
- Prisma migrations provide a tracked, reproducible database change history
- AI provider abstraction layer allows swapping between Gemini and OpenAI without touching route code
- All routes follow a consistent structure: auth guard → cache check → business logic → cache invalidation

---

## 15. Future Work

The following features are planned or under active consideration for future platform versions:

### 15.1 Live Collaborative Blog Writing (Top Priority)

> **Collaborate feature** — The platform intends to add real-time multi-user collaborative editing, allowing developers, bloggers, and writers to co-author blogs simultaneously in a shared editor.

**Planned implementation approach:**
- Integrate **Operational Transformation (OT)** or **CRDTs (Conflict-free Replicated Data Types)** for conflict-free concurrent edits
- The existing WebSocket infrastructure (port 3001) will be extended with `joinRoom` / `leaveRoom` events per `blogId`
- Each user's cursor position and selection will be broadcast live to other collaborators in the same blog room
- A "presence" panel will show who is currently editing the blog
- The existing `CoAuthor` invitation model will gate access — only accepted co-authors can enter a live session
- The existing `BlogVersion` system will auto-snapshot before and after each collaborative session for safety

**Related existing infrastructure:**
- Invitation system (`CoAuthor` model) ✅
- WebSocket server ✅
- Version history ✅
- WebRTC calling plan documented in `docs/webrtc-calling-plan.md` for potential voice/video enhancement

### 15.2 WebRTC Voice & Video Calling

A preliminary plan (`docs/webrtc-calling-plan.md`) exists for integrating WebRTC-based peer-to-peer voice and video calls, initially for use during collaboration sessions.

### 15.3 Mobile Application

A React Native or Progressive Web App (PWA) companion mobile application for reading and light authoring on the go.

### 15.4 Newsletter / Email Digest

Authors could send newsletter editions to subscribers via email (leveraging the existing Nodemailer + Subscription infrastructure).

### 15.5 Advanced Search & Semantic Discovery

Integrate vector embeddings (e.g., Supabase pgvector or Pinecone) for semantic similarity search beyond keyword matching.

### 15.6 Blog Import / Export

Support importing Markdown files and exporting published blogs to PDF or Markdown.

### 15.7 Content Moderation AI

Automated content policy enforcement using AI — flagging inappropriate content before it is published.

---

## Appendix A — API Quick Reference Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/blogs` | Public | All published blogs |
| GET | `/api/blogs/trending` | Public | Top 6 blogs last 7 days |
| GET | `/api/blogs/featured` | Public | Admin-featured blogs |
| GET | `/api/blogs/search?q=` | Public | Full-text search |
| GET | `/api/blogs/by-tag/:tag` | Public | Blogs by tag |
| GET | `/api/blogs/:id` | Public | Single blog detail |
| POST | `/api/blogs/:id/view` | Public | Increment view count |
| GET | `/api/blogs/:id/related` | Public | Related blogs by tags |
| POST | `/api/blogs` | Auth | Create blog |
| PUT | `/api/blogs/:id` | Auth | Update blog |
| PATCH | `/api/blogs/:id/publish` | Auth | Publish draft |
| DELETE | `/api/blogs/:id` | Auth | Delete blog |
| PUT | `/api/blogs/:id/tags` | Auth | Update blog tags |
| PUT | `/api/blogs/:id/series` | Auth | Assign to series |
| GET | `/api/blogs/:id/versions` | Auth | List version history |
| POST | `/api/blogs/:id/versions` | Auth | Save version snapshot |
| POST | `/api/blogs/:id/versions/:vid/restore` | Auth | Restore version |
| POST | `/api/blogs/:id/coauthors` | Auth | Invite co-author |
| GET | `/api/blogs/:id/coauthors` | Public | List co-authors |
| GET | `/api/user` | Auth | Get current user |
| PATCH | `/api/user/profile` | Auth | Update profile |
| GET | `/api/user/blogs` | Auth | All user blogs |
| GET | `/api/user/blogs/published` | Auth | Published blogs |
| GET | `/api/user/blogs/drafts` | Auth | Draft blogs |
| GET | `/api/user/bookmarks` | Auth | User bookmarks |
| POST | `/api/user/bookmarks` | Auth | Add bookmark |
| DELETE | `/api/user/bookmarks/:id` | Auth | Remove bookmark |
| GET | `/api/user/bookmarks/ids` | Auth | Bookmark IDs list |
| GET | `/api/user/notifications` | Auth | Get notifications |
| PATCH | `/api/user/notifications/read-all` | Auth | Mark all read |
| DELETE | `/api/user/notifications/:id` | Auth | Delete notification |
| POST | `/api/user/follow` | Auth | Follow user |
| DELETE | `/api/user/follow/unfollow/:id` | Auth | Unfollow user |
| GET | `/api/user/follow/followers` | Auth | Get followers |
| GET | `/api/user/follow/following` | Auth | Get following |
| GET | `/api/comments/blog/:id` | Public | Blog comments |
| POST | `/api/comments/blog/:id` | Auth | Post comment |
| DELETE | `/api/comments/:id` | Auth | Delete comment |
| POST | `/api/ai/suggest-titles` | Public | AI title suggestions |
| POST | `/api/ai/suggest-tags` | Public | AI tag suggestions |
| POST | `/api/ai/generate-summary` | Public | AI summary |
| POST | `/api/ai/readability` | Public | Readability score |
| POST | `/api/ai/grammar-check` | Public | Grammar check |
| POST | `/api/ai/generate-image` | Public | AI cover image |
| GET | `/api/analytics/views` | Auth | Daily view stats |
| GET | `/api/analytics/engagement` | Auth | Engagement score |
| GET | `/api/analytics/follower-growth` | Auth | Follower history |
| GET | `/api/analytics/reading-completion` | Auth | Completion rates |
| GET | `/api/analytics/reading-time` | Auth | Reading time stats |
| GET | `/api/analytics/leaderboard` | Public | Top writers |
| GET | `/api/messaging/conversations` | Auth | List conversations |
| POST | `/api/messaging/conversations` | Auth | Start conversation |
| GET | `/api/messaging/conversations/:id/messages` | Auth | Get messages |
| POST | `/api/messaging/conversations/:id/messages` | Auth | Send message |
| GET | `/api/discovery/personalized-feed` | Auth | Personalized feed |
| GET | `/api/discovery/recommended-authors` | Auth | Suggested authors |
| GET | `/api/achievements/user` | Auth | User achievements |
| GET | `/api/achievements/all` | Public | All achievements |
| GET | `/api/highlights/blog/:id` | Public | Blog highlights |
| POST | `/api/highlights` | Auth | Create highlight |
| DELETE | `/api/highlights/:id` | Auth | Delete highlight |
| POST | `/api/series` | Auth | Create series |
| GET | `/api/series/:id` | Public | Get series |
| PATCH | `/api/coauthors/status/:id` | Auth | Accept/decline invite |
| GET | `/api/admin/stats` | Admin | Platform stats |
| GET | `/api/admin/users` | Admin | List users |

---

*End of Documentation — DraftDock Blogging Platform*
*C.V. Raman Global University — Technical Phase 2 Project*
*Academic Year 2025–2026*
