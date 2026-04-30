import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { BlogSkeleton, DraftBlogSkeleton } from "./ui/blogSkeleton";
import { Pencil } from "lucide-react";


interface Blog {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL;

interface UserContentSectionProps {
  /** When provided by a parent, the section is externally controlled */
  activeSection?: "blogs" | "drafts";
  onSectionChange?: (s: "blogs" | "drafts") => void;
}

const UserContentSection: React.FC<UserContentSectionProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const [localTab, setLocalTab] = useState<"blogs" | "drafts">("blogs");
  // If parent is controlling the section use that, otherwise use local state
  const activeTab = activeSection ?? localTab;
  const setActiveTab = (s: "blogs" | "drafts") => {
    if (onSectionChange) onSectionChange(s);
    else setLocalTab(s);
  };
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const stripHtmlTags = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const handleBlogClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBlog(null);
  };

  const handleDeleteClick = async (e: React.MouseEvent, blogId: string) => {
    e.stopPropagation();

    const confirmed = window.confirm("Are you sure you want to delete this blog?");
    if (!confirmed) return;

    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to delete blog";
      alert(`Error deleting blog: ${errorMessage}`);
    }
  };

  const handlePublishClick = async (e: React.MouseEvent, blogId: string) => {
    e.stopPropagation();

    const confirmed = window.confirm("Are you sure you want to publish this draft?");
    if (!confirmed) return;

    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/blogs/${blogId}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update state: move blog from drafts to published
      setBlogs((prev) =>
        prev.map((blog) =>
          blog.id === blogId ? { ...blog, published: true } : blog
        )
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to publish blog";
      alert(`Error publishing blog: ${errorMessage}`);
    }
  };

  useEffect(() => {
    const fetchUserBlogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/user/blogs/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setBlogs(data.blogs || []);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || "Failed to fetch blogs";
        setError(errorMessage);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBlogs();
  }, []);

  // Separate published and draft blogs
  const publishedBlogs = blogs.filter(blog => blog.published);
  const draftBlogs = blogs.filter(blog => !blog.published);

  return (
    <div>
      {/* Inner tab buttons — only shown when this component is used standalone (no external controller) */}
      {!activeSection && (
        <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden w-fit m-6">
          <button
            onClick={() => setActiveTab("blogs")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "blogs"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-900/20"
            }`}
          >
            Blogs
          </button>
          <div className="w-px bg-gray-300" />
          <button
            onClick={() => setActiveTab("drafts")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "drafts"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-700 hover:bg-yellow-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-yellow-900/20"
            }`}
          >
            Drafts
          </button>
        </div>
      )}

      {/* Content */}
      <div className="min-h-[150px]">
        {loading ? (
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
            {[1, 2, 3].map((i) =>
              activeTab === "blogs" ? (
                <BlogSkeleton key={i} />
              ) : (
                <DraftBlogSkeleton key={i} />
              )
            )}
          </div>
        ) : error ? (
          <p className="text-red-500 px-6 py-8">Error: {error}</p>
        ) : activeTab === "blogs" ? (
          publishedBlogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Pencil className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="font-headline font-bold text-gray-900 dark:text-white text-sm mb-1">No published blogs yet</p>
              <p className="text-xs text-gray-400">Start writing to share your ideas with the world.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {publishedBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="px-6 py-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                  onClick={() => handleBlogClick(blog)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                        {stripHtmlTags(blog.content).slice(0, 120)}
                        {stripHtmlTags(blog.content).length > 120 ? "…" : ""}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-label">
                        Published on {new Date(blog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/edit-blog/${blog.id}`); }}
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Edit blog"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, blog.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete blog"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          draftBlogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="font-headline font-bold text-gray-900 dark:text-white text-sm mb-1">No drafts saved</p>
              <p className="text-xs text-gray-400">Drafts you're working on will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {draftBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="px-6 py-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                  onClick={() => handleBlogClick(blog)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-headline font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors leading-snug">
                          {blog.title}
                        </h3>
                        <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                          Draft
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                        {stripHtmlTags(blog.content).slice(0, 120)}
                        {stripHtmlTags(blog.content).length > 120 ? "…" : ""}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-label">
                        Last edited {new Date(blog.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => handlePublishClick(e, blog.id)}
                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Publish draft"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, blog.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete draft"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        </div>

        {/* Modal Overlay */}
        {isModalOpen && selectedBlog && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedBlog.title}
                    </h2>
                    {!selectedBlog.published && (
                    <span className="px-3 py-1 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 rounded-full">
                        Draft
                    </span>
                    )}
                </div>
                <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
                    title="Close"
                >
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {selectedBlog.published
                    ? `Published on ${new Date(selectedBlog.createdAt).toLocaleDateString()}`
                    : `Last edited on ${new Date(selectedBlog.updatedAt).toLocaleDateString()}`
                    }
                </div>
                <div
                    className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
                </div>
            </div>
            </div>
        )}
    </div>
  );
};

export default UserContentSection;