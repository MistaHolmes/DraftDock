import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Bookmark, BookmarkX } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { usePageCache } from "@/context/PageCacheContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  updatedAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const Bookmarks = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const cache = usePageCache();

  const fetchBookmarks = async () => {
    const cached = cache.get('bookmarks', 180000);
    if (cached) { setBlogs(cached); setLoading(false); return; }
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/user/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const bookmarkData = Array.isArray(res.data) ? res.data : [];
      cache.set('bookmarks', bookmarkData);
      setBlogs(bookmarkData);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const handleRemove = async (blogId: string) => {
    setRemoving(blogId);
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/api/user/bookmarks/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      cache.invalidate('bookmarks');
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
    } catch (err) {
      alert("Failed to remove bookmark.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Bookmarks — DraftDock</title>
      </Helmet>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-2xl">
             <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">Your Bookmarks</h1>
            <p className="text-sm text-gray-500">{blogs.length} stories saved for later</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
               <Bookmark className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-headline font-bold text-gray-900 dark:text-white mb-2">No saved blogs yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">Start bookmarking stories you want to keep or read later.</p>
            <button
              onClick={() => navigate("/blogs")}
              className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition shadow-lg"
            >
              Discover Stories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {blogs.map((blog, i) => {
              const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 140) + "...";
              const displayName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";
              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm group hover:shadow-md transition-shadow relative"
                >
                  <div className="flex gap-6">
                    <div className="flex-1 min-w-0">
                      <h3
                        onClick={() => navigate(`/blog/${blog.id}`)}
                        className="font-headline font-bold text-gray-900 dark:text-white text-xl mb-3 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition line-clamp-2"
                      >
                        {blog.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 font-body text-sm mb-6 line-clamp-2 leading-relaxed">{excerpt}</p>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.email}`} alt="" />
                           </div>
                           <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                             {displayName} · {new Date(blog.updatedAt).toLocaleDateString()}
                           </span>
                        </div>

                        <button
                          onClick={() => handleRemove(blog.id)}
                          disabled={removing === blog.id}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <BookmarkX size={14} />
                          {removing === blog.id ? "..." : "Remove"}
                        </button>
                      </div>
                    </div>
                    {blog.coverImage && (
                      <div className="hidden sm:block w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </>
  );
};

export default Bookmarks;
