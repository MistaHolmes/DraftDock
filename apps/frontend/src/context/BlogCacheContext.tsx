import React, { createContext, useCallback, useContext, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardBlog {
  id: string;
  title: string;
  summary: string;
  content?: string;
  author: string;
  authorId: string;
  published: string;
  isPublished: boolean;
  tags?: string[];
  updatedAt?: Date;
}

interface BlogDetail {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
  author: { email: string };
}

interface UserBlog {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogCacheContextValue {
  // Dashboard blogs
  dashboardBlogs: DashboardBlog[] | null;
  setDashboardBlogs: (blogs: DashboardBlog[]) => void;

  // Individual blog detail cache
  getBlogDetail: (id: string) => BlogDetail | undefined;
  setBlogDetail: (id: string, blog: BlogDetail) => void;

  // User's own blogs (Profile page)
  userBlogs: UserBlog[] | null;
  setUserBlogs: (blogs: UserBlog[]) => void;

  // Invalidation — clears all caches so next visit re-fetches
  invalidate: () => void;
  // Targeted invalidation
  invalidateDashboard: () => void;
  invalidateUserBlogs: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const BlogCacheContext = createContext<BlogCacheContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export const BlogCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardBlogs, _setDashboardBlogs] = useState<DashboardBlog[] | null>(null);
  const [userBlogs, _setUserBlogs] = useState<UserBlog[] | null>(null);
  const blogDetailsRef = useRef<Map<string, BlogDetail>>(new Map());

  const setDashboardBlogs = useCallback((blogs: DashboardBlog[]) => {
    _setDashboardBlogs(blogs);
  }, []);

  const setUserBlogs = useCallback((blogs: UserBlog[]) => {
    _setUserBlogs(blogs);
  }, []);

  const getBlogDetail = useCallback((id: string) => {
    return blogDetailsRef.current.get(id);
  }, []);

  const setBlogDetail = useCallback((id: string, blog: BlogDetail) => {
    blogDetailsRef.current.set(id, blog);
  }, []);

  const invalidate = useCallback(() => {
    _setDashboardBlogs(null);
    _setUserBlogs(null);
    blogDetailsRef.current.clear();
  }, []);

  const invalidateDashboard = useCallback(() => {
    _setDashboardBlogs(null);
  }, []);

  const invalidateUserBlogs = useCallback(() => {
    _setUserBlogs(null);
  }, []);

  return (
    <BlogCacheContext.Provider
      value={{
        dashboardBlogs,
        setDashboardBlogs,
        getBlogDetail,
        setBlogDetail,
        userBlogs,
        setUserBlogs,
        invalidate,
        invalidateDashboard,
        invalidateUserBlogs,
      }}
    >
      {children}
    </BlogCacheContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export const useBlogCache = (): BlogCacheContextValue => {
  const ctx = useContext(BlogCacheContext);
  if (!ctx) throw new Error("useBlogCache must be used within a BlogCacheProvider");
  return ctx;
};
