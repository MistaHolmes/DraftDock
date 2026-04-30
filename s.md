# DraftDock

> *The blogging platform that actually works for writers.*

---

## The Gap in the Market

Look at what exists today:

**Medium** is a great reading experience — but writers are tenants, not owners. Your audience belongs to Medium. Your content is buried behind their paywall. You get a revenue cut they decide. You write in their editor, grow their SEO, build their brand. And if they change the algorithm — which they do, often — your reach vanishes overnight.

**Substack** fixed the ownership problem but created a new one. It's a newsletter tool cosplaying as a blogging platform. No discovery engine. No collaboration. No editor worth using. Your growth is entirely on you — and the product stops at "send email."

**Ghost** is clean, but it's infrastructure, not a community. You're running a solo publication. There's no feed, no social graph, no reason for a reader to come back unless they already subscribed.

**Notion / Hashnode** are developer-first or productivity-first. They're not built around the act of writing as a craft, or around readers as first-class citizens.

**The pattern:** every existing platform optimizes for one thing — and leaves writers to cobble together the rest with third-party tools.

---

## What DraftDock Is

DraftDock is a **full-stack blogging platform** that treats writing, reading, discovery, and collaboration as a single unified experience — not four separate products.

It's built for the writer who wants to own their voice, grow a real audience, work with collaborators, and not compromise on the quality of their tools.

---

## The Demo

### 1. Landing
The first thing you see communicates the philosophy immediately — editorial, premium, writer-first. Not a SaaS dashboard. Not a social feed. A platform that respects the craft.

### 2. Explore — Discovery that works
Medium has a feed, but it's opaque. You don't know why you're seeing what you're seeing.

DraftDock's Explore page is transparent and intentional — filter by topic tags, follow specific authors, surface trending posts in communities you care about. Every card shows you exactly what the post is and who wrote it. Readers find great writing. Writers get found.

### 3. Write — The editor is the product
Most platforms treat the editor as an afterthought. We didn't.

The DraftDock editor is distraction-free, version-controlled, and AI-assisted — powered by **Claude Haiku**. Mid-draft, you can ask it to suggest titles, generate a section outline, rewrite a paragraph in a different tone, or expand a single idea into three. It's not a chatbot you switch to — it's integrated directly into the writing flow.

Drafts auto-save with full version history. You can schedule posts. You can group posts into a **Series** — so a 6-part deep-dive reads like a book, not six orphaned articles.

### 4. Collab — Co-authoring without the chaos
Substack has no collaboration model. Medium lets you add a co-author as an afterthought.

DraftDock has a real co-authoring system — invite contributors to a post, assign authorship, write while messaging each other in-context. The conversation lives next to the draft, not in a separate Slack thread three days later.

### 5. Everything Else
The platform is complete in ways the competition isn't:

| Feature | Why it matters |
|---|---|
| **Text Highlights & Annotations** | Readers mark the passages that hit. Authors see exactly what resonated — better than any view count. |
| **Gamification (XP + Achievements)** | Writing consistently is hard. Levels, streaks, and badges make shipping a habit, not a chore. |
| **Tipping** | Readers who love a post can pay directly. No subscription required. No platform cut negotiation. |
| **Leaderboard** | Surfaces the best writers on the platform. Gives emerging writers a goal to chase. |
| **Analytics** | Per-post read-through rates, traffic sources, and engagement depth — not just vanity view counts. |
| **Real-Time Notifications** | Likes, follows, comments — live. The social layer is alive, not batched into a daily digest. |
| **Premium Content** | Writers can gate posts for paying subscribers with a single toggle. |
| **Admin Panel** | Full moderation system for content and users — the platform can scale responsibly. |

---

## Tech Stack

Built from scratch as a **Turborepo monorepo**, production-deployed:

- **Frontend:** React + Vite, TailwindCSS, Framer Motion — fast, beautiful, dark-mode native
- **Backend:** Node.js + Express + TypeScript, Prisma ORM, PostgreSQL
- **Auth:** Clerk — JWT-based, supports Google/GitHub/email
- **AI Layer:** Anthropic Claude Haiku, with a provider-abstracted service (swappable to Gemini or OpenAI)
- **Realtime:** Socket.io — notifications, messaging, and live co-author presence
- **Infra:** Dockerized, deployed on AWS EC2 (backend) + GCP Cloud Run (frontend), Ansible-automated

---

## The Honest Summary

Medium owns your audience. Substack is just email. Ghost is a solo publication. None of them let you write *with* someone, discover *within* a community, and own the whole experience under one roof.

DraftDock does all three — and ships it as a single, coherent product.

---

*Built at C.V. Raman Global University · 2026*
