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
3. [Architecture](#architecture)
4. [Features by App](#features-by-app)
   - [Frontend — Main Blogging App](#1-frontend--main-blogging-app-appsfrontend)
   - [Backend — REST & Real-time API](#2-backend--rest--real-time-api-appsbackend)
   - [DockStudio — AI Code IDE](#3-dockstudio--ai-in-browser-code-ide-appsdockstudio)
   - [Monitoring](#4-monitoring-appsmonitoring)
   - [Shared Packages](#5-shared-packages)
5. [Tech Stack](#tech-stack)
6. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Clone & Install](#1-clone--install)
   - [Environment Variables](#2-environment-variables)
   - [Database Setup](#3-database-setup)
   - [Running All Apps (Turbo)](#4-run-all-apps-with-turbo)
   - [Running Apps Individually](#5-run-apps-individually)
   - [DockStudio Python API Setup](#6-dockstudio-python-api-setup)
7. [Deployment](#deployment)

---

## Overview

DraftDock is a production-grade blogging platform that combines several interconnected applications under one monorepo:

- A **React + Vite** frontend for reading, writing, and discovering blogs
- An **Express + TypeScript** backend with REST APIs, a WebSocket server, and a CRDTs-powered collaborative editing server
- **DockStudio**, a Next.js AI-powered in-browser code IDE backed by WebContainers and a Python FastAPI backend
- A **self-hosted monitoring** service that watches endpoints, databases, and infrastructure

---

## Monorepo Structure

```
DraftDock/
├── apps/
│   ├── frontend/           # Main user-facing app (React + Vite)
│   ├── backend/            # REST API + WebSocket + Collab server (Express + TS)
│   ├── dockstudio/         # AI code IDE (Next.js + WebContainers)
│   │   ├── src/            #   Next.js frontend (pages, components, hooks)
│   │   └── api/            #   Python FastAPI backend (AI, projects, tasks)
│   │       ├── main.py     #     FastAPI entry point
│   │       ├── routers/    #     Route handlers (users, projects, tasks)
│   │       ├── services/   #     AI service (Anthropic Claude)
│   │       └── prisma/     #     Prisma schema (prisma-client-py)
│   ├── deployment/         # Deployment configs (nginx, docker-compose, env)
│   └── monitoring/         # Self-hosted health & alerting service
├── packages/
│   ├── ui/                 # Shared React component library
│   ├── eslint-config/      # Shared ESLint configuration
│   └── typescript-config/  # Shared TypeScript configuration
├── turbo.json
├── docker-compose.yml      # Redis for local dev
└── package.json            # Workspace root (npm workspaces + Turborepo)
```

---

## Architecture

> **Key point:** DockStudio has its **own dedicated Python FastAPI backend** — it does NOT use the Node.js backend that powers the main blogging platform.

```
┌─────────────────────────────────────────────────────────┐
│                     DraftDock Monorepo                   │
├────────────────────────┬────────────────────────────────┤
│   Blogging Platform    │   DockStudio (AI Code IDE)     │
│                        │                                │
│  ┌──────────────────┐  │  ┌──────────────────────────┐  │
│  │  apps/frontend   │  │  │  apps/dockstudio/src     │  │
│  │  (React + Vite)  │  │  │  (Next.js 15)            │  │
│  └───────┬──────────┘  │  └───────────┬──────────────┘  │
│          │ REST/WS     │              │ REST (Bearer)   │
│          ▼             │              ▼                 │
│  ┌──────────────────┐  │  ┌──────────────────────────┐  │
│  │  apps/backend    │  │  │  apps/dockstudio/api     │  │
│  │  (Express + TS)  │  │  │  (Python FastAPI)        │  │
│  │  Port 3000 REST  │  │  │  Port 8000               │  │
│  │  Port 3001 WS    │  │  │  Anthropic Claude AI     │  │
│  │  Port 3002 CRDT  │  │  │  prisma-client-py        │  │
│  └───────┬──────────┘  │  └───────────┬──────────────┘  │
│          │             │              │                 │
│          ▼             │              ▼                 │
│  ┌──────────────────┐  │  ┌──────────────────────────┐  │
│  │  PostgreSQL      │  │  │  PostgreSQL (Neon)       │  │
│  │  Redis           │  │  │                          │  │
│  └──────────────────┘  │  └──────────────────────────┘  │
└────────────────────────┴────────────────────────────────┘
```

**How DockStudio frontend → API works:**

1. The Next.js frontend uses a `useApi()` hook (`src/lib/api.ts`) that reads `NEXT_PUBLIC_API_URL`
2. All API calls go through `fetch()` with Clerk JWT Bearer tokens
3. The Python FastAPI server verifies the JWT against Clerk's JWKS endpoint
4. The API uses `prisma-client-py` (async) to interact with a PostgreSQL database on Neon
5. AI features call the Anthropic Claude API to generate code plans and repair errors

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

#### AI Writing Assistant
A collapsible side panel that integrates directly with the editor, backed by the backend `/api/ai` routes:

| Tab | What it does |
|---|---|
| **Title** | Generates multiple catchy title suggestions from a short description |
| **Content** | Drafts full article content given a topic, tone, and length |
| **Tags** | Auto-extracts relevant tags from the current article body |
| **SEO** | Writes an optimised meta-description summary |

#### Real-time Collaborative Writing (`/collaborate`)
Powered by **TipTap** (rich text editor) with a **Hocuspocus** CRDT server (Y.Doc):

- **Start a session** — creates a draft blog and drops you into the live editor immediately
- **Invite co-authors** — generates a shareable invite link; anyone with the link can join as a co-author
- **Co-author presence bar** — shows live avatars of everyone currently editing the document
- **Bi-directional sync** — title and body are separate Y.Doc channels so both update in real time
- **Publish from collab** — the session owner can publish the draft directly from inside the collaborative editor

#### Social & Community Features
- **Likes**, **Comments**, **Bookmarks**, **Reading history**
- **Follow / Unfollow** authors to personalise your feed
- **Highlights** — text-selection highlights on blog posts that persist for the reader

#### Leaderboard, Achievements & Analytics
- Writer XP and levelling system (Newcomer → Thought Leader)
- Configurable achievements that award XP
- Full analytics dashboard with Recharts (views, engagement, follower growth, reading completion)

#### Real-time Messaging (`/messages`)
Full in-app chat via WebSocket — conversation list, emoji picker, file sharing, read receipts

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
- **Redis caching** — response caching with TTL on expensive queries
- **Rate limiting** — global limiter middleware protects all routes from abuse
- **Scheduled publishing** — background scheduler scans for scheduled posts
- **Email via SMTP** — transactional emails via Nodemailer

---

### 3. DockStudio — AI In-Browser Code IDE (`apps/dockstudio`)

A standalone **Next.js** application where users describe a coding project and an AI agent plans and writes the code, executed live in the browser via **WebContainers**.

> **Architecture note:** DockStudio has its own Python FastAPI backend at `apps/dockstudio/api/`. The Next.js frontend communicates exclusively with this Python API — it does NOT use the main Node.js backend.

#### Project Management
- **Dashboard** (`/main`) — lists all of the user's projects; create new ones with a name and optional description
- Projects are persisted via the `/api/projects` routes on the Python API

#### AI-Driven Code Generation
- Each project has a **task prompt input** — describe what you want built in plain English
- The AI (Anthropic Claude) returns a structured **plan** (JSON with step types: `create_file`, `run_command`, etc.)
- Each plan is displayed step-by-step so the user can follow what is happening
- Steps are executed sequentially: files are written to the virtual filesystem, commands run in the terminal
- **Auto-repair** — if a build fails, the error log and current files are sent back to Claude for a fix plan

#### In-Browser Execution (WebContainers)
- Uses **@webcontainer/api** to boot a real Node.js environment directly in the browser
- A custom `useWebContainer` hook manages the WebContainer lifecycle
- The **Preview panel** renders the running app in an `<iframe>` with a live URL
- COOP/COEP headers are set on `/project/*` routes for SharedArrayBuffer support

#### Code Editor
- Monaco-based editor with syntax highlighting for JS, TS, JSON, CSS, HTML, Markdown, Python and more
- Edits are reflected in the WebContainer immediately

#### Terminal
- Styled terminal pane rendering stdout/stderr from WebContainer commands
- Colour-coded output for easy reading

#### Python FastAPI Backend (`apps/dockstudio/api/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/users/sync` | POST | Upsert user from Clerk JWT |
| `/api/projects/` | GET/POST | List / create projects |
| `/api/projects/{id}` | GET/PATCH/DELETE | Manage individual projects |
| `/api/projects/{id}/files` | GET/PUT | File persistence with version history |
| `/api/projects/{id}/tasks` | GET/POST | List / create AI tasks |
| `/api/tasks/{id}` | GET/DELETE | Retrieve / delete a task |
| `/api/tasks/{id}/approve` | POST | Approve a planned task |
| `/api/tasks/{id}/repair` | POST | Send error log to AI for auto-repair |
| `/health` | GET | Health check |

#### Database Schema (Prisma)
The DockStudio API uses its own Prisma schema with models: `User`, `Project`, `ProjectSettings`, `Task`, `TaskStep`, `ProjectFile`, `FileVersion`, `Approval`, `Run`, `RunLog`, `RuntimeSession`.

---

### 4. Monitoring (`apps/monitoring`)

A **self-hosted health monitoring service** built with **Node.js + Express** that probes all DraftDock services on a schedule.

| Checker | What it probes |
|---|---|
| `httpChecker` | HTTP/HTTPS endpoint reachability and response time |
| `dbChecker` | PostgreSQL database connectivity |
| `ec2Checker` | SSH reachability and basic load metrics on EC2 instances |
| `ec2LogChecker` | Reads application logs from EC2 and scans for error patterns |

If any probe fails, a **batched email alert** is sent via SMTP. A lightweight Express dashboard shows current health status.

---

### 5. Shared Packages

| Package | Purpose |
|---|---|
| `packages/ui` | Shared React component library consumed by multiple apps |
| `packages/eslint-config` | Common ESLint rules (`base.js`, `next.js`, `react-internal.js`) |
| `packages/typescript-config` | Shared `tsconfig` bases for Next.js, React library, and generic projects |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, TipTap, Recharts |
| Backend | Node.js, Express 5, TypeScript, Prisma, PostgreSQL, Redis |
| Real-time | WebSockets (`ws`), Hocuspocus (Y.Doc CRDT), WebContainers |
| AI (Blogging) | Google Gemini / OpenAI (via `/api/ai` routes) |
| AI (DockStudio) | Anthropic Claude (code generation & repair) |
| Auth | Clerk (frontend + backend + DockStudio) |
| IDE | Next.js, Monaco Editor, @webcontainer/api |
| DockStudio API | Python, FastAPI, prisma-client-py, Uvicorn |
| Monitoring | Node.js, Express, SMTP alerting |
| Monorepo | Turborepo, npm workspaces |
| Containerisation | Docker, Docker Compose |
| Database | PostgreSQL (Neon), Redis |
| Deployment | Google Cloud Run, EC2, Render, Vercel |

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | ≥ 20 (see `.node-version`) |
| **npm** | ≥ 11 |
| **Python** | ≥ 3.10 (for DockStudio API) |
| **Docker & Docker Compose** | Latest (for Redis) |

### 1. Clone & Install

```bash
git clone https://github.com/MistaHolmes/DraftDock.git
cd DraftDock

# Install all workspace dependencies (root + all apps)
npm install
```

### 2. Environment Variables

Each app reads from its own `.env` file. Create them from the examples below:

#### `apps/backend/.env`

```env
# Database (PostgreSQL — Neon or local)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
DIRECT_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Redis
REDIS_URL=redis://localhost:6379

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Server Ports
PORT=3000
WS_PORT=3001
COLLAB_PORT=3002

# Email (Optional — for notifications)
EMAIL_USER=your@email.com
EMAIL_PASS=your_app_password

# AI Features (Optional — uses mock if empty)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

#### `apps/frontend/.env`

```env
# Clerk Authentication (Client side)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend API URLs
VITE_API_URL=http://localhost:3000
VITE_COLLAB_WS_URL=ws://localhost:3002
VITE_WS_URL=http://localhost:3001
```

#### `apps/dockstudio/.env.local`

```env
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/main
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/main

# DockStudio Python API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Important:** `NEXT_PUBLIC_API_URL` must point to the **Python FastAPI server** (default port 8000), not the Node.js backend.

#### `apps/dockstudio/api/.env`

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Clerk (for JWT verification)
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://your-clerk-instance.clerk.accounts.dev/.well-known/jwks.json

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-haiku-4-5-20251001

# Allowed frontend origins (comma-separated)
FRONTEND_URLS=http://localhost:3000,http://localhost:3004
```

### 3. Database Setup

The project uses **two separate databases** — one for the main blogging platform (Prisma JS) and one for DockStudio (Prisma Python).

#### Backend (Node.js Prisma)

```bash
# Generate the Prisma client
cd apps/backend
npx prisma generate --schema=prisma/schema.prisma

# Run migrations (first time / schema changes)
npx prisma migrate deploy
```

#### DockStudio API (Python Prisma)

```bash
cd apps/dockstudio/api

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install Python dependencies
pip install -r requirements.txt

# Generate the Prisma Python client
python -m prisma generate --schema=prisma/schema.prisma

# Push schema to database (first time)
python -m prisma db push --schema=prisma/schema.prisma
```

> **Note:** DockStudio uses `prisma-client-py`, which is the Python Prisma client. Use `python -m prisma` instead of `npx prisma` for all Prisma operations.

### 4. Run All Apps with Turbo

```bash
# Start Redis first
docker-compose up -d

# Start all apps concurrently via Turborepo
npm run dev
```

> This will NOT start the DockStudio Python API — you need to start that separately (see step 6).

**Default ports:**

| App | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| WebSocket Server | ws://localhost:3001 |
| Collab Server | ws://localhost:3002 |
| DockStudio (Next.js) | http://localhost:3003 |

### 5. Run Apps Individually

If you prefer to start services one at a time (or if `turbo` is not installed):

```bash
# Terminal 1 — Redis
docker-compose up -d

# Terminal 2 — Backend API
cd apps/backend
npm run dev           # Builds TS then starts server on ports 3000, 3001, 3002

# Terminal 3 — Frontend
cd apps/frontend
npm run dev           # Vite dev server on port 5173

# Terminal 4 — DockStudio (Next.js frontend)
cd apps/dockstudio
npm run dev           # Next.js dev server on port 3000 (configure per turbo)
```

### 6. DockStudio Python API Setup

The DockStudio Python API is a **separate process** that must be started independently:

```bash
cd apps/dockstudio/api

# Activate virtual environment
source .venv/bin/activate

# Start FastAPI with hot reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Google Cloud Run |
| Backend | Google Cloud Run / EC2 |
| DockStudio (Next.js) | Render / Vercel |
| DockStudio API | Render |
| Monitoring | Self-hosted (EC2) |

Live sites:
- **Blogging Platform:** [https://www.draftdocks.in/](https://www.draftdocks.in/)
- **DockStudio:** [https://dockstudio.abhasbehera.in/](https://dockstudio.abhasbehera.in/)

---

## License

[MIT](LICENSE)
