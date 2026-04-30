import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { History, Trash2, Clock } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { usePageCache } from "@/context/PageCacheContext";

const API_URL = import.meta.env.VITE_API_URL;

interface HistoryBlog {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  readAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const ReadingHistory = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [history, setHistory] = useState<HistoryBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = usePageCache();

  useEffect(() => {
    const fetchHistory = async () => {
      const cached = cache.get('history', 180000);
      if (cached) { setHistory(cached); setLoading(false); return; }
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/user/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const historyData = await res.json();
          cache.set('history', historyData);
          setHistory(historyData);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const clearHistory = async () => {
    if (!window.confirm("Clear all reading history?")) return;
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/user/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      cache.invalidate('history');
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const formatReadAt = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <Helmet>
        <title>Reading History — DraftDock</title>
      </Helmet>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                 <History className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">Reading History</h1>
                <p className="text-sm text-gray-500">{history.length} stories recently read</p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-100 dark:border-red-900/30 rounded-xl transition-all"
              >
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                 <History className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-headline font-bold text-gray-900 dark:text-white mb-2">Your history is empty</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">Stories you read will appear here so you can easily find them again.</p>
              <button
                onClick={() => navigate("/blogs")}
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition shadow-lg"
              >
                Start Reading
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {history.map((blog, i) => {
                const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 140) + "...";
                const authorName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";
                return (
                  <motion.div
                    key={`${blog.id}-${blog.readAt}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/blog/${blog.id}`)}
                    className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group"
                  >
                    <div className="flex gap-6 items-center">
                      {blog.coverImage && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                           <img src={blog.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate leading-snug">
                          {blog.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-1 font-body leading-relaxed">{excerpt}</p>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> {formatReadAt(blog.readAt)}</span>
                          <span className="flex items-center gap-1.5"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.email}`} className="w-4 h-4 rounded-full" alt="" /> {authorName}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default ReadingHistory;
