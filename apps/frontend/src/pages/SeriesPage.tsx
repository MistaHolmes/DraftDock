import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft } from "lucide-react";
import { usePageCache } from "@/context/PageCacheContext";
import Header2 from "@/components/ui/header2";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  likes: number;
  coverImage?: string;
  updatedAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

interface Series {
  id: string;
  name: string;
  description?: string;
  author: { id: string; email: string; name?: string };
  blogs: Blog[];
}

const SeriesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const cache = usePageCache();

  useEffect(() => {
    if (!id) return;
    const cacheKey = `series:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) { setSeries(cached); setLoading(false); return; }
    const fetchSeries = async () => {
      try {
        const res = await fetch(`${API_URL}/api/series/${id}`);
        if (res.ok) {
          const data = await res.json();
          cache.set(cacheKey, data);
          setSeries(data);
        }
      } catch (err) {
        console.error("Failed to fetch series:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-xl mb-4">Series not found.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-black text-white rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  const authorName = series.author?.name || series.author?.email?.split("@")[0] || "Anonymous";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>{series.name} — DraftDock Series</title>
      </Helmet>
      <Header2 />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition mb-6 text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Series</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{series.name}</h1>
          {series.description && (
            <p className="text-gray-500 dark:text-gray-400 mb-2">{series.description}</p>
          )}
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            By <button onClick={() => navigate(`/author/${series.author.id}`)} className="hover:underline hover:text-blue-600">{authorName}</button> · {series.blogs.length} part{series.blogs.length !== 1 ? "s" : ""}
          </p>

          <div className="space-y-4">
            {series.blogs.map((blog, i) => {
              const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 140) + "...";
              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{blog.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">{excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span>{new Date(blog.updatedAt).toLocaleDateString()}</span>
                        <span>❤️ {blog.likes}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default SeriesPage;
