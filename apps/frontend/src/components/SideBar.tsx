import React, { useState, useEffect, useRef } from "react";
import { LayoutGrid, FileDiff, Eraser, Menu, X } from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

interface Blog {
  id: string;
  title: string;
  summary: string;
  authorId: string;
  updatedAt: Date;
  published: string;
  tags?: string[];
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

interface FolderItemProps {
  href: string;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, active }) => (
  <a
    href={href}
    className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg ${active ? "bg-gray-100" : ""}`}
  >
    {icon}
    <span>{children}</span>
  </a>
);

const FolderItem: React.FC<FolderItemProps> = ({ href, children }) => (
  <a href={href} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
    <span>{children}</span>
  </a>
);

const cachedUserBlogs: Record<string, Blog[]> = {};

const Sidebar: React.FC<{ activePage?: string }> = ({ activePage = "dock" }) => {
  const { user, isLoaded } = useUser();
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const hasFetchedUserBlogs = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || !user.id) return;

    if (cachedUserBlogs[user.id]) {
      setUserBlogs(cachedUserBlogs[user.id]);
    }

    const shouldFetch =
      !hasFetchedUserBlogs.current || !cachedUserBlogs[user.id] || Date.now();

    if (shouldFetch) {
      hasFetchedUserBlogs.current = true;
      const API_URL = import.meta.env.VITE_API_BASE_URL;

      axios
        .get(`${API_URL}/api/user/blogs`, { withCredentials: true })
        .then((res) => {
          const fetchedUserBlogs = res.data.blogs.map((b: any) => ({
            id: b.id,
            title: b.title,
            summary: b.content.slice(0, 150) + "...",
            authorId: b.authorId,
            updatedAt: new Date(b.updatedAt),
            published: new Date(b.updatedAt).toLocaleDateString(),
            tags: b.tags || [],
            fetchTimestamp: Date.now(),
          }));

          cachedUserBlogs[user.id] = fetchedUserBlogs;
          setUserBlogs(fetchedUserBlogs);
        })
        .catch((err) => {
          console.error("Error fetching user blogs:", err);
        });
    }
  }, [user, isLoaded]);

  return (
    <>
      {/* Toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-200 rounded"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-60 border-r z-30 transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:block
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <button
            className="text-xl font-bold bg-transparent"
            onClick={() => {
              navigate("/landing");
              setOpen(false);
            }}
          >
            DraftDock
          </button>
          {/* Close icon on mobile */}
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 px-2 py-4">
          <NavItem href="/blogs" icon={<LayoutGrid />} active={activePage === "dock"}>
            Dock
          </NavItem>
          <NavItem href="/canvas" icon={<Eraser />} active={activePage === "canvas"}>
            Canvas
          </NavItem>
          <NavItem href="/drafts" icon={<FileDiff />} active={activePage === "drafts"}>
            Drafts
          </NavItem>

          {/* Blog List */}
          <div className="mt-4 px-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Your Blogs</h4>
            {userBlogs.length > 0 ? (
              userBlogs.map((blog) => (
                <FolderItem key={blog.id} href={`/blog/${blog.id}`}>
                  {blog.title.length > 20 ? blog.title.slice(0, 20) + "..." : blog.title}
                </FolderItem>
              ))
            ) : (
              <p className="text-gray-400 italic py-2 px-4 max-w-xs mx-auto text-center">
                Draft and Dock a Blog.
              </p>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
