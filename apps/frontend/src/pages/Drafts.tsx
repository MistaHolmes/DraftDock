import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FileDiff, Trash2, Send, Pencil } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { usePageCache } from "@/context/PageCacheContext";
import { NewAppShell } from "@/components/new-components";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const stripHtml = (html: string) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const Drafts = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const cache = usePageCache();

  const fetchDrafts = async () => {
    const cached = cache.get('drafts', 180000);
    if (cached) { setDrafts(cached); setLoading(false); return; }
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/user/blogs/drafts`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const draftData = res.data.blogs || [];
      cache.set('drafts', draftData);
      setDrafts(draftData);
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrafts(); }, []);

  const handlePublish = async (id: string) => {
    if (!confirm("Publish this draft?")) return;
    setActionId(id);
    try {
      const token = await getToken();
      await axios.patch(`${API_URL}/api/blogs/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      cache.invalidate('drafts', 'blogs:all');
      setDrafts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to publish.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft permanently?")) return;
    setActionId(id);
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      cache.invalidate('drafts', 'blogs:all');
      setDrafts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <NewAppShell activePage="drafts" hideRightPanel>
      <Helmet>
        <title>My Drafts — DraftDock</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
            <FileDiff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Drafts</h1>
            <p className="text-xs text-gray-400 font-medium">{drafts.length} draft{drafts.length !== 1 ? "s" : ""} saved</p>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : drafts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <FileDiff className="w-12 h-12 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
            <p className="text-lg font-semibold text-gray-400 dark:text-gray-500 mb-2">No drafts yet</p>
            <p className="text-sm text-gray-300 dark:text-gray-600 mb-6">Your unpublished stories will appear here</p>
            <button
              onClick={() => navigate("/create-blog")}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-80 transition"
            >
              Start Writing
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft, i) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-full">
                        Draft
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        Last edited {new Date(draft.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                      {draft.title || "Untitled"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {stripHtml(draft.content).slice(0, 150)}...
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/edit-blog/${draft.id}`)}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 transition"
                      title="Edit"
                      disabled={actionId === draft.id}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handlePublish(draft.id)}
                      className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                      title="Publish"
                      disabled={actionId === draft.id}
                    >
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                      title="Delete"
                      disabled={actionId === draft.id}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </NewAppShell>
  );
};

export default Drafts;
