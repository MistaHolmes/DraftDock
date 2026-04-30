# DraftDock Admin Panel (Next.js)

A fully self-contained Next.js admin panel for DraftDock. All backend logic runs via Next.js API Route Handlers — no Express, no separate backend server.

## 🚀 What's New

This is a complete migration from the old `apps/admin` (static HTML + Express) to a modern Next.js application:

- ✅ **100% Next.js** — No Express dependencies
- ✅ **API Routes** — All backend logic in `app/api/admin/*`
- ✅ **React Components** — Modern UI with Tailwind v4
- ✅ **Prisma ORM** — Direct PostgreSQL connection to Neon
- ✅ **JWT Authentication** — Secure admin login
- ✅ **Material Design 3** — Beautiful, consistent UI

## 📁 Project Structure

```
apps/admin-next/
├── app/
│   ├── (admin)/              # Protected admin pages
│   │   ├── dashboard/        # Dashboard with stats & charts
│   │   ├── content/          # Content management
│   │   ├── users/            # User management
│   │   └── analytics/        # Analytics & insights
│   ├── api/admin/            # Backend API routes
│   │   ├── auth/             # Authentication
│   │   ├── stats/            # Dashboard statistics
│   │   ├── content/          # Blog management
│   │   ├── users/            # User management
│   │   └── analytics/        # Analytics data
│   ├── login/                # Login page
│   └── layout.tsx            # Root layout
├── components/               # Shared UI components
│   ├── Sidebar.tsx
│   ├── TopNav.tsx
│   ├── MobileNav.tsx
│   └── Toast.tsx
├── lib/                      # Utilities & helpers
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # JWT verification
│   ├── auth-context.tsx      # React auth context
│   ├── api.ts                # Client-side fetch helper
│   └── utils.ts              # Formatting utilities
└── prisma/
    └── schema.prisma         # Database schema
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon)

### Environment Variables

Create a `.env.local` file:

```env
# Database connection for Prisma
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
# Direct (non-pooler) URL for migrations
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require
# JWT Secret
ADMIN_JWT_SECRET=your_secret_key_here
```

### Install Dependencies

```bash
npm install
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 🔐 Authentication

Default admin credentials:
- **Username:** `admin`
- **Password:** `admin`

> ⚠️ Change these in production! Update `app/api/admin/auth/login/route.ts`

## 📊 Features

### Dashboard
- Real-time platform statistics
- Growth charts (12-day view)
- Trending topics
- Top authors leaderboard
- Recent activity feed

### Content Management
- Featured posts section
- Searchable blog table
- Filter by status (published/draft/scheduled)
- Sort by date, views, title
- Toggle featured status
- Delete blogs

### User Management
- User cards with stats
- Role management (Admin/Author/Contributor)
- Verification toggle
- Export to CSV
- Access matrix documentation

### Analytics
- Live platform metrics
- Views over time chart
- Content distribution (donut chart)
- Top authors performance
- Engagement rates
- Time range filters (7D/30D/12M)

## 🎨 Design System

Built with Material Design 3 color palette using Tailwind v4's `@theme` directive:

- **Primary:** Indigo/Purple (`#702ae1`)
- **Secondary:** Purple (`#7742a6`)
- **Tertiary:** Rose (`#9e3657`)
- **Fonts:** Plus Jakarta Sans (headlines), Manrope (body)
- **Icons:** Material Symbols Outlined

## 🔧 API Routes

All routes require JWT authentication (except `/api/admin/auth/login`).

### Authentication
- `POST /api/admin/auth/login` — Login with username/password

### Stats
- `GET /api/admin/stats` — Dashboard statistics

### Content
- `GET /api/admin/content` — List blogs (paginated, filterable)
- `GET /api/admin/content/featured` — Get featured posts
- `PATCH /api/admin/content/[id]/featured` — Toggle featured status
- `DELETE /api/admin/content/[id]` — Delete blog

### Users
- `GET /api/admin/users` — List users (paginated, searchable)
- `GET /api/admin/users/[id]` — Get user details
- `PATCH /api/admin/users/[id]/role` — Change user role
- `PATCH /api/admin/users/[id]/verify` — Toggle verification

### Analytics
- `GET /api/admin/analytics/overview` — Overview stats
- `GET /api/admin/analytics/views-over-time` — Chart data
- `GET /api/admin/analytics/top-tags` — Tag distribution
- `GET /api/admin/analytics/top-authors` — Author leaderboard
- `GET /api/admin/analytics/recent-activity` — Recent events

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Docker

```bash
docker build -t admin-next .
docker run -p 3000:3000 admin-next
```

## 📝 Migration Notes

### What Was Replaced

| Old (Express + HTML) | New (Next.js) |
|---------------------|---------------|
| Express server | Next.js dev/prod server |
| Express routes | API Route Handlers |
| Express middleware | `lib/auth.ts` helper |
| Static HTML | React components |
| Vanilla JS | React hooks + context |
| CDN Tailwind | Tailwind v4 with `@theme` |

### Key Differences

- **No Express** — Everything runs in Next.js
- **No separate backend** — API routes are co-located with frontend
- **Type-safe** — Full TypeScript support
- **Server Components** — Better performance
- **Built-in routing** — File-based routing

## 🐛 Troubleshooting

### Prisma Connection Issues

If you see `P2024` timeout errors:
- Check `DATABASE_URL` uses the pooler URL
- Check `DIRECT_URL` uses the direct URL
- Verify Neon database is accessible

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Rebuild
npm run build
```

### Authentication Issues

- Check `ADMIN_JWT_SECRET` is set
- Verify token is stored in localStorage
- Check browser console for errors

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Material Design 3](https://m3.material.io/)

## 📄 License

MIT
