import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { History, Trash2, Bookmark, Share2 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { usePageCache, PAGE_TTL } from "@/context/PageCacheContext";

const API_URL = import.meta.env.VITE_API_URL;

interface HistoryBlog {
  id: string;
  title: string;
  summary?: string;
  coverImage?: string;
  readAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

const NewHistoryPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [history, setHistory] = useState<HistoryBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = usePageCache();

  useEffect(() => {
    const fetchHistory = async () => {
      const cached = cache.get("history", PAGE_TTL.history);
      if (cached) {
        setHistory(cached);
        setLoading(false);
        return;
      }
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/user/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const historyData = await res.json();
          cache.set("history", historyData);
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
      cache.invalidate("history");
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // Group history by date
  const groupByDate = (items: HistoryBlog[]) => {
    const groups: Record<string, HistoryBlog[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    items.forEach((item) => {
      const readDate = new Date(item.readAt);
      const itemDay = new Date(
        readDate.getFullYear(),
        readDate.getMonth(),
        readDate.getDate()
      );

      let label: string;
      if (itemDay.getTime() === today.getTime()) {
        label = "Today";
      } else if (itemDay.getTime() === yesterday.getTime()) {
        label = "Yesterday";
      } else {
        label = itemDay.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return groups;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const grouped = groupByDate(history);

  return (
    <>
      <Helmet>
        <title>Reading History — DraftDock</title>
      </Helmet>

      <div className="flex-1 flex flex-col min-h-[calc(100vh-4.5rem)]">
        {/* Header - matching stitch history */}
        <header className="pt-12 pb-8 px-8 md:px-12 max-w-5xl w-full mx-auto">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white font-headline">
              Reading History
            </h2>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-gray-400">
              Last 30 Days
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 dark:text-gray-400 max-w-xl font-medium">
              Review your recent intellectual journey. Technical deep-dives
              preserved for your reference.
            </p>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-900/30 rounded-lg transition-all"
              >
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>
        </header>

        {/* Chronological List - matching stitch */}
        <section className="px-8 md:px-12 pb-20 max-w-5xl w-full mx-auto space-y-16 flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <History
                className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                size={48}
              />
              <h3 className="text-xl font-headline font-bold text-gray-900 dark:text-white mb-2">
                Your history is empty
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                Stories you read will appear here so you can easily find them.
              </p>
              <button
                onClick={() => navigate("/explore")}
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-90 transition"
              >
                Start Reading
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, items], groupIdx) => (
              <motion.div
                key={dateLabel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.1 }}
              >
                {/* Date Group Header */}
                <div className="flex items-center gap-4 mb-8">
                  <h3
                    className={`font-label font-bold text-xs uppercase tracking-widest ${
                      dateLabel === "Today"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-400"
                    }`}
                  >
                    {dateLabel}
                  </h3>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>

                {/* Items */}
                <div className="space-y-10">
                  {items.map((blog) => {
                    const excerpt =
                      (blog.summary || blog.title || "")
                        .slice(0, 200) + "...";

                    return (
                      <article
                        key={`${blog.id}-${blog.readAt}`}
                        className="group grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 items-start hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                        onClick={() => navigate(`/blog/${blog.id}`)}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            src={
                              blog.coverImage ||
                              "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=400"
                            }
                            alt={blog.title}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-2">
                            {(blog.tags || []).slice(0, 1).map((tag) => (
                              <span
                                key={tag.id}
                                className="font-label text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-mono font-bold uppercase tracking-wider"
                              >
                                {tag.name}
                              </span>
                            ))}
                            <span className="font-label text-[10px] text-gray-400">
                              {formatTime(blog.readAt)} •{" "}
                              {Math.ceil((blog.summary || "").length / 200) || 1} min
                              read
                            </span>
                          </div>

                          <h4 className="text-xl md:text-2xl font-bold leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2 text-gray-900 dark:text-white">
                            {blog.title}
                          </h4>

                          <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                            {excerpt}
                          </p>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                              <Bookmark size={14} />
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Share2 size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}

          {/* Load More */}
          {history.length > 0 && (
            <div className="flex justify-center pt-8">
              <button className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold hover:opacity-80 transition-all duration-300 active:scale-95">
                Load older activity
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default NewHistoryPage;
