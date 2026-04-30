<div align="center">

# DraftDock

**A full-stack blogging platform with real-time collaboration, AI writing assistance, an in-browser code IDE, admin tooling, and self-hosted monitoring — all in one Turborepo monorepo.**

[![Live Site](https://img.shields.io/badge/Live%20Site-Visit-blueviolet?style=for-the-badge)](https://www.draftdocks.in/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo)

[![DockStudio](https://img.shields.io/badge/DockStudio-Open-blue?style=for-the-badge)](https://dockstudio.abhasbehera.in/)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Features by App](#features-by-app)
   - [Frontend — Main Blogging App](#1-frontend--main-blogging-app-appsfrontend)
   - [Backend — REST & Real-time API](#2-backend--rest--real-time-api-appsbackend)
   - [DockStudio — AI Code IDE](#3-dockstudio--ai-in-browser-code-ide-appsdockstudio)
   - [Admin Panel (Legacy)](#4-admin-panel-legacy-appsadmin)
   - [Admin Panel (Next.js)](#5-admin-panel-nextjs-appsadmin-next)
   - [Monitoring](#6-monitoring-appsmonitoring)
   - [Shared Packages](#7-shared-packages)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Running Apps Individually](#running-apps-individually-without-turbo)
7. [Deployment](#deployment)

---

## Overview

DraftDock is a production-grade blogging platform that combines several interconnected applications under one monorepo:

- A **React + Vite** frontend for reading, writing, and discovering blogs
- An **Express + TypeScript** backend with REST APIs, a WebSocket server, and a CRDTs-powered collaborative editing server
- **DockStudio**, a Next.js AI-powered in-browser code IDE backed by WebContainers
- A **Next.js Admin Panel** for platform moderation and analytics
- A **self-hosted monitoring** service that watches endpoints, databases, and infrastructure

---

## Monorepo Structure

```
DraftDock/
├── apps/
│   ├── frontend/        # Main user-facing app (React + Vite)
│   ├── backend/         # REST API + WebSocket + Collab server (Express)
│   ├── dockstudio/      # AI code IDE (Next.js + WebContainers)
│   ├── admin/           # Admin dashboard — legacy (Vanilla HTML/JS)
│   ├── admin-next/      # Admin dashboard — current (Next.js)
│   └── monitoring/      # Self-hosted health & alerting service
├── packages/
│   ├── ui/              # Shared React component library
│   ├── eslint-config/   # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── turbo.json
├── docker-compose.yml
└── package.json
```

---

## Features by App

### 1. Frontend — Main Blogging App (`apps/frontend`)

The primary user-facing application built with **React**, **Vite**, **Tailwind CSS**, and **Clerk** for authentication.

#### Blog Reading & Discovery
- Browse all public blogs at `/blogs` — no login required
- **Explore page** (`/explore`) — curated tabs for *Trending*, *Featured*, *Recent*, and a personalised *For You* feed based on reading history
- **Tag-based discovery** — filter blogs by topic tags; each tag has a dedicated listing page
- **Author profiles** — visit any author's public page to see their published articles, follow them, and view their writer level and XP
- **Series** — authors can group related blogs into ordered series; readers navigate series sequentially from a dedicated series page

#### Markdown Blog Editor
- Full-featured **Markdown editor** powered by [`@uiw/react-md-editor`](https://github.com/uiwjs/react-md-editor) with a live split-pane preview
- **Cover image upload** — drag-and-drop or click to upload a header image for each article
- **Tag input** — add up to N tags to categorise content for discovery
- **SEO summary field** — authors write or AI-generate a short summary used for social sharing and search indexing
- **Draft / Publish toggle** — save as a private draft or publish immediately
- **Scheduled publishing** — set a future date/time; a backend scheduler automatically publishes the post at the specified time
- **Auto-save to localStorage** — content is periodically saved locally so no work is ever lost on accidental page close
- **Edit mode** — opening an existing blog pre-fills all fields; changes overwrite the original post

#### AI Writing Assistant
A collapsible side panel that integrates directly with the editor, backed by the backend `/api/ai` routes:

| Tab | What it does |
|---|---|
| **Title** | Generates multiple catchy title suggestions from a short description |
| **Content** | Drafts full article content given a topic, tone (professional / casual / academic / creative), and length (short / medium / long) |
| **Tags** | Auto-extracts relevant tags from the current article body |
| **SEO** | Writes an optimised meta-description summary |

One-click insertion — generated content or titles slot directly into the editor without copy-pasting.

#### Readability Meter
A live sidebar widget (debounced 1.5 s) that sends the current content to `/api/ai/readability` and returns:
- A **Flesch Reading Ease score** (0–100)
- Grade level and difficulty label (Easy / Moderate / Difficult)
- Word count, sentence count, and average words per sentence
- A colour-coded progress bar (green → amber → red)

#### Real-time Collaborative Writing (`/collaborate`)
Powered by **TipTap** (rich text editor) with a **Hocuspocus** CRDT server (Y.Doc) running on a dedicated port:

- **Start a session** — creates a draft blog and drops you into the live editor immediately
- **Invite co-authors** — the session owner generates a shareable invite link; anyone with the link can join as a co-author
- **Join via invite link** — `/collab/join/:token` resolves the token, validates it, then opens the shared editor
- **Co-author presence bar** — shows live avatars of everyone currently editing the document
- **Bi-directional sync** — title and body are separate Y.Doc channels so both update in real time across all connected clients
- **Connection status indicator** — WiFi/WifiOff icon reflects the WebSocket health
- **Publish from collab** — the session owner can publish the draft directly from inside the collaborative editor
- **Session management** — the Collaborate landing page lists all your active draft sessions (owned) and sessions you've been invited to

#### Social & Community Features
- **Likes** — one-click like/unlike on any blog post, with optimistic UI updates
- **Comments** — nested or flat comment threads on each article
- **Bookmarks** — save articles for later reading; manage saved articles at `/bookmarks`
- **Reading history** — the platform tracks articles you've read at `/reading-history`
- **Follow / Unfollow** — follow authors to personalise your feed; manage followers and following lists from your profile
- **Highlights** — text-selection highlights on a blog post that persist for the reader

#### Leaderboard (`/leaderboard`)
- Ranks all writers by **writer XP** and **follower count**
- Filterable by period: **All time**, **Monthly**, **Weekly**
- Each entry shows the writer's level name (Newcomer → Contributor → Rising Star → Expert Writer → Thought Leader), XP, blog count, and follower count
- Top-3 positions get crown / medal icons

#### Achievements & XP System
- Configurable achievements stored in the database (e.g., "Write your first blog", "Get 100 likes")
- Each achievement awards **XP points** that advance the writer's level
- The **Dashboard** displays earned achievements in a visual grid alongside locked ones

#### Analytics Dashboard (`/dashboard`)
All charts are rendered with **Recharts**:

| Chart | Data |
|---|---|
| Basic stats cards | Total blogs, total views, follower count, total likes |
| View history | Daily line/area chart of blog views |
| Engagement | Likes, comments, bookmarks aggregated |
| Follower growth | Historical line chart of follower count |
| Reading completion | Which articles readers finish |
| Achievements grid | Earned vs locked achievements |

#### Real-time Messaging (`/messages`)
A full in-app chat system backed by the WebSocket server:

- **Conversation list** with last-message previews, sorted by recency
- **Real-time message delivery** via WebSocket (port 3001) — messages appear instantly without polling
- **Emoji picker** — curated grid (Smileys, Gestures, Objects) built in without an external dependency
- **File / image sharing** — attach images and files to messages
- **Read receipts** — double checkmark when the recipient has read the message
- **User info panel** — sliding sidebar showing the other user's profile, email, join date, and a link to their public page

#### Notifications
- Real-time notification delivery for likes, comments, follows, and co-author invitations
- Notification bell in the header with unread count badge
- Mark as read individually or all at once

#### Pricing Page
Three tiers displayed on a polished pricing page (`/pricing`):

| Plan | Price | Key perks |
|---|---|---|
| **Reader** (Free) | $0 | Unlimited reading, bookmarks, up to 3 articles/month |
| **Dock Pro** | $8/mo or $72/yr | Unlimited articles, analytics dashboard, AI assistant, ad-free reading |
| **Studio** | $20/mo | Everything in Pro + custom domain, monetisation, priority support |

#### User Profile & Settings
- **My Profile** — view your own published articles, follower/following lists, and manage relationships
- **Author Profile** — public-facing page for any author (`/author/:id`)
- **Settings** — update display name, bio, profile picture, and notification preferences
- **Dark mode / Light mode** toggle available site-wide

---

### 2. Backend — REST & Real-time API (`apps/backend`)

Built with **Express**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Redis**.

#### Three Servers in One Process

| Server | Port | Purpose |
|---|---|---|
| HTTP REST API | `3000` | All REST endpoints |
| WebSocket Server | `3001` | Real-time messaging & WebRTC signaling |
| Hocuspocus Collab | `3002` | Y.Doc CRDT sync for collaborative editing |

#### REST API Routes

| Route prefix | Features |
|---|---|
| `/api/blogs` | CRUD, publishing, scheduling, cover images, pagination |
| `/api/comments` | Nested comment threads |
| `/api/bookmarks` | Add / remove / list saved articles |
| `/api/notifications` | Read, unread, mark-read |
| `/api/follow` | Follow / unfollow users |
| `/api/user` | Profile, stats, followers, following, bookmarks |
| `/api/tags` | Tag listing and tag-based filtering |
| `/api/authors` | Author discovery and author pages |
| `/api/series` | Create / manage blog series |
| `/api/ai` | Title generation, content drafting, tag extraction, SEO summaries, readability scoring |
| `/api/analytics` | Views, engagement, follower growth, reading completion, leaderboard |
| `/api/messaging` | Conversation CRUD and message history |
| `/api/discovery` | Trending, featured, personalised feeds |
| `/api/achievements` | User achievements and all-achievements catalogue |
| `/api/highlights` | Per-user text highlights on blog posts |
| `/api/coauthors` | Co-author management for collaborative blogs |
| `/api/collab` | Collab session lifecycle, invite token generation |
| `/api/likes` | Like / unlike with idempotency |
| `/api/admin` | Admin-only moderation endpoints |

#### Infrastructure Features
- **Clerk authentication** — JWT validation on every protected route via `@clerk/express`
- **Redis caching** — response caching with TTL on expensive queries; cache flushed on startup to prevent stale data
- **Rate limiting** — global limiter middleware protects all routes from abuse
- **Scheduled publishing** — a background scheduler scans for scheduled posts and publishes them at the correct time
- **Email via SMTP** — transactional emails (notifications, invites) sent via the `email.ts` service
- **CORS** — dynamically constructed allowlist of origins supporting local dev, configured prod URLs, and wildcard subdomains

#### WebSocket Server
- Uses native `ws` library on port 3001
- Maintains a `userConnections` map for routing messages to specific users
- Handles real-time chat message delivery
- Designed to support WebRTC signaling (call-offer, call-answer, ice-candidate, call-end, call-reject messages) for future 1:1 voice/video calling

#### Hocuspocus Collaborative Server
- Runs on port 3002 using **Hocuspocus** (Y.Doc provider)
- Each collaborative blog session has its own Y.Doc with separate channels for `title` (Y.Text) and `body` (TipTap Y.Doc)
- Awareness syncs cursor positions and user presence across all connected clients

---

### 3. DockStudio — AI In-Browser Code IDE (`apps/dockstudio`)

A standalone **Next.js** application where users describe a coding project and an AI agent plans and writes the code, executed live in the browser via **WebContainers**.

#### Project Management
- **Dashboard** (`/main`) — lists all of the user's projects; create new ones with a name and optional description
- **New project modal** — choose a project template type before creation
- Projects are persisted in a database via the `/api/projects` backend routes

#### AI-Driven Code Generation
- Each project has a **task prompt input** — describe what you want built in plain English
- The AI returns a structured **plan** (JSON with step types: `create_file`, `run_command`, `explain`, etc.) before writing any code
- Each plan is displayed step-by-step so the user can follow what is happening
- Steps are executed sequentially: files are written to the virtual filesystem, commands are run in the in-browser terminal

#### In-Browser Execution (WebContainers)
- Uses **@webcontainer/api** to boot a real Node.js environment directly in the browser — no server-side sandbox needed
- A custom `useWebContainer` hook manages the WebContainer lifecycle: boot, file mounting, process spawning
- The **Preview panel** renders the running app in an `<iframe>` with a live URL pointing to the container's dev server
- Users can switch between **Code Editor** and **Preview** tabs at any moment

#### Code Editor
- Monaco-based editor (`CodeEditor` component) with syntax highlighting for JS, TS, JSON, CSS, HTML, Markdown, Python and more
- File language is inferred from the file extension
- Read and write individual files — edits are reflected in the WebContainer immediately

#### Terminal
- `PrettyTerminal` component renders a styled terminal pane inside the project workspace
- Shows stdout/stderr from commands run inside the WebContainer
- Colour-coded output for easy reading

#### Sidebar Panels
- **Tasks panel** — history of all submitted tasks and their statuses (`pending`, `in_progress`, `completed`, `failed`), expandable to show plan steps
- **Files panel** — tree view of the virtual filesystem; click any file to open it in the editor

#### Theme & Auth
- Full **dark / light mode** toggle persisted per user
- Authentication via **Clerk** (`@clerk/nextjs`) — all project routes are protected under `(authedRoutes)`

---

### 4. Admin Panel — Legacy (`apps/admin`)

A lightweight, self-contained admin UI built with **vanilla HTML, Tailwind CSS CDN, and plain JavaScript** — no build step required.

| Page | Purpose |
|---|---|
| `dashboard.html` | Platform overview: active users, total posts, recent signups, key metrics |
| `users.html` | Search, filter, ban / unban, and inspect individual user accounts |
| `content.html` | Review and moderate all published and drafted blog content |
| `analytics.html` | Site-wide charts for traffic, engagement, and growth |
| `settings.html` | Platform-level configuration |

Served by a small Express server in `apps/admin/server/`. Uses the same backend API endpoints as the main app, hitting `/api/admin/*` protected routes.

---

### 5. Admin Panel — Next.js (`apps/admin-next`)

A fully rebuilt, production-grade admin dashboard in **Next.js 15 (App Router)** with **Tailwind CSS**, **Prisma**, and a custom design system.

- Protected under `(admin)` route group with a dedicated login page
- Connects directly to the database via **Prisma** as well as the backend API
- Designed as a SaaS-style admin UI with a dark-mode-compatible theme system
- Provides the same moderation/analytics capabilities as the legacy panel with a modern UX

---

### 6. Monitoring (`apps/monitoring`)

A **self-hosted health monitoring service** built with **Node.js + Express** that probes all DraftDock services on a schedule.

#### How it works
1. A **scheduler** runs a set of *checker* functions at a configurable interval
2. Each run is logged to disk under `logs/` for audit and debugging
3. If any probe fails, a **batched email alert** is sent via SMTP
4. A lightweight **Express dashboard** (`/`) shows the current health status of all probes

#### Checker Types

| Checker | What it probes |
|---|---|
| `httpChecker` | HTTP/HTTPS endpoint reachability and response time; asserts on status codes |
| `dbChecker` | PostgreSQL database connectivity — runs a lightweight query to verify the DB is up |
| `ec2Checker` | SSH reachability and basic load metrics on EC2 instances |
| `ec2LogChecker` | Reads application logs from EC2 and scans for error patterns |

#### Configuration
- Probes are defined in `src/config.ts` — add, remove, or adjust any endpoint without touching probe logic
- SMTP settings and alert thresholds are read from `.env`
- `data/` directory holds state between runs (e.g., previous status) to suppress flapping alerts

---

### 7. Shared Packages

| Package | Purpose |
|---|---|
| `packages/ui` | Shared React component library consumed by multiple apps |
| `packages/eslint-config` | Common ESLint rules (`base.js`, `next.js`, `react-internal.js`) |
| `packages/typescript-config` | Shared `tsconfig` bases for Next.js, React library, and generic projects |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TipTap, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis |
| Real-time | WebSockets (`ws`), Hocuspocus (Y.Doc CRDT), WebContainers |
| AI | Google Gemini / OpenAI (via `/api/ai` routes) |
| Auth | Clerk (frontend + backend) |
| IDE | Next.js, Monaco Editor, @webcontainer/api |
| Admin | Next.js 15 App Router, Prisma |
| Monitoring | Node.js, Express, SMTP alerting |
| Monorepo | Turborepo |
| Containerisation | Docker, Docker Compose |
| Deployment | Google Cloud Run, EC2, Render |

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Docker & Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/MistaHolmes/DraftDock.git
cd DraftDock
```

### 2. Start infrastructure services

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Each app reads from its own `.env` file. Copy the example files and fill in the values:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/dockstudio/.env.local.example apps/dockstudio/.env.local
```

At minimum you'll need:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `CLERK_SECRET_KEY` + `VITE_CLERK_PUBLISHABLE_KEY` — from [clerk.com](https://clerk.com)

### 5. Run database migrations

```bash
cd apps/backend && npx prisma migrate deploy
```

### 6. Start all apps

```bash
npm run dev
```

| App | Default URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| WebSocket | ws://localhost:3001 |
| Collab Server | ws://localhost:3002 |
| DockStudio | http://localhost:3003 |
| Admin (Next.js) | http://localhost:3004 |

---

## Running Apps Individually (Without Turbo)

If `npm run dev` fails with `turbo: not found`, start each service separately:

```bash
# 1. Start Redis
cd apps/backend && docker-compose up -d redis

# 2. Start Backend API (in a new terminal)
cd apps/backend && npm run dev

# 3. Start Frontend (in a new terminal)
cd apps/frontend && npm run dev

# 4. Start DockStudio (in a new terminal)
cd apps/dockstudio && npm run dev

# 5. Start Admin (in a new terminal)
cd apps/admin-next && npm run dev

# 6. Start Monitoring (in a new terminal)
cd apps/monitoring/draftdock && npm start
```

---

## Run with Docker (Frontend Image)

```bash
docker pull mistaholmes/draftdockfe:latest
docker run -p 3000:3000 mistaholmes/draftdockfe:latest
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Google Cloud Run |
| Backend | Google Cloud Run / EC2 |
| DockStudio | Render / Vercel |
| Admin Next | Vercel |
| Monitoring | Self-hosted (EC2) |

Live frontend: **[https://www.draftdocks.in/](https://www.draftdocks.in/)**

---

## License

[MIT](LICENSE)

