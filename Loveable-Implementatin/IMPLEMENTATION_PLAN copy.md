# PixelPlot — Complete Implementation Plan (Junior Developer Guide)

> **Last Updated:** 2026-03-28
> **Timeline:** ~6 weeks | **Audience:** Junior dev, new to Next.js & Python

---

## Table of Contents

- [What is PixelPlot?](#what-is-pixelplot)
- [Architecture Overview](#architecture-overview)
- [What's Already Built](#whats-already-built)
- [Environment Setup](#environment-setup)
- [Phase 1 — Auth & User Sync (Week 1)](#phase-1--auth--user-sync-week-1)
- [Phase 2 — Database Schema & Project CRUD (Week 1-2)](#phase-2--database-schema--project-crud-week-1-2)
- [Phase 3 — Task System & AI Integration (Week 2-3)](#phase-3--task-system--ai-integration-week-2-3)
- [Phase 4 — WebContainer + Preview (Week 3-4)](#phase-4--webcontainer--preview-week-3-4)
- [Phase 5 — Editor, Files & Versioning (Week 4-5)](#phase-5--editor-files--versioning-week-4-5)
- [Phase 6 — Polish, Queues & Production (Week 5-6)](#phase-6--polish-queues--production-week-5-6)
- [Glossary](#glossary)
- [Reference Docs](#reference-docs)

---

## What is PixelPlot?

PixelPlot is an **AI-powered code generation platform**. The user flow is:

```
1. User signs up / logs in (via Clerk)
2. User creates a project
3. User types a prompt ("Build me a to-do app")
4. AI generates a plan (Python LangChain server)
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
┌─────────────────────────────────────────────────────┐
│                   Next.js App (packages/fe)         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ React UI │  │ API Routes   │  │ Drizzle ORM   │  │
│  │ (pages)  │→ │ (server-side)│→ │ (DB queries)  │  │
│  └──────────┘  └──────────────┘  └───────┬───────┘  │
│                                          │          │
│  ┌──────────────────────────────┐        │          │
│  │ WebContainer (browser sandbox)│        │          │
│  └──────────────────────────────┘        │          │
└──────────────────────────────────────────│──────────┘
                                           │
                    ┌──────────────────────┤
                    ▼                      ▼
             ┌────────────┐        ┌─────────────┐
             │ PostgreSQL │        │ Redis+BullMQ│
             └────────────┘        └─────────────┘
                                           │
                    ┌──────────────────────┘
                    ▼
             ┌─────────────────────┐
             │ Python LangChain    │
             │ Server (packages/ai)│
             └─────────────────────┘
```

### What each piece does

| Component | Role | Where |
|---|---|---|
| **Next.js** | Frontend UI + Backend API | `packages/fe/` |
| **Clerk** | Auth (signup, login, sessions) | External service |
| **PostgreSQL** | Permanent data storage | External DB |
| **Drizzle ORM** | TypeScript DB query builder | `packages/fe/app/api/services/db/` |
| **Redis + BullMQ** | Background job queue | External service |
| **Python LangChain** | AI planning & reasoning | `packages/ai/` |
| **WebContainers** | In-browser code execution sandbox | Browser runtime |
| **Monaco Editor** | Code editor (same as VS Code) | Browser component |

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
| DB connection | ✅ | `app/api/services/db/db.ts` |
| Users table schema | ✅ | `app/api/services/db/schema.ts` |
| Clerk sync helper | ✅ | `app/api/services/db/syncClerkUser.ts` |
| Health check API | ✅ | `app/api/health/route.ts` |
| Shadcn UI + Tailwind | ✅ | `components/ui/`, `globals.css` |
| **Everything below** | ❌ | **You build this** |

---

## Environment Setup

### Prerequisites to install on your machine

```bash
# 1. Node.js (v20+)
#    Download from: https://nodejs.org/en/download
node --version   # should print v20.x or higher

# 2. npm (comes with Node.js)
npm --version

# 3. Python (3.11+)
#    Download from: https://www.python.org/downloads/
python3 --version

# 4. PostgreSQL
#    Download from: https://www.postgresql.org/download/
#    OR use Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16

# 5. Redis
#    Download from: https://redis.io/download
#    OR use Docker: docker run -p 6379:6379 redis:7
```

### Clone and install

```bash
# Clone the repo
git clone <repo-url> pixelplot
cd pixelplot

# Install root dependencies
npm install

# Install frontend dependencies
cd packages/fe
npm install
```

### Environment variables

Create/edit `packages/fe/.env.local`:

```env
# Database — ⚠️ DO NOT use NEXT_PUBLIC_ prefix for DB URLs in production
NEXT_PUBLIC_DBURL=postgresql://postgres:postgres@localhost:5432/pixelplot
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pixelplot

# Clerk (get these from https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/main
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/main

# Redis (for Phase 6)
REDIS_URL=redis://localhost:6379
```

### Create the database

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE pixelplot;
\q
```

### Run the dev server

```bash
cd packages/fe
npm run dev
# Open http://localhost:3000
```

---

## Phase 1 — Auth & User Sync (Week 1)

**Goal:** When a user logs in via Clerk, sync their profile into our PostgreSQL `users` table.

### What you need to understand first

Read these files carefully before writing any code:

1. `app/api/services/db/schema.ts` — the `users` table definition
2. `app/api/services/db/db.ts` — how the DB connection works
3. `app/api/services/db/syncClerkUser.ts` — the sync helper (already written)
4. `proxy.ts` — Clerk middleware that protects routes

**Recommended reading:**
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk `currentUser()` reference](https://clerk.com/docs/references/nextjs/current-user)
- [Drizzle ORM SELECT](https://orm.drizzle.team/docs/select)
- [Drizzle ORM INSERT](https://orm.drizzle.team/docs/insert)

### Step 1.1 — Create the auth utility

Create `app/api/services/auth/getAuthedUser.ts`:

```ts
import { currentUser } from "@clerk/nextjs/server";
import { syncClerkUser } from "@/app/api/services/db/syncClerkUser";
import type { DbUser } from "@/app/api/services/db/syncClerkUser";

/**
 * Call this in any server component or API route.
 * Syncs the Clerk user → DB and returns the DB user row.
 * Throws if not logged in.
 */
export async function getAuthedUser(): Promise<DbUser> {
    const clerkUser = await currentUser();
    if (!clerkUser) {
        throw new Error("User is not authenticated");
    }
    return await syncClerkUser(clerkUser);
}
```

**How `currentUser()` works:**
- It's a server-side function from `@clerk/nextjs/server`
- It reads the session cookie and returns the full Clerk user object
- Returns `null` if nobody is logged in
- Can ONLY be used in server components or API routes (not `"use client"` components)

### Step 1.2 — Run the first migration

```bash
cd packages/fe

# Generate SQL migration files from your schema
npx drizzle-kit generate

# Review what was generated (look in app/api/services/db/migrations/)
# You should see CREATE TABLE users, CREATE TYPE enums, etc.

# Apply the migration
npx drizzle-kit migrate
```

> ⚠️ **Always review generated SQL before running migrate.** If you see DROP TABLE or DROP COLUMN, STOP and ask for help.

### Step 1.3 — Test the sync on the main page

Update `app/(authedRoutes)/main/page.tsx`:

```tsx
import { getAuthedUser } from "@/app/api/services/auth/getAuthedUser";

export default async function MainPage() {
    const user = await getAuthedUser();
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Welcome, {user.name ?? "User"}!</h1>
            <p className="text-muted-foreground">Email: {user.email}</p>
            <p className="text-xs text-muted-foreground">Internal ID: {user.id}</p>
        </div>
    );
}
```

### Step 1.4 — Verify

1. Run `npm run dev`, open the app, sign in
2. Navigate to `/main` — you should see your name and email
3. Check the database: `SELECT * FROM users;` — should have one row
4. Sign out, sign back in — the row should be updated, NOT duplicated

### ✅ Phase 1 Checklist

- [ ] `getAuthedUser.ts` created
- [ ] First migration generated and applied
- [ ] Main page shows user info after login
- [ ] Database has exactly 1 user row per account
- [ ] No errors in terminal

---

## Phase 2 — Database Schema & Project CRUD (Week 1-2)

**Goal:** Add all remaining tables, build project create/read/update/delete.

### Step 2.1 — Add all tables to schema.ts

Open `app/api/services/db/schema.ts`. It currently has only `users` + enums. Add every table from the architecture doc. **Add them in this exact order** (foreign key dependencies):

```
1. users          ✅ already exists
2. projects       → references users
3. projectSettings→ references projects
4. tasks          → references projects, users
5. taskSteps      → references tasks
6. projectFiles   → references projects
7. fileVersions   → references projectFiles, tasks
8. approvals      → references tasks, users
9. runs           → references tasks, projects
10. runLogs       → references runs
11. runtimeSessions → references projects, tasks
```

Here is the complete code to add after the existing `users` table. Copy this into `schema.ts`:

```ts
export const projects = pgTable(
    "projects",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        description: text("description"),
        templateType: text("template_type").notNull().default("react-node"),
        status: text("status").notNull().default("active"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        userIdx: index("projects_user_id_idx").on(table.userId),
    })
);

export const projectSettings = pgTable(
    "project_settings",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
        runtime: text("runtime").notNull().default("webcontainer"),
        installCmd: text("install_cmd").notNull().default("npm install"),
        startCmd: text("start_cmd").notNull().default("npm run dev"),
        buildCmd: text("build_cmd").notNull().default("npm run build"),
        templateName: text("template_name").notNull().default("react-node"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        projectIdx: index("project_settings_project_id_idx").on(table.projectId),
    })
);

export const tasks = pgTable(
    "tasks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        prompt: text("prompt").notNull(),
        status: taskStatusEnum("status").notNull().default("pending"),
        planJson: jsonb("plan_json"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        projectIdx: index("tasks_project_id_idx").on(table.projectId),
        userIdx: index("tasks_user_id_idx").on(table.userId),
    })
);

export const taskSteps = pgTable(
    "task_steps",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
        stepType: text("step_type").notNull(),
        title: text("title").notNull(),
        description: text("description"),
        status: text("status").notNull().default("pending"),
        orderIndex: integer("order_index").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        taskIdx: index("task_steps_task_id_idx").on(table.taskId),
    })
);

export const projectFiles = pgTable(
    "project_files",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
        path: text("path").notNull(),
        language: text("language"),
        contentHash: text("content_hash"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        projectPathIdx: index("project_files_project_path_idx").on(table.projectId, table.path),
    })
);

export const fileVersions = pgTable(
    "file_versions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectFileId: uuid("project_file_id").notNull().references(() => projectFiles.id, { onDelete: "cascade" }),
        taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
        versionNumber: integer("version_number").notNull().default(1),
        content: text("content").notNull(),
        diffText: text("diff_text"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        fileIdx: index("file_versions_project_file_id_idx").on(table.projectFileId),
    })
);

export const approvals = pgTable(
    "approvals",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        approved: boolean("approved").notNull().default(false),
        approvedAt: timestamp("approved_at", { withTimezone: true }),
        notes: text("notes"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        taskIdx: index("approvals_task_id_idx").on(table.taskId),
    })
);

export const runs = pgTable(
    "runs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
        projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
        status: runStatusEnum("status").notNull().default("pending"),
        previewUrl: text("preview_url"),
        startedAt: timestamp("started_at", { withTimezone: true }),
        finishedAt: timestamp("finished_at", { withTimezone: true }),
        exitCode: integer("exit_code"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        taskIdx: index("runs_task_id_idx").on(table.taskId),
        projectIdx: index("runs_project_id_idx").on(table.projectId),
    })
);

export const runLogs = pgTable(
    "run_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
        streamType: streamTypeEnum("stream_type").notNull(),
        message: text("message").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        runIdx: index("run_logs_run_id_idx").on(table.runId),
    })
);

export const runtimeSessions = pgTable(
    "runtime_sessions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
        taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
        sessionKey: text("session_key").notNull().unique(),
        previewUrl: text("preview_url"),
        status: text("status").notNull().default("active"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => ({
        projectIdx: index("runtime_sessions_project_id_idx").on(table.projectId),
    })
);
```

Then regenerate and apply the migration:

```bash
npx drizzle-kit generate
# Review the SQL
npx drizzle-kit migrate
```

Verify with: `npx drizzle-kit studio`

### Step 2.2 — Build Project CRUD API routes

**What is CRUD?** Create, Read, Update, Delete — the four basic database operations.

Create these files:

#### `app/api/projects/route.ts` — List & Create projects

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/app/api/services/auth/getAuthedUser";
import db from "@/app/api/services/db/db";
import { projects } from "@/app/api/services/db/schema";
import { eq } from "drizzle-orm";

// GET /api/projects → list all projects for the logged-in user
export async function GET() {
    try {
        const user = await getAuthedUser();
        const userProjects = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, user.id));
        return NextResponse.json(userProjects);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// POST /api/projects → create a new project
export async function POST(req: NextRequest) {
    try {
        const user = await getAuthedUser();
        const body = await req.json();
        const [project] = await db
            .insert(projects)
            .values({
                userId: user.id,
                name: body.name,
                description: body.description ?? null,
                templateType: body.templateType ?? "react-node",
            })
            .returning();
        return NextResponse.json(project, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
```

#### `app/api/projects/[id]/route.ts` — Get, Update, Delete a single project

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/app/api/services/auth/getAuthedUser";
import db from "@/app/api/services/db/db";
import { projects } from "@/app/api/services/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/projects/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getAuthedUser();
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)));
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(project);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// PATCH /api/projects/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getAuthedUser();
        const body = await req.json();
        const [updated] = await db
            .update(projects)
            .set({ ...body, updatedAt: new Date() })
            .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)))
            .returning();
        if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// DELETE /api/projects/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getAuthedUser();
        await db
            .delete(projects)
            .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)));
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
```

### Step 2.3 — Build the Dashboard UI

Update `app/(authedRoutes)/main/page.tsx` to show projects and a "New Project" button. This is a **server component** — it fetches data on the server before rendering HTML.

You'll need a **client component** for the "New Project" form/modal (anything with `onClick`, `useState`, etc. must be `"use client"`).

**Key Next.js concept:**
- **Server Component** (default) — runs on the server, can `await` DB queries directly
- **Client Component** (`"use client"` at top) — runs in the browser, can use hooks (useState, useEffect)

### ✅ Phase 2 Checklist

- [ ] All 11 tables added to schema.ts
- [ ] Migration generated, reviewed, and applied
- [ ] Drizzle Studio shows all tables
- [ ] `GET /api/projects` returns empty array
- [ ] `POST /api/projects` creates a project
- [ ] `GET /api/projects/:id` returns the project
- [ ] `PATCH /api/projects/:id` updates the project
- [ ] `DELETE /api/projects/:id` deletes the project
- [ ] Dashboard page lists projects

---

## Phase 3 — Task System & AI Integration (Week 2-3)

**Goal:** User types a prompt → AI returns a plan → user approves it.

### Step 3.1 — Set up the Python LangChain server

```bash
cd packages/ai

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn langchain langchain-openai pydantic

# Create the entry point
touch main.py
```

**What is LangChain?** A Python framework for building apps with LLMs (like GPT-4). It handles prompt templates, chains, and structured output.

**What is FastAPI?** A Python web framework for building APIs. Like Express.js but for Python.

#### `packages/ai/main.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import json, os

app = FastAPI()

class PlanRequest(BaseModel):
    prompt: str
    template_type: str = "react-node"

class PlanStep(BaseModel):
    step_type: str      # "create_file", "modify_file", "run_command"
    title: str
    description: str
    file_path: str | None = None
    content: str | None = None

class PlanResponse(BaseModel):
    steps: list[PlanStep]

@app.post("/api/plan")
async def generate_plan(req: PlanRequest):
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a code planning assistant. Given a user prompt, generate a step-by-step plan to build the requested feature. Return JSON with a 'steps' array."),
        ("user", "Template: {template_type}\n\nUser request: {prompt}\n\nReturn a JSON plan."),
    ])

    chain = prompt | llm
    result = await chain.ainvoke({
        "prompt": req.prompt,
        "template_type": req.template_type,
    })

    # Parse the AI response into structured steps
    plan_data = json.loads(result.content)
    return PlanResponse(**plan_data)

@app.get("/health")
def health():
    return {"status": "ok"}
```

Run it:
```bash
cd packages/ai
OPENAI_API_KEY=sk-xxxx uvicorn main:app --port 8000 --reload
# Test: curl http://localhost:8000/health
```

**Recommended reading:**
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [LangChain Quickstart](https://python.langchain.com/docs/get-started/quickstart)
- [LangChain Structured Output](https://python.langchain.com/docs/how_to/structured_output/)

### Step 3.2 — Task CRUD API routes in Next.js

Create `app/api/projects/[id]/tasks/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/app/api/services/auth/getAuthedUser";
import db from "@/app/api/services/db/db";
import { tasks } from "@/app/api/services/db/schema";
import { eq } from "drizzle-orm";

// POST /api/projects/:id/tasks → create a task with a prompt
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getAuthedUser();
    const { prompt } = await req.json();

    const [task] = await db.insert(tasks).values({
        projectId: params.id,
        userId: user.id,
        prompt,
        status: "pending",
    }).returning();

    // Call the Python AI server to get a plan
    const planRes = await fetch("http://localhost:8000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, template_type: "react-node" }),
    });
    const plan = await planRes.json();

    // Save the plan to the task
    const [updated] = await db.update(tasks)
        .set({ planJson: plan, status: "planned", updatedAt: new Date() })
        .where(eq(tasks.id, task.id))
        .returning();

    return NextResponse.json(updated, { status: 201 });
}

// GET /api/projects/:id/tasks → list tasks
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getAuthedUser();
    const result = await db.select().from(tasks).where(eq(tasks.projectId, params.id));
    return NextResponse.json(result);
}
```

### Step 3.3 — Approval API route

Create `app/api/tasks/[id]/approve/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/app/api/services/auth/getAuthedUser";
import db from "@/app/api/services/db/db";
import { tasks, approvals } from "@/app/api/services/db/schema";
import { eq } from "drizzle-orm";

// POST /api/tasks/:id/approve
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getAuthedUser();

    await db.insert(approvals).values({
        taskId: params.id,
        userId: user.id,
        approved: true,
        approvedAt: new Date(),
    });

    await db.update(tasks)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(tasks.id, params.id));

    return NextResponse.json({ success: true });
}
```

### Step 3.4 — Build the UI

The project page needs:
1. A **prompt input** — textarea where user types their request
2. A **plan display** — shows the AI-generated steps
3. An **approve button** — sends POST to approve endpoint
4. A **task history** sidebar

### ✅ Phase 3 Checklist

- [ ] Python AI server runs on port 8000
- [ ] `POST /api/projects/:id/tasks` creates a task and saves a plan
- [ ] `GET /api/projects/:id/tasks` lists tasks
- [ ] `POST /api/tasks/:id/approve` records approval
- [ ] UI: prompt input works and shows the plan
- [ ] UI: approve button changes task status

---

## Phase 4 — WebContainer + Preview (Week 3-4)

**Goal:** After approval, generated files run in a browser sandbox with live preview.

### What is a WebContainer?

A WebContainer runs Node.js **inside the browser**. No Docker needed. It provides:
- A virtual file system
- `npm install`
- `npm run dev`
- A dev server with a preview URL

**Recommended reading:** [WebContainers Quickstart](https://webcontainers.io/guides/quickstart)

### Step 4.1 — Install WebContainer API

```bash
cd packages/fe
npm install @webcontainer/api
```

### Step 4.2 — Create a WebContainer hook

Create `app/(authedRoutes)/project/[id]/hooks/useWebContainer.ts`:

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

            // Listen for server-ready event (when dev server starts)
            wc.on("server-ready", (port, url) => {
                setPreviewUrl(url);
            });
        });
    }, []);

    const writeFiles = async (files: Record<string, string>) => {
        if (!instance) return;
        for (const [path, content] of Object.entries(files)) {
            const parts = path.split("/");
            if (parts.length > 1) {
                const dir = parts.slice(0, -1).join("/");
                await instance.fs.mkdir(dir, { recursive: true });
            }
            await instance.fs.writeFile(path, content);
        }
    };

    const runCommand = async (cmd: string, args: string[] = []) => {
        if (!instance) return;
        const process = await instance.spawn(cmd, args);
        process.output.pipeTo(new WritableStream({
            write(data) { setLogs((prev) => [...prev, data]); },
        }));
        return process;
    };

    return { instance, previewUrl, logs, writeFiles, runCommand };
}
```

### Step 4.3 — Build the project workspace page

Create `app/(authedRoutes)/project/[id]/page.tsx` with:
- A **file tree** panel (left)
- A **code editor** area (center) — placeholder for now, Monaco comes in Phase 5
- A **preview iframe** (right) — `<iframe src={previewUrl} />`
- A **logs panel** (bottom)

### Step 4.4 — Wire the flow

After approval, the frontend should:
1. Get the plan (files to create) from the task's `planJson`
2. Call `writeFiles()` to write them into the WebContainer
3. Call `runCommand("npm", ["install"])`
4. Call `runCommand("npm", ["run", "dev"])`
5. Wait for `previewUrl` to appear
6. Show the preview in an iframe

### ✅ Phase 4 Checklist

- [ ] WebContainer boots successfully in the browser
- [ ] Files can be written to the WebContainer filesystem
- [ ] `npm install` runs inside WebContainer
- [ ] `npm run dev` starts a dev server
- [ ] Preview iframe shows the running app
- [ ] Logs appear in the logs panel

---

## Phase 5 — Editor, Files & Versioning (Week 4-5)

**Goal:** Monaco code editor, save edits, file versioning.

### Step 5.1 — Install Monaco Editor

```bash
cd packages/fe
npm install @monaco-editor/react
```

**Recommended reading:** [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)

### Step 5.2 — Create the editor component

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

### Step 5.3 — File persistence API

Create `app/api/projects/[id]/files/route.ts` for saving files to the database (so they persist across sessions, not just in WebContainer memory).

### Step 5.4 — File versioning

Every time a file is saved:
1. Update the `projectFiles` row (update `contentHash`, `updatedAt`)
2. Insert a new `fileVersions` row with the new content
3. Increment `versionNumber`

This gives you full version history — the user can see what changed and revert if needed.

### ✅ Phase 5 Checklist

- [ ] Monaco editor renders in the workspace
- [ ] Selecting a file in the tree loads it in the editor
- [ ] Editing and saving updates the WebContainer AND the database
- [ ] File versions are tracked in `file_versions` table
- [ ] Live preview updates when code changes

---

## Phase 6 — Polish, Queues & Production (Week 5-6)

**Goal:** Background jobs, error recovery, and production readiness.

### Step 6.1 — Redis + BullMQ setup

```bash
cd packages/fe
npm install bullmq ioredis
```

Move the AI plan call from a synchronous API route to a background job:

**Why?** AI calls can take 10-30 seconds. If it's synchronous, the browser connection might time out. With BullMQ, the job runs in the background and the frontend polls for progress.

**Recommended reading:**
- [BullMQ Guide](https://docs.bullmq.io/guide/jobs)
- [Redis Quickstart](https://redis.io/docs/getting-started/)

### Step 6.2 — Queues to create

| Queue | Purpose |
|---|---|
| `planQueue` | Send prompt to AI, get plan back |
| `repairQueue` | If build fails, ask AI to fix it |
| `saveQueue` | Persist file changes to DB in background |

### Step 6.3 — Error recovery flow

When a WebContainer build fails:
1. Capture the error logs from stdout/stderr
2. Send them to the `repairQueue`
3. AI analyzes the error and suggests fixes
4. Apply fixes to the files
5. Rerun the build

### Step 6.4 — Production preparation

- [ ] Fix the `NEXT_PUBLIC_DATABASE_URL` → rename to `DATABASE_URL`
- [ ] Add proper error boundaries in React
- [ ] Add loading states and skeletons
- [ ] Set up Clerk webhooks for reliable user sync
- [ ] Add rate limiting on API routes
- [ ] Set up proper logging

### ✅ Phase 6 Checklist

- [ ] Redis is connected
- [ ] Plan generation runs as a background job
- [ ] Frontend polls for job completion
- [ ] Build failures trigger auto-repair
- [ ] All env vars are properly secured (no `NEXT_PUBLIC_` for secrets)

---

## Full API Routes Summary

| Method | Route | Phase | Purpose |
|---|---|---|---|
| GET | `/api/health` | ✅ | Health check |
| GET | `/api/projects` | 2 | List user's projects |
| POST | `/api/projects` | 2 | Create project |
| GET | `/api/projects/:id` | 2 | Get single project |
| PATCH | `/api/projects/:id` | 2 | Update project |
| DELETE | `/api/projects/:id` | 2 | Delete project |
| POST | `/api/projects/:id/tasks` | 3 | Create task + generate plan |
| GET | `/api/projects/:id/tasks` | 3 | List tasks |
| GET | `/api/tasks/:id` | 3 | Get single task |
| POST | `/api/tasks/:id/approve` | 3 | Approve a plan |
| GET | `/api/projects/:id/files` | 5 | List project files |
| PUT | `/api/projects/:id/files/*path` | 5 | Save a file |
| POST | `/api/projects/:id/runtime/start` | 4 | Start WebContainer |
| GET | `/api/projects/:id/runtime/logs` | 4 | Get runtime logs |

---

## Folder Structure (Target)

```
pixelplot/
├── packages/
│   ├── fe/                          # Next.js app
│   │   ├── app/
│   │   │   ├── (authedRoutes)/      # Protected pages
│   │   │   │   ├── main/page.tsx    # Dashboard
│   │   │   │   ├── project/[id]/    # Project workspace
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── hooks/
│   │   │   │   └── layout.tsx
│   │   │   ├── api/
│   │   │   │   ├── projects/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       ├── tasks/route.ts
│   │   │   │   │       └── files/route.ts
│   │   │   │   ├── tasks/[id]/
│   │   │   │   │   └── approve/route.ts
│   │   │   │   └── services/
│   │   │   │       ├── auth/getAuthedUser.ts
│   │   │   │       ├── db/
│   │   │   │       │   ├── db.ts
│   │   │   │       │   ├── schema.ts
│   │   │   │       │   └── syncClerkUser.ts
│   │   │   │       └── redis/
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── page.tsx             # Landing page
│   │   ├── components/ui/
│   │   └── proxy.ts                 # Clerk middleware
│   └── ai/                          # Python LangChain server
│       ├── main.py
│       ├── requirements.txt
│       └── venv/
└── package.json
```

---

## Glossary

| Term | What it means |
|---|---|
| **API Route** | A server-side endpoint in Next.js (`app/api/*/route.ts`) |
| **Server Component** | A React component that runs on the server (default in Next.js App Router) |
| **Client Component** | A React component that runs in the browser (`"use client"` at top) |
| **Drizzle ORM** | A TypeScript library for writing type-safe SQL queries |
| **Migration** | SQL scripts that change your database structure (add/remove tables/columns) |
| **Clerk** | A third-party authentication service |
| **WebContainer** | A Node.js runtime that runs inside the browser (by StackBlitz) |
| **BullMQ** | A Node.js library for background job queues using Redis |
| **FastAPI** | A Python web framework for building APIs |
| **LangChain** | A Python framework for building AI-powered applications |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations |
| **UUID** | A unique identifier (like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`) |
| **Foreign Key** | A column that references another table's primary key |
| **Upsert** | Insert if new, update if exists |

---

## Reference Docs

### Next.js
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

### Clerk
- [Clerk + Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [`currentUser()` reference](https://clerk.com/docs/references/nextjs/current-user)
- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)

### Drizzle ORM
- [Getting Started](https://orm.drizzle.team/docs/get-started/postgresql-new)
- [Schema Declaration](https://orm.drizzle.team/docs/sql-schema-declaration)
- [SELECT / INSERT / UPDATE / DELETE](https://orm.drizzle.team/docs/select)
- [Migrations](https://orm.drizzle.team/docs/migrations)

### Python
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [LangChain Quickstart](https://python.langchain.com/docs/get-started/quickstart)
- [Python venv](https://docs.python.org/3/library/venv.html)

### WebContainers
- [WebContainers Quickstart](https://webcontainers.io/guides/quickstart)
- [WebContainers API Reference](https://webcontainers.io/api)

### Monaco Editor
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)

### Redis + BullMQ
- [Redis Quickstart](https://redis.io/docs/getting-started/)
- [BullMQ Guide](https://docs.bullmq.io/guide/jobs)

---

## Weekly Timeline & TODO

### Week 1 — Foundation
- [ ] Read and understand all existing code
- [ ] Create `getAuthedUser.ts`
- [ ] Run first migration (users table)
- [ ] Test Clerk → DB sync
- [ ] Add all tables to schema.ts
- [ ] Run full migration
- [ ] Build Project CRUD API routes
- [ ] Build Dashboard UI (project list + create)

### Week 2 — AI Integration
- [ ] Set up Python venv and install deps
- [ ] Build FastAPI `/api/plan` endpoint
- [ ] Build Task CRUD API routes in Next.js
- [ ] Build Approval API route
- [ ] Build project page UI (prompt input, plan display, approve button)

### Week 3 — Sandbox Runtime
- [ ] Install `@webcontainer/api`
- [ ] Build `useWebContainer` hook
- [ ] Build project workspace layout (file tree, editor area, preview, logs)
- [ ] Wire: approval → file write → npm install → dev server → preview

### Week 4 — Code Editor
- [ ] Install and configure Monaco Editor
- [ ] Build file tree component
- [ ] Build file save API (persist to DB)
- [ ] Implement file versioning
- [ ] Live edit → WebContainer sync → preview refresh

### Week 5 — Background Jobs
- [ ] Install and configure Redis + BullMQ
- [ ] Move plan generation to background job
- [ ] Add progress polling in frontend
- [ ] Build error recovery flow (repairQueue)

### Week 6 — Polish
- [ ] Loading states and skeletons on all pages
- [ ] Error boundaries and error UI
- [ ] Clerk webhook for reliable user sync
- [ ] Security audit (fix NEXT_PUBLIC_DATABASE_URL, add rate limiting)
- [ ] Final testing of full user flow end-to-end
