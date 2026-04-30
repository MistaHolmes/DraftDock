import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Bookmark, BookmarkX, Share2, Search, Filter } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { usePageCache, PAGE_TTL } from "@/context/PageCacheContext";
import { useBookmarks } from "@/context/BookmarkContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  summary?: string;
  coverImage?: string;
  updatedAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const NewBookmarksPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const cache = usePageCache();
  const { toggleBookmark } = useBookmarks();

  const fetchBookmarks = async () => {
    const cached = cache.get("bookmarks", PAGE_TTL.bookmarks);
    if (cached) {
      setBlogs(cached);
      setLoading(false);
      return;
    }
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/user/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const bookmarkData = Array.isArray(res.data) ? res.data : [];
      cache.set("bookmarks", bookmarkData);
      setBlogs(bookmarkData);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemove = async (blogId: string) => {
    setRemoving(blogId);
    try {
      // Use the global context to toggle (remove) the bookmark
      await toggleBookmark(blogId);
      cache.invalidate("bookmarks");
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
    } catch (err) {
      alert("Failed to remove bookmark.");
    } finally {
      setRemoving(null);
    }
  };

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.tags || []).some((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <>
      <Helmet>
        <title>Bookmarks — DraftDock</title>
      </Helmet>

      <div className="flex-1 flex flex-col min-h-[calc(100vh-4.5rem)]">
        {/* Hero Header - matching stitch bookmarks */}
        <header className="pt-12 pb-8 px-8 md:px-12 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-5xl mx-auto">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-widest text-xs uppercase mb-4 block">
              Personal Collection
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 dark:text-white tracking-tighter mb-3">
              Bookmarks
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl font-body">
              Curated technical insights and architectural deep-dives saved for
              your reference.
            </p>
          </div>
        </header>

        {/* Search & Filter Bar - matching stitch */}
        <div className="px-8 md:px-12 py-4 bg-white dark:bg-gray-950 sticky top-[4.5rem] z-40 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm placeholder:text-gray-400 transition-shadow focus:outline-none"
                placeholder="Search saved posts..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                <Filter size={18} />
                <span className="hidden sm:inline">Latest</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bookmarks List - matching stitch editorial layout */}
        <section className="px-8 md:px-12 py-12 flex-1">
          <div className="max-w-5xl mx-auto flex flex-col gap-12">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <Bookmark
                  className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                  size={48}
                />
                <h3 className="text-xl font-headline font-bold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? "No matching bookmarks" : "No saved blogs yet"}
                </h3>
                <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                  {searchQuery
                    ? "Try a different search query."
                    : "Start bookmarking stories you want to read later."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate("/explore")}
                    className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-90 transition"
                  >
                    Discover Stories
                  </button>
                )}
              </div>
            ) : (
              filteredBlogs.map((blog, i) => {
                const excerpt =
                  (blog.summary || blog.title || "").slice(0, 200) +
                  "...";
                const displayName =
                  blog.author?.name ||
                  blog.author?.email?.split("@")[0] ||
                  "Anonymous";

                return (
                  <motion.article
                    key={blog.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex flex-col md:flex-row gap-8 items-start hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/blog/${blog.id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="w-full md:w-64 aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      <img
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        src={
                          blog.coverImage ||
                          "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800"
                        }
                        alt={blog.title}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col pt-1">
                      <div className="flex items-center gap-3 mb-3">
                        {(blog.tags || []).slice(0, 1).map((tag) => (
                          <span
                            key={tag.id}
                            className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                          >
                            {tag.name}
                          </span>
                        ))}
                        <span className="text-gray-400 text-xs font-label">
                          {Math.ceil((blog.summary || "").length / 200) || 1} min read
                        </span>
                      </div>

                      <h2 className="text-2xl font-headline font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3 leading-tight">
                        {blog.title}
                      </h2>

                      <p className="text-gray-500 dark:text-gray-400 font-body mb-6 line-clamp-2">
                        {excerpt}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-gray-200/50 dark:border-gray-800/50 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.email}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-bold font-label text-gray-900 dark:text-white">
                            {displayName}
                          </span>
                          <span className="text-xs text-gray-400 font-label">
                            •{" "}
                            {new Date(blog.updatedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(blog.id);
                            }}
                            disabled={removing === blog.id}
                            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                            title="Remove bookmark"
                          >
                            <BookmarkX size={18} />
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })
            )}

            {/* Load More */}
            {filteredBlogs.length > 0 && (
              <div className="flex justify-center py-12 border-t border-gray-200/50 dark:border-gray-800/50">
                <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 hover:opacity-80 active:scale-95">
                  Load older bookmarks
                  <span>↓</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default NewBookmarksPage;
