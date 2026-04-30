# MVP Architecture for AI Code-Generation Platform (Next.js API + Drizzle + WebContainers)

This document updates the architecture so the **Next.js app handles both frontend and backend** using API routes / server actions, and the AI service stays as a separate Python LangChain server.

The goal is still the same:

- user signs up / logs in
- user creates a project
- user types a prompt
- AI generates a plan
- user approves the plan
- files are generated
- app runs in a sandbox
- preview is shown
- user edits code
- history is saved

---

## 1) Main architecture

```text
Next.js App
  ├── Frontend UI (React)
  ├── Backend API routes / server actions
  ├── Drizzle ORM
  ├── PostgreSQL
  ├── Redis + BullMQ
  └── WebContainer runtime in browser

Python LangChain Server
  └── AI planning + repair reasoning
```

### What changed
- **Express is removed**
- **Next.js now handles the backend**
- **Drizzle ORM is used for database access**
- **WebContainers are used for the sandbox/runtime in the browser**
- **Python LangChain server remains separate**

---

## 2) Why this is better for your MVP

This is cleaner for a small team or solo builder because:

- one main app instead of two Node backends
- less deployment complexity
- fewer service-to-service hops
- easier auth and project CRUD
- easier to keep UI and backend logic in one codebase

The AI is still separated so the planning logic does not mix with product logic.

---

## 3) Service responsibilities

## A. Next.js app

The Next.js app does **everything except AI reasoning**.

### Frontend responsibilities
- login/signup UI
- dashboard
- project page
- file tree
- Monaco editor
- preview iframe
- logs panel
- task history
- approval modal

### Backend responsibilities
- auth
- project CRUD
- task CRUD
- file persistence
- approvals
- run history
- queue jobs
- WebContainer session metadata

---

## B. Python LangChain server

This service does the AI work.

Responsibilities:
- read prompt
- inspect project context
- generate plan
- produce structured JSON
- suggest file changes
- suggest recovery steps when build fails

Important rule:

**The AI should return instructions, not directly own your DB or user auth.**

---

## C. WebContainer runtime

WebContainers run the generated app in the browser.

Responsibilities:
- file system in browser
- install dependencies
- start dev server
- show preview
- rerun on save
- terminal output
- app runtime state

This removes the need for a Docker sandbox worker in MVP.

---

## D. Redis + BullMQ

Use this for background jobs.

Responsibilities:
- planning jobs
- AI task queue
- retry logic
- progress tracking
- background save jobs
- build repair jobs

---

## 4) User flow

```text
1. User logs in
2. User creates a project
3. User enters a prompt
4. Next.js backend creates a task in PostgreSQL
5. Next.js sends plan job to BullMQ
6. Python LangChain server returns a plan
7. Next.js saves the plan
8. User approves the plan
9. Frontend creates a WebContainer session
10. Generated files are written into the WebContainer filesystem
11. npm install runs
12. npm run dev runs
13. Preview becomes available
14. User edits files in Monaco
15. Save updates the WebContainer
16. Preview reruns automatically
17. Versions and task history are saved in PostgreSQL
```

---

## 5) Database design with Drizzle

Use **PostgreSQL** as the source of truth and **Drizzle ORM** for schema + queries.

### Core tables
- users
- projects
- tasks
- task_steps
- project_files
- file_versions
- approvals
- runs
- run_logs
- runtime_sessions
- project_settings

---

## 6) Drizzle schema

Below is a practical MVP schema for your app.

> This is written in a Drizzle-style TypeScript schema setup.

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "planned",
  "approved",
  "running",
  "failed",
  "completed",
]);

export const runStatusEnum = pgEnum("run_status", [
  "pending",
  "running",
  "failed",
  "completed",
]);

export const streamTypeEnum = pgEnum("stream_type", [
  "stdout",
  "stderr",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
```

---

## 7) Redis usage

Redis is still useful even without Express.

Use it for:

- BullMQ jobs
- temporary task progress
- rate limiting
- preview state
- queue retries
- short-lived session data

Good keys:

- `task:{taskId}:progress`
- `task:{taskId}:plan`
- `project:{projectId}:runtime_session`
- `run:{runId}:status`

---

## 8) BullMQ queues

Recommended queues:

- `planQueue`
- `repairQueue`
- `saveQueue`
- `historyQueue`

### Example flow
- Next.js backend adds a job to `planQueue`
- Python worker consumes it and returns a plan
- user approves
- Next.js saves file versions
- Next.js stores runtime session metadata

---

## 9) API routes in Next.js

Use route handlers or server actions.

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Projects
- POST /api/projects
- GET /api/projects
- GET /api/projects/:id
- PATCH /api/projects/:id
- DELETE /api/projects/:id

### Tasks
- POST /api/projects/:id/tasks
- GET /api/projects/:id/tasks
- GET /api/tasks/:id
- POST /api/tasks/:id/approve

### Files
- GET /api/projects/:id/files
- GET /api/projects/:id/files/*path
- PUT /api/projects/:id/files/*path

### Runtime
- POST /api/projects/:id/runtime/start
- POST /api/projects/:id/runtime/restart
- GET /api/projects/:id/runtime/status
- GET /api/projects/:id/runtime/logs

### Preview
- GET /api/projects/:id/preview

---

## 10) Folder structure

```text
apps/
  web/                # Next.js frontend + API
  ai/                 # Python LangChain server

packages/
  db/                 # Drizzle schema and DB helpers
  shared/             # shared types, schemas, utils
  ui/                 # reusable UI components
  webcontainer/       # WebContainer helpers
```

---

## 11) Recommended implementation order

### Week 1
- Next.js UI shell
- auth
- Drizzle schema
- project CRUD

### Week 2
- task creation
- BullMQ queues
- LangChain plan endpoint
- approval flow

### Week 3
- WebContainer integration
- file writing
- npm install
- npm run dev
- preview iframe

### Week 4
- Monaco editor
- save edits
- rerun support
- logs
- task history
- versions

---

## 12) Final architecture

```text
Next.js UI + Next.js API
   |
   +--> PostgreSQL via Drizzle
   +--> Redis + BullMQ
   +--> Python LangChain server
   +--> WebContainer runtime in browser
```

### Summary of roles
- Next.js = UI + backend routes
- Drizzle = DB access layer
- PostgreSQL = permanent storage
- Redis + BullMQ = async jobs
- Python LangChain = planning and AI reasoning
- WebContainers = browser-based code execution and preview
