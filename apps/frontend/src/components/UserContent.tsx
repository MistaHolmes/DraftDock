import { useState, useEffect } from "react";
import axios from "axios";
import { BlogSkeleton, DraftBlogSkeleton } from "./ui/blogSkeleton";
import { useBlogCache } from "@/context/BlogCacheContext";

interface Blog {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Configure axios defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const UserContentSection = () => {
  const [activeTab, setActiveTab] = useState<"blogs" | "drafts">("blogs");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userBlogs, setUserBlogs, invalidateDashboard } = useBlogCache();

  const stripHtmlTags = (html: string) => {
    let cleanText = html ? html.replace(/!\[.*?\]\(.*?\)/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/#{1,6}\s?/g, "") : "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cleanText;
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
      await api.delete(`/api/blogs/${blogId}`);
      const remBlogs = blogs.filter((blog) => blog.id !== blogId);
      setBlogs(remBlogs);
      setUserBlogs(remBlogs);
      invalidateDashboard();
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
      await api.patch(`/api/blogs/${blogId}/publish`);
      
      const updated = blogs.map((blog) =>
        blog.id === blogId ? { ...blog, published: true } : blog
      );
      setBlogs(updated);
      setUserBlogs(updated);
      invalidateDashboard();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to publish blog";
      alert(`Error publishing blog: ${errorMessage}`);
    }
  };

  useEffect(() => {
    const fetchUserBlogs = async () => {
      setLoading(true);
      setError(null);

      if (userBlogs) {
        setBlogs(userBlogs);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/user/blogs/all');
        const fetchedBlogs = response.data.blogs || [];
        setBlogs(fetchedBlogs);
        setUserBlogs(fetchedBlogs);
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
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-12 border-b border-surface-container-highest mb-12">
        <button
          onClick={() => setActiveTab("blogs")}
          className={`pb-4 font-headline text-lg transition-colors ${
            activeTab === "blogs"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-zinc-400 hover:text-primary font-bold"
          }`}
        >
          My Blogs
        </button>
        <button
          onClick={() => setActiveTab("drafts")}
          className={`pb-4 font-headline text-lg transition-colors ${
            activeTab === "drafts"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-zinc-400 hover:text-primary font-bold"
          }`}
        >
          My Drafts
        </button>
      </div>

      {/* Blog List */}
      <div className="space-y-16">
        {loading ? (
          <div className="space-y-8">
            {activeTab === "blogs" ? (
              <>
                <BlogSkeleton />
                <BlogSkeleton />
              </>
            ) : (
              <>
                <DraftBlogSkeleton />
                <DraftBlogSkeleton />
              </>
            )}
          </div>
        ) : error ? (
          <p className="text-error font-body">Error: {error}</p>
        ) : activeTab === "blogs" ? (
          <>
            {publishedBlogs.length === 0 ? (
              <p className="text-on-surface-variant font-body">No published blogs found.</p>
            ) : (
              publishedBlogs.map(blog => (
                <article key={blog.id} className="group cursor-pointer relative" onClick={() => handleBlogClick(blog)}>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-64 h-44 bg-surface-container-low overflow-hidden rounded-xl grayscale group-hover:grayscale-0 transition-all duration-700">
                      <img className="w-full h-full object-cover" alt="blog preview" src={blog.content && blog.content.match(/!\[.*?\]\((.*?)\)/) ? blog.content.match(/!\[.*?\]\((.*?)\)/)![1] : `https://picsum.photos/seed/${blog.id}/300/200`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded">WEB</span>
                        <span className="text-zinc-400 text-xs font-label">
                          {new Date(blog.createdAt).toLocaleDateString()} • {Math.max(1, Math.ceil(stripHtmlTags(blog.content).length / 200))} min read
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold font-headline mb-3 group-hover:underline underline-offset-4 decoration-1 break-words">{blog.title}</h3>
                      <p className="text-on-surface-variant line-clamp-2 text-md leading-relaxed mb-4 break-words">
                        {stripHtmlTags(blog.content).slice(0, 150)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-primary font-bold font-headline gap-1 group-hover:gap-3 transition-all">
                          Read More <span className="material-symbols-outlined">arrow_forward</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleDeleteClick(e, blog.id)}
                            className="p-2 text-outline-variant hover:text-error hover:bg-error-container rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete blog"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </>
        ) : (
          <>
            {draftBlogs.length === 0 ? (
              <p className="text-on-surface-variant font-body">No drafts found.</p>
            ) : (
              draftBlogs.map(blog => (
                <article key={blog.id} className="group cursor-pointer relative" onClick={() => handleBlogClick(blog)}>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-64 h-44 bg-surface-container-low overflow-hidden rounded-xl grayscale group-hover:grayscale-0 transition-all duration-700">
                      <img className="w-full h-full object-cover" alt="draft preview" src={blog.content && blog.content.match(/!\[.*?\]\((.*?)\)/) ? blog.content.match(/!\[.*?\]\((.*?)\)/)![1] : `https://picsum.photos/seed/${blog.id}draft/300/200`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded">DRAFT</span>
                        <span className="text-zinc-400 text-xs font-label">
                          Last edited on {new Date(blog.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold font-headline mb-3 group-hover:underline underline-offset-4 decoration-1 break-words">{blog.title || "Untitled Draft"}</h3>
                      <p className="text-on-surface-variant line-clamp-2 text-md leading-relaxed mb-4 break-words">
                        {stripHtmlTags(blog.content || "").slice(0, 150) || "Start writing your next big article..."}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-primary font-bold font-headline gap-1 group-hover:gap-3 transition-all">
                          Edit Draft <span className="material-symbols-outlined">edit</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handlePublishClick(e, blog.id)}
                            className="p-2 text-outline-variant hover:text-secondary hover:bg-secondary-container rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Publish draft"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, blog.id)}
                            className="p-2 text-outline-variant hover:text-error hover:bg-error-container rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete draft"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </>
        )}
      </div>

        {/* Modal Overlay */}
        {isModalOpen && selectedBlog && (
            <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest outline outline-variant/15 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-container-highest bg-surface-container-low">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold font-headline tracking-tight text-primary">
                    {selectedBlog.title}
                    </h2>
                    {!selectedBlog.published && (
                    <span className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold bg-secondary-container text-on-secondary-container rounded-sm">
                        Draft
                    </span>
                    )}
                </div>
                <button
                    onClick={closeModal}
                    className="p-2 hover:bg-surface-container-highest rounded-full transition-colors duration-200"
                    title="Close"
                >
                    <svg className="w-6 h-6 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-surface-container-lowest">
                <div className="mb-4 text-xs font-label text-zinc-400">
                    {selectedBlog.published 
                    ? `Published on ${new Date(selectedBlog.createdAt).toLocaleDateString()}`
                    : `Last edited on ${new Date(selectedBlog.updatedAt).toLocaleDateString()}`
                    }
                </div>
                <div 
                    className="prose prose-lg max-w-none text-on-surface font-body leading-relaxed"
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