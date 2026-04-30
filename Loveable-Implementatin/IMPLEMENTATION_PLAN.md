# PixelPlot — Complete Implementation Plan (Junior Developer Guide)

> **Last Updated:** 2026-04-03
> **Timeline:** 2-day hackathon sprint | **Audience:** Junior dev, new to Next.js & Python

---

## 💰 Will a $5 Claude API Key Suffice for a 2-Day Hackathon?

**Short answer: Yes — use Haiku, it's more than enough.**

| Model | Input cost | Output cost | Cost per typical plan request (~2K in / 3K out) | $5 budget gives you |
|---|---|---|---|---|
| **claude-haiku-3-5** | $0.80/MTok | $4/MTok | ~$0.014 | **~350 AI calls** ✅ |
| **claude-sonnet-4-5** | $3/MTok | $15/MTok | ~$0.051 | ~98 AI calls ⚠️ |

**Recommendation:**
- Use `claude-haiku-3-5` for most plan generation, file generation, and error repair.
- Optionally use `claude-sonnet-4-5` only for the final demo presentation request (1-2 calls).
- At ~30–50 test runs during dev + demo, you'll spend roughly **$0.50–$1** with Haiku. $5 is very comfortable.

> ⚠️ Set a hard budget cap in your Anthropic console to prevent runaway spend during live demos.

---

## Table of Contents

- [What is PixelPlot?](#what-is-pixelplot)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [What's Already Built](#whats-already-built)
- [Environment Setup](#environment-setup)
- [Phase 1 — Auth & User Sync (Day 1 Morning)](#phase-1--auth--user-sync-day-1-morning)
- [Phase 2 — Database Schema & Project CRUD (Day 1 Morning)](#phase-2--database-schema--project-crud-day-1-morning)
- [Phase 3 — Task System & AI Integration (Day 1 Afternoon)](#phase-3--task-system--ai-integration-day-1-afternoon)
- [Phase 4 — WebContainer + Preview (Day 1 Evening)](#phase-4--webcontainer--preview-day-1-evening)
- [Phase 5 — Editor, Files & Versioning (Day 2 Morning)](#phase-5--editor-files--versioning-day-2-morning)
- [Phase 6 — Polish & Demo Prep (Day 2 Afternoon)](#phase-6--polish--demo-prep-day-2-afternoon)
- [Glossary](#glossary)
- [Reference Docs](#reference-docs)

---

## What is PixelPlot?

PixelPlot is an **AI-powered code generation platform**. The user flow is:

```
1. User signs up / logs in (via Clerk)
2. User creates a project
3. User types a prompt ("Build me a to-do app")
4. AI generates a plan (Python FastAPI + Claude)
5. User approves the plan
6. Files are generated and written into a sandbox
7. App runs in a WebContainer (browser sandbox)
8. User sees a live preview
9. User can edit code in a Monaco editor
10. All history/versions are saved
```

---

## Architecture Overview

```
┌───────────────────────────────────────────┐
│          Next.js Frontend (packages/fe)   │
│  ┌──────────┐  ┌──────────────────────┐   │
│  │ React UI │  │ Clerk Auth Provider  │   │
│  │ (pages)  │  │ (JWT sessions)       │   │
│  └────┬─────┘  └──────────┬───────────┘   │
│       │  HTTP + Bearer JWT │              │
│  ┌────▼───────────────────▼───────────┐   │
│  │  WebContainer (browser sandbox)    │   │
│  └────────────────────────────────────┘   │
└───────────────────────┬───────────────────┘
                        │ REST API (Bearer JWT)
                        ▼
          ┌─────────────────────────────┐
          │   Python FastAPI Backend    │
          │   (packages/api)            │
          │                             │
          │  • Verifies Clerk JWT       │
          │  • All business logic       │
          │  • Prisma Python client     │
          │  • Claude AI calls          │
          └──────────────┬──────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  PostgreSQL │
                  └─────────────┘
```

### What each piece does

| Component | Role | Where |
|---|---|---|
| **Next.js** | Frontend UI only — no API routes | `packages/fe/` |
| **Clerk** | Auth (signup, login, JWT sessions) | External service |
| **Python FastAPI** | ALL backend API logic, DB operations | `packages/api/` |
| **Prisma (Python)** | Type-safe DB queries from Python | `packages/api/prisma/` |
| **PostgreSQL** | Permanent data storage | External DB |
| **Claude AI (Anthropic)** | AI planning & code generation | External API |
| **WebContainers** | In-browser code execution sandbox | Browser runtime |
| **Monaco Editor** | Code editor (same as VS Code) | Browser component |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | File-based routing, server components |
| Auth | Clerk | Easiest auth with JWT support |
| Backend | Python 3.11 + FastAPI | Async, fast, great for AI integrations |
| ORM | Prisma (`prisma-client-py`) | Type-safe, schema-first, easy migrations |
| Database | PostgreSQL | Relational, reliable |
| AI | Anthropic Claude (Haiku/Sonnet) | $5 budget-friendly, powerful |
| Sandbox | WebContainers API | Browser-native Node.js runtime |
| Editor | Monaco Editor | VS Code-quality in-browser editor |

> ❌ **Removed from original plan:** Redis, BullMQ, Drizzle ORM, Next.js API routes
> ✅ **Synchronous AI calls** are fine for a 2-day hackathon — no job queues needed

---

## What's Already Built

| Component | Status | File(s) |
|---|---|---|
| Monorepo structure | ✅ | Root `package.json` with workspaces |
| Next.js app shell | ✅ | `packages/fe/` |
| Landing page with shader effects | ✅ | `app/page.tsx`, `app/internalComps/hero.tsx` |
| Clerk auth provider | ✅ | `app/layout.tsx` (ClerkProvider) |
| Clerk middleware (route protection) | ✅ | `proxy.ts` |
| Sign-in / Sign-up pages | ✅ | `app/sign-in/`, `app/sign-up/` |
| Protected route group | ✅ | `app/(authedRoutes)/` |
| Placeholder main page | ✅ | `app/(authedRoutes)/main/page.tsx` |
| Shadcn UI + Tailwind | ✅ | `components/ui/`, `globals.css` |
| **Everything below** | ❌ | **You build this** |

---

## Environment Setup

### Prerequisites

```bash
# 1. Node.js (v20+)
node --version   # should print v20.x or higher

# 2. Python (3.11+)
python3 --version

# 3. PostgreSQL — easiest via Docker for hackathon:
docker run -d --name pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16

# 4. Verify psql works
psql -U postgres -h localhost -c "SELECT version();"
```

### Clone and install frontend

```bash
cd packages/fe
npm install
```

### Frontend environment variables

Create `packages/fe/.env.local`:

```env
# Clerk (get from https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/main
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/main

# FastAPI backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ✅ **No database URL in the frontend .env** — the frontend never touches the DB directly. All DB access goes through the FastAPI backend.

### Backend environment variables

Create `packages/api/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pixelplot

# Clerk (for JWT verification — get from https://dashboard.clerk.com → API Keys)
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_JWKS_URL=https://<your-clerk-domain>.clerk.accounts.dev/.well-known/jwks.json

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-xxxxx
CLAUDE_MODEL=claude-haiku-3-5   # or claude-sonnet-4-5 for better quality
```

### Create the database

```bash
psql -U postgres -h localhost -c "CREATE DATABASE pixelplot;"
```

### Run everything

Terminal 1 — Frontend:
```bash
cd packages/fe && npm run dev
# http://localhost:3000
```

Terminal 2 — Backend:
```bash
cd packages/api
source venv/bin/activate
uvicorn main:app --port 8000 --reload
# http://localhost:8000/docs  ← Swagger UI auto-generated
```

---

## Phase 1 — Auth & User Sync (Day 1 Morning)

**Goal:** Bootstrap the FastAPI backend with Prisma, verify Clerk JWT, upsert users into PostgreSQL.

### Step 1.1 — Set up Python backend

```bash
mkdir packages/api && cd packages/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn prisma anthropic python-jose[cryptography] httpx python-dotenv pydantic
pip freeze > requirements.txt
```

**What is FastAPI?** Python web framework for building REST APIs. It auto-generates a Swagger UI at `/docs`.
**What is Prisma (Python)?** A type-safe ORM. You define your schema in `schema.prisma`, run `prisma generate`, and get a full Python client.

### Step 1.2 — Define the Prisma schema

Create `packages/api/prisma/schema.prisma`:

```prisma
generator client {
  provider             = "prisma-client-py"
  interface            = "asyncio"
  recursive_type_depth = 5
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique @map("clerk_id")
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  projects  Project[]
  tasks     Task[]
  approvals Approval[]

  @@map("users")
}

model Project {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  name         String
  description  String?
  templateType String   @default("react-node") @map("template_type")
  status       String   @default("active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  settings         ProjectSettings?
  tasks            Task[]
  projectFiles     ProjectFile[]
  runs             Run[]
  runtimeSessions  RuntimeSession[]

  @@index([userId])
  @@map("projects")
}

model ProjectSettings {
  id           String   @id @default(uuid())
  projectId    String   @unique @map("project_id")
  runtime      String   @default("webcontainer")
  installCmd   String   @default("npm install") @map("install_cmd")
  startCmd     String   @default("npm run dev") @map("start_cmd")
  buildCmd     String   @default("npm run build") @map("build_cmd")
  templateName String   @default("react-node") @map("template_name")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_settings")
}

model Task {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")
  prompt    String
  status    String   @default("pending")  // pending | planned | approved | running | done | failed
  planJson  Json?    @map("plan_json")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  steps           TaskStep[]
  fileVersions    FileVersion[]
  approvals       Approval[]
  runs            Run[]
  runtimeSessions RuntimeSession[]

  @@index([projectId])
  @@index([userId])
  @@map("tasks")
}

model TaskStep {
  id          String   @id @default(uuid())
  taskId      String   @map("task_id")
  stepType    String   @map("step_type")
  title       String
  description String?
  status      String   @default("pending")
  orderIndex  Int      @default(0) @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("task_steps")
}

model ProjectFile {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  path        String
  language    String?
  contentHash String?  @map("content_hash")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project  Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  versions FileVersion[]

  @@unique([projectId, path])
  @@map("project_files")
}

model FileVersion {
  id            String   @id @default(uuid())
  projectFileId String   @map("project_file_id")
  taskId        String?  @map("task_id")
  versionNumber Int      @default(1) @map("version_number")
  content       String
  diffText      String?  @map("diff_text")
  createdAt     DateTime @default(now()) @map("created_at")

  projectFile ProjectFile @relation(fields: [projectFileId], references: [id], onDelete: Cascade)
  task        Task?       @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@index([projectFileId])
  @@map("file_versions")
}

model Approval {
  id         String    @id @default(uuid())
  taskId     String    @map("task_id")
  userId     String    @map("user_id")
  approved   Boolean   @default(false)
  approvedAt DateTime? @map("approved_at")
  notes      String?
  createdAt  DateTime  @default(now()) @map("created_at")

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("approvals")
}

model Run {
  id         String    @id @default(uuid())
  taskId     String    @map("task_id")
  projectId  String    @map("project_id")
  status     String    @default("pending")  // pending | running | success | failed
  previewUrl String?   @map("preview_url")
  startedAt  DateTime? @map("started_at")
  finishedAt DateTime? @map("finished_at")
  exitCode   Int?      @map("exit_code")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  task    Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  logs    RunLog[]

  @@index([taskId])
  @@index([projectId])
  @@map("runs")
}

model RunLog {
  id         String   @id @default(uuid())
  runId      String   @map("run_id")
  streamType String   @map("stream_type")  // stdout | stderr
  message    String
  createdAt  DateTime @default(now()) @map("created_at")

  run Run @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([runId])
  @@map("run_logs")
}

model RuntimeSession {
  id         String   @id @default(uuid())
  projectId  String   @map("project_id")
  taskId     String?  @map("task_id")
  sessionKey String   @unique @map("session_key")
  previewUrl String?  @map("preview_url")
  status     String   @default("active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task    Task?   @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@map("runtime_sessions")
}
```

Run the migration:

```bash
cd packages/api
prisma generate          # generates the Python client
prisma db push           # pushes schema to DB (fast for hackathon — no migration files)
```

> 💡 `prisma db push` is faster than `prisma migrate dev` for hackathons. Use `migrate dev` when you need a production migration history.

### Step 1.3 — Clerk JWT verification helper

Create `packages/api/auth.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jose.backends import RSAKey
import httpx, os
from functools import lru_cache

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
security = HTTPBearer()

@lru_cache(maxsize=1)
def get_jwks():
    """Fetch Clerk's public keys (cached — only fetched once per process)."""
    resp = httpx.get(CLERK_JWKS_URL)
    resp.raise_for_status()
    return resp.json()

def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    jwks = get_jwks()

    try:
        # Let jose pick the right key from the JWKS
        header = jwt.get_unverified_header(token)
        key_id = header.get("kid")

        # Find matching key
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == key_id:
                rsa_key = key
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token key")

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
```

### Step 1.4 — User sync endpoint

Create `packages/api/routers/users.py`:

```python
from fastapi import APIRouter, Depends
from prisma import Prisma
from auth import verify_clerk_token
from db import get_db

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/sync")
async def sync_user(
    payload: dict = Depends(verify_clerk_token),
    db: Prisma = Depends(get_db)
):
    """Called by frontend after login to sync Clerk user → DB."""
    clerk_id = payload["sub"]
    email = payload.get("email", "")
    name = f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip()
    avatar_url = payload.get("image_url")

    user = await db.user.upsert(
        where={"clerk_id": clerk_id},
        data={
            "create": {
                "clerkId": clerk_id,
                "email": email,
                "name": name or None,
                "avatarUrl": avatar_url,
            },
            "update": {
                "email": email,
                "name": name or None,
                "avatarUrl": avatar_url,
            }
        }
    )
    return user
```

Create `packages/api/db.py` (shared DB connection):

```python
from prisma import Prisma
from contextlib import asynccontextmanager

_db = Prisma()

async def get_db() -> Prisma:
    if not _db.is_connected():
        await _db.connect()
    return _db
```

### Step 1.5 — Frontend: call /sync after login

In `packages/fe/app/(authedRoutes)/layout.tsx`, add a sync call on mount:

```tsx
"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    useEffect(() => {
        const sync = async () => {
            const token = await getToken();
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        };
        sync();
    }, []);

    return <>{children}</>;
}
```

### ✅ Phase 1 Checklist

- [ ] Python venv created and deps installed
- [ ] `schema.prisma` created with all models
- [ ] `prisma generate` and `prisma db push` run successfully
- [ ] `auth.py` verifies Clerk JWT tokens
- [ ] `POST /api/users/sync` upserts user into DB
- [ ] Frontend layout calls `/sync` after login
- [ ] DB has exactly 1 row per user after login

---

---

## Phase 2 — Database Schema & Project CRUD (Day 1 Morning)

**Goal:** All tables are already defined in the Prisma schema from Phase 1. Now wire the Project CRUD API in FastAPI and build the dashboard UI.

> The Prisma schema in Phase 1 already includes all 11 models. No code changes needed — just verify `prisma db push` ran cleanly.

### Step 2.1 — Project CRUD router

Create `packages/api/routers/projects.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from prisma import Prisma
from auth import verify_clerk_token
from db import get_db
from typing import Optional

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    templateType: str = "react-node"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

async def get_current_user(payload: dict = Depends(verify_clerk_token), db: Prisma = Depends(get_db)):
    user = await db.user.find_unique(where={"clerkId": payload["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found — call /api/users/sync first")
    return user

# GET /api/projects
@router.get("/")
async def list_projects(user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    return await db.project.find_many(where={"userId": user.id}, order={"createdAt": "desc"})

# POST /api/projects
@router.post("/", status_code=201)
async def create_project(body: ProjectCreate, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    return await db.project.create(data={
        "userId": user.id,
        "name": body.name,
        "description": body.description,
        "templateType": body.templateType,
    })

# GET /api/projects/{id}
@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    project = await db.project.find_first(where={"id": project_id, "userId": user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Not found")
    return project

# PATCH /api/projects/{id}
@router.patch("/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    data = {k: v for k, v in body.dict().items() if v is not None}
    return await db.project.update(where={"id": project_id}, data=data)

# DELETE /api/projects/{id}
@router.delete("/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    await db.project.delete(where={"id": project_id})
    return {"success": True}
```

### Step 2.2 — Main FastAPI entry point

Create `packages/api/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import users, projects, tasks

load_dotenv()

app = FastAPI(title="PixelPlot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

### Step 2.3 — Frontend API client utility

Create `packages/fe/lib/api.ts` — a thin wrapper that always sends the Clerk JWT:

```ts
"use client";
import { useAuth } from "@clerk/nextjs";

const API = process.env.NEXT_PUBLIC_API_URL!;

export function useApi() {
    const { getToken } = useAuth();

    const request = async (method: string, path: string, body?: unknown) => {
        const token = await getToken();
        const res = await fetch(`${API}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    };

    return {
        get: (path: string) => request("GET", path),
        post: (path: string, body: unknown) => request("POST", path, body),
        patch: (path: string, body: unknown) => request("PATCH", path, body),
        del: (path: string) => request("DELETE", path),
    };
}
```

### Step 2.4 — Dashboard page

Update `packages/fe/app/(authedRoutes)/main/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Project = { id: string; name: string; description: string | null; createdAt: string };

export default function MainPage() {
    const api = useApi();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/projects/").then(setProjects).finally(() => setLoading(false));
    }, []);

    const createProject = async () => {
        const name = prompt("Project name?");
        if (!name) return;
        const p = await api.post("/api/projects/", { name });
        setProjects((prev) => [p, ...prev]);
    };

    if (loading) return <div className="p-8">Loading…</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">My Projects</h1>
                <Button onClick={createProject}>+ New Project</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                    <a key={p.id} href={`/project/${p.id}`} className="border rounded-lg p-4 hover:shadow-md transition">
                        <h2 className="font-semibold text-lg">{p.name}</h2>
                        <p className="text-sm text-muted-foreground">{p.description ?? "No description"}</p>
                    </a>
                ))}
                {projects.length === 0 && (
                    <p className="text-muted-foreground col-span-2 text-center py-12">
                        No projects yet. Click "New Project" to start!
                    </p>
                )}
            </div>
        </div>
    );
}
```

### ✅ Phase 2 Checklist

- [ ] `GET /api/projects/` returns empty array for new user
- [ ] `POST /api/projects/` creates a project
- [ ] `GET /api/projects/{id}` returns the project
- [ ] `PATCH /api/projects/{id}` updates it
- [ ] `DELETE /api/projects/{id}` deletes it
- [ ] `/docs` (FastAPI Swagger) shows all endpoints
- [ ] Dashboard lists projects and "New Project" button works

---

---

## Phase 3 — Task System & AI Integration (Day 1 Afternoon)

**Goal:** User types a prompt → Claude generates a plan → user approves it.

> **No LangChain needed** — we call the Anthropic SDK directly. It's simpler, cheaper, and plenty powerful for a hackathon.

### Step 3.1 — Claude AI service

Create `packages/api/services/ai.py`:

```python
import anthropic, os, json
from typing import Any

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-3-5")

PLAN_SYSTEM_PROMPT = """You are a code generation assistant for a Loveable-style platform.
Given a user prompt, return a JSON plan to build the requested feature.
Your response must be valid JSON only (no markdown, no backticks).

JSON schema:
{
  "steps": [
    {
      "step_type": "create_file" | "modify_file" | "run_command",
      "title": "string",
      "description": "string",
      "file_path": "string or null",
      "content": "full file content as string or null"
    }
  ]
}
"""

def generate_plan(prompt: str, template_type: str = "react-node") -> dict[str, Any]:
    """Call Claude synchronously and return a structured plan."""
    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": f"Template: {template_type}\n\nUser request: {prompt}\n\nReturn the JSON plan."
            }
        ],
        system=PLAN_SYSTEM_PROMPT,
    )
    raw = message.content[0].text.strip()
    # Strip markdown code fences if Claude adds them despite instructions
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def repair_error(prompt: str, error_log: str, files: dict[str, str]) -> dict[str, Any]:
    """Ask Claude to fix a build/runtime error."""
    files_context = "\n\n".join(
        f"--- {path} ---\n{content}" for path, content in files.items()
    )
    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Original request: {prompt}\n\n"
                    f"Error log:\n{error_log}\n\n"
                    f"Current files:\n{files_context}\n\n"
                    "Return a JSON repair plan with the same schema as before."
                )
            }
        ],
        system=PLAN_SYSTEM_PROMPT,
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
```

### Step 3.2 — Task CRUD + plan generation router

Create `packages/api/routers/tasks.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from prisma import Prisma
from auth import verify_clerk_token
from db import get_db
from services.ai import generate_plan
from routers.projects import get_current_user
from typing import Optional

router = APIRouter(tags=["tasks"])

class TaskCreate(BaseModel):
    prompt: str

# POST /api/projects/{project_id}/tasks
@router.post("/api/projects/{project_id}/tasks", status_code=201)
async def create_task(
    project_id: str,
    body: TaskCreate,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    # Verify project belongs to user
    project = await db.project.find_first(where={"id": project_id, "userId": user.id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Create task
    task = await db.task.create(data={
        "projectId": project_id,
        "userId": user.id,
        "prompt": body.prompt,
        "status": "pending",
    })

    # Call Claude to get a plan
    try:
        plan = generate_plan(body.prompt, project.templateType)
    except Exception as e:
        await db.task.update(where={"id": task.id}, data={"status": "failed"})
        raise HTTPException(status_code=500, detail=f"AI plan generation failed: {str(e)}")

    # Save plan to task
    task = await db.task.update(
        where={"id": task.id},
        data={"planJson": plan, "status": "planned"}
    )

    # Create task steps in DB for tracking
    for i, step in enumerate(plan.get("steps", [])):
        await db.taskstep.create(data={
            "taskId": task.id,
            "stepType": step["step_type"],
            "title": step["title"],
            "description": step.get("description", ""),
            "orderIndex": i,
        })

    return task

# GET /api/projects/{project_id}/tasks
@router.get("/api/projects/{project_id}/tasks")
async def list_tasks(project_id: str, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    return await db.task.find_many(
        where={"projectId": project_id},
        order={"createdAt": "desc"},
        include={"steps": True}
    )

# POST /api/tasks/{task_id}/approve
@router.post("/api/tasks/{task_id}/approve")
async def approve_task(task_id: str, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    task = await db.task.find_unique(where={"id": task_id})
    if not task or task.userId != user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.approval.create(data={
        "taskId": task_id,
        "userId": user.id,
        "approved": True,
        "approvedAt": None,  # Prisma sets timestamps, use Python datetime if needed
    })

    updated = await db.task.update(
        where={"id": task_id},
        data={"status": "approved"}
    )
    return updated

# GET /api/tasks/{task_id}
@router.get("/api/tasks/{task_id}")
async def get_task(task_id: str, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    task = await db.task.find_first(
        where={"id": task_id, "userId": user.id},
        include={"steps": True}
    )
    if not task:
        raise HTTPException(status_code=404, detail="Not found")
    return task
```

### Step 3.3 — Project prompt UI

Create `packages/fe/app/(authedRoutes)/project/[id]/page.tsx`:

```tsx
"use client";
import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Step = { id: string; title: string; stepType: string; description: string };
type Task = { id: string; status: string; prompt: string; planJson: { steps: Step[] } | null };

export default function ProjectPage({ params }: { params: { id: string } }) {
    const api = useApi();
    const [prompt, setPrompt] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/api/projects/${params.id}/tasks`).then(setTasks);
    }, []);

    const submitPrompt = async () => {
        setLoading(true);
        try {
            const task = await api.post(`/api/projects/${params.id}/tasks`, { prompt });
            setTasks((prev) => [task, ...prev]);
            setPrompt("");
        } finally {
            setLoading(false);
        }
    };

    const approveTask = async (taskId: string) => {
        await api.post(`/api/tasks/${taskId}/approve`, {});
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "approved" } : t));
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Project Workspace</h1>

            {/* Prompt input */}
            <div className="space-y-2">
                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to build…"
                    rows={4}
                />
                <Button onClick={submitPrompt} disabled={loading || !prompt.trim()}>
                    {loading ? "Generating plan…" : "Generate Plan"}
                </Button>
            </div>

            {/* Task list */}
            {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="font-medium">{task.prompt}</p>
                        <span className="text-xs px-2 py-1 rounded bg-muted">{task.status}</span>
                    </div>

                    {task.planJson && (
                        <ol className="space-y-1 text-sm">
                            {task.planJson.steps.map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-muted-foreground">{i + 1}.</span>
                                    <span><strong>{s.title}</strong> — {s.description}</span>
                                </li>
                            ))}
                        </ol>
                    )}

                    {task.status === "planned" && (
                        <Button size="sm" onClick={() => approveTask(task.id)}>
                            ✓ Approve Plan
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}
```

### ✅ Phase 3 Checklist

- [ ] `services/ai.py` calls Claude successfully
- [ ] `POST /api/projects/{id}/tasks` creates task + saves Claude plan
- [ ] Task steps saved to DB
- [ ] `POST /api/tasks/{id}/approve` updates status to `approved`
- [ ] UI shows prompt input → plan steps → approve button
- [ ] Test with a real prompt: "Build me a to-do app"

---

---

## Phase 4 — WebContainer + Preview (Day 1 Evening)

**Goal:** After approval, generated files run in a browser sandbox with live preview.

### What is a WebContainer?

A WebContainer runs Node.js **inside the browser**. No Docker or server needed. It provides:
- A virtual file system
- `npm install`
- `npm run dev`
- A preview URL (served inside the browser)

**Recommended reading:** [WebContainers Quickstart](https://webcontainers.io/guides/quickstart)

### Step 4.1 — Install WebContainer API

```bash
cd packages/fe
npm install @webcontainer/api
```

Also update `vite.config.ts` (or `next.config.ts`) to add the required COOP/COEP headers:

```ts
// next.config.ts
const nextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
                ],
            },
        ];
    },
};
export default nextConfig;
```

> ⚠️ WebContainers require `COOP: same-origin` and `COEP: require-corp` headers. Without these, `WebContainer.boot()` will throw.

### Step 4.2 — WebContainer hook

Create `packages/fe/app/(authedRoutes)/project/[id]/hooks/useWebContainer.ts`:

```ts
"use client";
import { WebContainer } from "@webcontainer/api";
import { useState, useEffect, useRef } from "react";

export function useWebContainer() {
    const [instance, setInstance] = useState<WebContainer | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    const booted = useRef(false);

    useEffect(() => {
        if (booted.current) return;
        booted.current = true;

        WebContainer.boot().then((wc) => {
            setInstance(wc);
            wc.on("server-ready", (_port, url) => setPreviewUrl(url));
        });
    }, []);

    const writeFiles = async (files: Record<string, string>) => {
        if (!instance) return;
        for (const [path, content] of Object.entries(files)) {
            const parts = path.split("/");
            if (parts.length > 1) {
                await instance.fs.mkdir(parts.slice(0, -1).join("/"), { recursive: true });
            }
            await instance.fs.writeFile(path, content);
        }
    };

    const runCommand = async (cmd: string, args: string[] = []) => {
        if (!instance) return null;
        const proc = await instance.spawn(cmd, args);
        proc.output.pipeTo(new WritableStream({
            write(data) { setLogs((prev) => [...prev, data]); },
        }));
        return proc;
    };

    return { instance, previewUrl, logs, writeFiles, runCommand };
}
```

### Step 4.3 — Wire the approval → run flow

After a task is approved, the frontend should:
1. Extract `create_file` steps from `task.planJson.steps`
2. Call `writeFiles()` with the generated file contents
3. Run `npm install`
4. Run `npm run dev`
5. Wait for `previewUrl` to populate
6. Show the iframe preview

Add this to the project page (`project/[id]/page.tsx`):

```tsx
const { writeFiles, runCommand, previewUrl, logs } = useWebContainer();

const runApprovedTask = async (task: Task) => {
    if (!task.planJson) return;
    // Build a files map from create_file steps
    const files: Record<string, string> = {};
    for (const step of task.planJson.steps) {
        if (step.step_type === "create_file" && step.file_path && step.content) {
            files[step.file_path] = step.content;
        }
    }
    await writeFiles(files);
    await runCommand("npm", ["install"]);
    await runCommand("npm", ["run", "dev"]);
};

// Add a "Run" button after approval, and an iframe at the bottom:
// <Button onClick={() => runApprovedTask(task)}>▶ Run in Sandbox</Button>
// {previewUrl && <iframe src={previewUrl} className="w-full h-96 border rounded" />}
// <pre className="text-xs bg-black text-green-400 p-3 rounded">{logs.join("\n")}</pre>
```

### ✅ Phase 4 Checklist

- [ ] COOP/COEP headers configured in Next.js
- [ ] WebContainer boots in the browser (no `SharedArrayBuffer` error)
- [ ] Files written from plan's `create_file` steps
- [ ] `npm install` runs (shows logs)
- [ ] `npm run dev` starts a dev server
- [ ] Preview iframe shows the running app
- [ ] Logs appear in the terminal panel

---

---

## Phase 5 — Editor, Files & Versioning (Day 2 Morning)

**Goal:** Monaco code editor + save edits to DB via FastAPI + file version history.

### Step 5.1 — Install Monaco Editor

```bash
cd packages/fe
npm install @monaco-editor/react
```

### Step 5.2 — Editor component

Create `packages/fe/components/CodeEditor.tsx`:

```tsx
"use client";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
    value: string;
    language: string;
    onChange: (value: string | undefined) => void;
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
    return (
        <Editor
            height="100%"
            language={language}
            value={value}
            onChange={onChange}
            theme="vs-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
            }}
        />
    );
}
```

### Step 5.3 — File persistence API in FastAPI

Add to `packages/api/routers/projects.py`:

```python
class FileSave(BaseModel):
    path: str
    content: str
    language: Optional[str] = None
    task_id: Optional[str] = None

@router.put("/{project_id}/files")
async def save_file(
    project_id: str,
    body: FileSave,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """Upsert a file and create a new version record."""
    import hashlib
    content_hash = hashlib.md5(body.content.encode()).hexdigest()

    # Upsert project_file
    existing = await db.projectfile.find_first(
        where={"projectId": project_id, "path": body.path}
    )

    if existing:
        file = await db.projectfile.update(
            where={"id": existing.id},
            data={"contentHash": content_hash, "language": body.language}
        )
        version_count = await db.fileversion.count(where={"projectFileId": file.id})
        version_number = version_count + 1
    else:
        file = await db.projectfile.create(data={
            "projectId": project_id,
            "path": body.path,
            "language": body.language,
            "contentHash": content_hash,
        })
        version_number = 1

    # Create version record
    version = await db.fileversion.create(data={
        "projectFileId": file.id,
        "taskId": body.task_id,
        "versionNumber": version_number,
        "content": body.content,
    })

    return {"file": file, "version": version}

@router.get("/{project_id}/files")
async def list_files(project_id: str, user=Depends(get_current_user), db: Prisma = Depends(get_db)):
    return await db.projectfile.find_many(
        where={"projectId": project_id},
        include={"versions": {"order_by": {"versionNumber": "desc"}, "take": 1}}
    )
```

### Step 5.4 — Editor save + WebContainer sync

In the project page, when the user edits a file:
1. Call `PUT /api/projects/{id}/files` to persist to DB
2. Call `instance.fs.writeFile(path, content)` to update WebContainer
3. Preview hot-reloads automatically (Vite HMR)

```tsx
const saveFile = async (path: string, content: string) => {
    // Save to DB via FastAPI
    await api.put(`/api/projects/${params.id}/files`, { path, content });
    // Sync to WebContainer
    await instance?.fs.writeFile(path, content);
};
```

### ✅ Phase 5 Checklist

- [ ] Monaco editor renders and shows file content
- [ ] File tree on the left lets user switch files
- [ ] Editing and saving calls `PUT /api/projects/{id}/files`
- [ ] File versions tracked in `file_versions` table
- [ ] WebContainer hot-reloads after file save

---

## Phase 6 — Polish & Demo Prep (Day 2 Afternoon)

**Goal:** Error recovery with Claude, loading states, and a clean demo flow.

> ❌ **No Redis/BullMQ** — synchronous calls work fine for a hackathon. If Claude takes 5 seconds, show a spinner. That's it.

### Step 6.1 — Auto-repair on build failure

Add to `packages/api/services/ai.py` (already written in Phase 3). Now wire it in the tasks router:

```python
# POST /api/tasks/{task_id}/repair — called if the WebContainer build fails
@router.post("/api/tasks/{task_id}/repair")
async def repair_task(
    task_id: str,
    body: dict,   # { error_log: str, files: dict[str, str] }
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    task = await db.task.find_unique(where={"id": task_id})
    if not task:
        raise HTTPException(404)

    repair_plan = repair_error(task.prompt, body["error_log"], body["files"])

    # Save repair as a new task
    new_task = await db.task.create(data={
        "projectId": task.projectId,
        "userId": user.id,
        "prompt": f"[AUTO-REPAIR] {task.prompt}",
        "planJson": repair_plan,
        "status": "planned",
    })
    return new_task
```

On the frontend, when `npm install` or `npm run dev` fails (non-zero exit code), collect the error log and call `/api/tasks/{id}/repair` automatically.

### Step 6.2 — Loading states

Add a loading skeleton to the dashboard and project page. Use Shadcn's `Skeleton` component or a simple spinner:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// While loading projects:
{loading && Array.from({length: 3}).map((_, i) => (
    <Skeleton key={i} className="h-24 w-full rounded-lg" />
))}
```

### Step 6.3 — Demo flow checklist

Practice this exact flow before presenting:

1. Open the app → sign in → dashboard shows (empty is OK)
2. Click "New Project" → type "My Demo App" → project created
3. Click into the project → type prompt "Build a simple counter app with React"
4. Wait ~5 seconds → Claude plan appears
5. Click "Approve Plan" → status changes to "approved"
6. Click "Run in Sandbox" → npm install runs → dev server starts → iframe shows the counter app
7. Open Monaco editor → edit a file → save → preview hot-reloads
8. Mention versioning: "every save creates a version in PostgreSQL"

### Step 6.4 — Environment security

- [ ] `ANTHROPIC_API_KEY` is only in `packages/api/.env` — never in the frontend
- [ ] `DATABASE_URL` is only in `packages/api/.env` — never in the frontend
- [ ] Frontend `.env.local` only has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_API_URL`
- [ ] Set budget cap in [Anthropic Console](https://console.anthropic.com/) → Billing → Usage Limits

### ✅ Phase 6 Checklist

- [ ] Auto-repair endpoint works
- [ ] Build failure triggers repair automatically
- [ ] Loading skeletons on dashboard and project page
- [ ] Full demo flow tested end-to-end (≤10 minutes)
- [ ] API keys secured and budget cap set

---

---

## Full API Routes Summary

All routes are on the **Python FastAPI** server (`localhost:8000`). The frontend calls them with a `Bearer <clerk_jwt>` header.

| Method | Route | Phase | Purpose |
|---|---|---|---|
| GET | `/health` | ✅ | Health check |
| POST | `/api/users/sync` | 1 | Upsert Clerk user → DB |
| GET | `/api/projects/` | 2 | List user's projects |
| POST | `/api/projects/` | 2 | Create project |
| GET | `/api/projects/{id}` | 2 | Get single project |
| PATCH | `/api/projects/{id}` | 2 | Update project |
| DELETE | `/api/projects/{id}` | 2 | Delete project |
| POST | `/api/projects/{id}/tasks` | 3 | Create task + generate Claude plan |
| GET | `/api/projects/{id}/tasks` | 3 | List tasks |
| GET | `/api/tasks/{id}` | 3 | Get single task with steps |
| POST | `/api/tasks/{id}/approve` | 3 | Approve a plan |
| POST | `/api/tasks/{id}/repair` | 6 | Re-generate plan from error log |
| PUT | `/api/projects/{id}/files` | 5 | Save file + create version |
| GET | `/api/projects/{id}/files` | 5 | List project files |

> 📖 All routes are **automatically documented** at `http://localhost:8000/docs` (FastAPI Swagger UI). Use this during development and demo!

---

## Folder Structure (Target)

```
pixelplot/
├── packages/
│   ├── fe/                            # Next.js frontend
│   │   ├── app/
│   │   │   ├── (authedRoutes)/
│   │   │   │   ├── layout.tsx         # Clerk sync on mount
│   │   │   │   ├── main/page.tsx      # Dashboard
│   │   │   │   └── project/[id]/
│   │   │   │       ├── page.tsx       # Prompt, plan, approve, run
│   │   │   │       └── hooks/
│   │   │   │           └── useWebContainer.ts
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── page.tsx               # Landing page
│   │   ├── components/
│   │   │   ├── ui/                    # Shadcn components
│   │   │   └── CodeEditor.tsx         # Monaco editor wrapper
│   │   ├── lib/
│   │   │   └── api.ts                 # useApi() hook (Auth header)
│   │   ├── next.config.ts             # COOP/COEP headers
│   │   └── proxy.ts                   # Clerk middleware
│   │
│   └── api/                           # Python FastAPI backend
│       ├── main.py                    # App entry, routers, CORS
│       ├── auth.py                    # Clerk JWT verification
│       ├── db.py                      # Prisma connection
│       ├── routers/
│       │   ├── users.py               # /api/users/sync
│       │   ├── projects.py            # /api/projects CRUD + files
│       │   └── tasks.py               # /api/tasks + approve + repair
│       ├── services/
│       │   └── ai.py                  # Claude plan + repair helpers
│       ├── prisma/
│       │   └── schema.prisma          # DB schema (all 11 models)
│       ├── requirements.txt
│       └── .env
└── package.json
```

---

## Glossary

| Term | What it means |
|---|---|
| **FastAPI** | Python web framework for building REST APIs with auto Swagger docs |
| **Prisma** | Schema-first ORM; define models in `schema.prisma`, get a type-safe client |
| **prisma db push** | Sync your schema to the DB without creating migration files (great for hackathons) |
| **Clerk** | Third-party auth service; provides JWT tokens the backend can verify |
| **JWT (JSON Web Token)** | A signed token the frontend sends in the `Authorization: Bearer` header |
| **JWKS** | Clerk's public keys endpoint — used by the backend to verify JWTs without calling Clerk's servers |
| **WebContainer** | Node.js runtime that runs entirely inside the browser (by StackBlitz) |
| **Monaco Editor** | The code editor that powers VS Code, available as a React component |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations |
| **UUID** | A unique identifier like `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| **Foreign Key** | A column that references another table's primary key |
| **Upsert** | Insert if new, update if already exists |
| **COOP/COEP** | Browser security headers required by WebContainers |
| **HMR** | Hot Module Replacement — Vite/Next.js auto-refreshes the preview when files change |

---

## Reference Docs

### Next.js
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

### Clerk
- [Clerk + Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [`useAuth()` reference](https://clerk.com/docs/references/react/use-auth)

### Python FastAPI
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)

### Prisma Python
- [prisma-client-py Docs](https://prisma-client-py.readthedocs.io/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [`prisma db push`](https://www.prisma.io/docs/reference/api-reference/command-reference#db-push)

### Anthropic Claude
- [Anthropic Python SDK](https://github.com/anthropics/anthropic-sdk-python)
- [Messages API](https://docs.anthropic.com/en/api/messages)
- [Model comparison (Haiku vs Sonnet)](https://docs.anthropic.com/en/docs/about-claude/models)

### WebContainers
- [WebContainers Quickstart](https://webcontainers.io/guides/quickstart)
- [Required headers (COOP/COEP)](https://webcontainers.io/guides/configuring-headers)
- [WebContainers API Reference](https://webcontainers.io/api)

### Monaco Editor
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)

---

## 2-Day Sprint Timeline

### Day 1

| Time | Goal |
|---|---|
| 09:00–10:30 | Phase 1: FastAPI setup, Prisma schema, JWT auth, user sync |
| 10:30–12:00 | Phase 2: Project CRUD (FastAPI + frontend dashboard) |
| 13:00–15:00 | Phase 3: Claude AI plan generation, task routes, approve UI |
| 15:00–18:00 | Phase 4: WebContainer boot, write files, npm install + dev, iframe preview |
| 18:00–19:00 | Buffer: fix bugs, test happy path end-to-end |

### Day 2

| Time | Goal |
|---|---|
| 09:00–11:00 | Phase 5: Monaco editor, file tree, file save API, version history |
| 11:00–13:00 | Phase 6: Auto-repair flow, loading states, polish UI |
| 13:00–15:00 | Full end-to-end test + fix blockers |
| 15:00–16:00 | Demo rehearsal — practice the 10-step user flow |
| 16:00+ | Presentation 🎉 |

### Minimum Viable Demo (if short on time)

If you're behind, cut to just these:
- [ ] Sign in (Clerk)
- [ ] Create project
- [ ] Submit prompt → Claude plan displays
- [ ] Approve → WebContainer runs → iframe preview
- [ ] Edit a file in Monaco → preview updates
