import React, { lazy, Suspense } from "react";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/Landing";
import { BlogForm } from "./pages/BlogForm";
import BlogView from "./pages/BlogView";
import HomeRedirector from "./components/HomeRedirector";
import { MyStory } from "./components/MyStory";
import { Contact } from "./components/Contact";

// New revamped components
import {
  NewAppShell,
  NewProfilePage,
  NewDashboardPage,
  NewExplorePage,
  NewBookmarksPage,
  NewHistoryPage,
} from "./components/new-components";

// Lazy-loaded pages (kept for non-revamped routes)
const TagBlogs = lazy(() => import("./pages/TagBlogs"));
const AuthorProfile = lazy(() => import("./pages/AuthorProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const SeriesPage = lazy(() => import("./pages/SeriesPage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Messages = lazy(() => import("./pages/Messages"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUserDetails = lazy(() => import("./pages/admin/UserDetails"));
const CollaboratePage = lazy(() => import("./pages/CollaboratePage"));
const CollaborativeBlogForm = lazy(() => import("./pages/CollaborativeBlogForm").then(m => ({ default: m.CollaborativeBlogForm })));
const CollabJoinPage = lazy(() => import("./pages/CollaborativeBlogForm").then(m => ({ default: m.CollabJoinPage })));
const PricingPage = lazy(() => import("./pages/Pricing"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// AppShell import removed (unused)
import { BlogCacheProvider } from "./context/BlogCacheContext";
import { PageCacheProvider } from "./context/PageCacheContext";
import { LikeProvider } from "./context/LikeContext";
import { BookmarkProvider } from "./context/BookmarkContext";

const App: React.FC = () => {
  return (
    <PageCacheProvider>
    <BlogCacheProvider>
    <LikeProvider>
    <BookmarkProvider>
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirector />} />
          {/* Public landing (allow visiting even when signed in via header click) */}
          <Route path="/landing" element={<LandingPage />} />

          {/* Revamped pages with NewAppShell */}
          {/* Legacy route: redirect to revamped explore page */}
          <Route path="/blogs" element={<RequireAuth><Navigate to="/explore" replace /></RequireAuth>} />
          <Route path="/explore" element={<NewAppShell activePage="explore"><NewExplorePage /></NewAppShell>} />
          <Route path="/bookmarks" element={<RequireAuth><NewAppShell activePage="bookmarks"><NewBookmarksPage /></NewAppShell></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><NewAppShell activePage="dashboard"><NewDashboardPage /></NewAppShell></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><NewAppShell activePage="history"><NewHistoryPage /></NewAppShell></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><NewAppShell activePage="profile" hideRightPanel><NewProfilePage /></NewAppShell></RequireAuth>} />

          {/* Other pages using NewAppShell */}
          {/* Search page removed; searches now land on /explore */}
          <Route path="/leaderboard" element={<NewAppShell activePage="leaderboard"><Leaderboard /></NewAppShell>} />
          <Route path="/messages" element={<RequireAuth><NewAppShell activePage="messages" hideRightPanel hideFooter><Messages /></NewAppShell></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><NewAppShell activePage="settings"><Settings /></NewAppShell></RequireAuth>} />
          {/* Drafts moved into profile page; redirect legacy /drafts to profile with tab */}
          <Route path="/drafts" element={<RequireAuth><Navigate to="/profile?tab=drafts" replace /></RequireAuth>} />

          {/* Workflow Routes */}
          <Route path="/create-blog" element={<RequireAuth><BlogForm /></RequireAuth>} />
          <Route path="/edit-blog/:blogId" element={<RequireAuth><BlogForm /></RequireAuth>} />

          {/* Collaboration Routes */}
          <Route path="/collaborate" element={<RequireAuth><CollaboratePage /></RequireAuth>} />
          <Route path="/collab/:blogId" element={<RequireAuth><CollaborativeBlogForm /></RequireAuth>} />
          <Route path="/collab/join/:token" element={<RequireAuth><CollabJoinPage /></RequireAuth>} />

          {/* Public Views */}
          <Route path="/blog/:blogId" element={<BlogView />} />
          <Route path="/author/:userId" element={<NewAppShell hideRightPanel><AuthorProfile /></NewAppShell>} />
          <Route path="/tags/:tagName" element={<NewAppShell activePage="explore"><TagBlogs /></NewAppShell>} />
          <Route path="/series/:id" element={<NewAppShell activePage="explore"><SeriesPage /></NewAppShell>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/users/:id" element={<RequireAdmin><AdminUserDetails /></RequireAdmin>} />

          {/* static */}
          <Route path="/my-story" element={<MyStory />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<NewAppShell hideRightPanel><PricingPage /></NewAppShell>} />
        </Routes>
      </Suspense>
    </Router>
    </BookmarkProvider>
    </LikeProvider>
    </BlogCacheProvider>
    </PageCacheProvider>
  );
};

export default App;
