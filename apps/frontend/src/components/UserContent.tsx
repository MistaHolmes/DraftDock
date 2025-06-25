import { useState, useEffect } from "react";
import axios from "axios";
import { Footer } from "./Footer";
import { BlogSkeleton, DraftBlogSkeleton } from "./ui/blogSkeleton";

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
      await api.delete(`/api/blogs/${blogId}`);
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
      await api.patch(`/api/blogs/${blogId}/publish`);
      
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
        const response = await api.get('/api/user/blogs/all');
        setBlogs(response.data.blogs || []);
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
        <div className="mt-10 bg-white rounded-xl shadow-md border border-gray-300 p-6 max-w-7xl mx-auto">
        {/* Buttons */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden w-fit">
            <button
            onClick={() => setActiveTab("blogs")}
            className={`px-6 py-3 font-semibold transition ${
                activeTab === "blogs"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-indigo-50"
            }`}
            >
            Blogs
            </button>
            <div className="w-px bg-gray-300"></div>
            <button
            onClick={() => setActiveTab("drafts")}
            className={`px-6 py-3 font-semibold transition ${
                activeTab === "drafts"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-700 hover:bg-yellow-50"
            }`}
            >
            Drafts
            </button>
        </div>

        {/* Content below */}
        <div className="mt-6 min-h-[150px]">
            {loading ? (
              <div className="space-y-4">
                {activeTab === "blogs" ? (
                  // Show blog skeletons
                  <>
                    <BlogSkeleton />
                    <BlogSkeleton />
                    <BlogSkeleton />
                  </>
                ) : (
                  // Show draft skeletons
                  <>
                    <DraftBlogSkeleton />
                    <DraftBlogSkeleton />
                    <DraftBlogSkeleton />
                  </>
                )}
              </div>
            ) : error ? (
            <p className="text-red-500">Error: {error}</p>
            ) : activeTab === "blogs" ? (
            <>
                {publishedBlogs.length === 0 ? (
                <p className="text-gray-500">No published blogs found.</p>
                ) : (
                publishedBlogs.map(blog => (
                    <div 
                    key={blog.id} 
                    className="mb-4 border-b pb-4 last:border-none cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4 group"
                    onClick={() => handleBlogClick(blog)}
                    >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {blog.title}
                        </h3>
                        <p className="text-gray-700 mt-2 leading-relaxed">
                            {stripHtmlTags(blog.content).slice(0, 100)}
                            {stripHtmlTags(blog.content).length > 100 ? "..." : ""}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Published on {new Date(blog.createdAt).toLocaleDateString()}
                        </p>
                        </div>
                        <button
                        onClick={(e) => handleDeleteClick(e, blog.id)}
                        className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100"
                        title="Delete blog"
                        >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        </button>
                    </div>
                    </div>
                ))
                )}
            </>
            ) : (
            <>
                {draftBlogs.length === 0 ? (
                <p className="text-gray-500">No drafts found.</p>
                ) : (
                draftBlogs.map(blog => (
                    <div 
                    key={blog.id} 
                    className="mb-4 border-b pb-4 last:border-none cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4 group"
                    onClick={() => handleBlogClick(blog)}
                    >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                            {blog.title}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Draft
                            </span>
                        </div>
                        <p className="text-gray-700 mt-2 leading-relaxed">
                            {stripHtmlTags(blog.content).slice(0, 100)}
                            {stripHtmlTags(blog.content).length > 100 ? "..." : ""}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Last edited on {new Date(blog.updatedAt).toLocaleDateString()}
                        </p>
                        </div>
                        <button
                        onClick={(e) => handlePublishClick(e, blog.id)}
                        className="ml-4 p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100"
                        title="Publish draft"
                        >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        </button>
                        <button
                        onClick={(e) => handleDeleteClick(e, blog.id)}
                        className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100"
                        title="Delete draft"
                        >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        </button>
                    </div>
                    </div>
                ))
                )}
            </>
            )}
        </div>

        {/* Modal Overlay */}
        {isModalOpen && selectedBlog && (
            <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                    {selectedBlog.title}
                    </h2>
                    {!selectedBlog.published && (
                    <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Draft
                    </span>
                    )}
                </div>
                <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
                    title="Close"
                >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="mb-4 text-sm text-gray-500">
                    {selectedBlog.published 
                    ? `Published on ${new Date(selectedBlog.createdAt).toLocaleDateString()}`
                    : `Last edited on ${new Date(selectedBlog.updatedAt).toLocaleDateString()}`
                    }
                </div>
                <div 
                    className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
                </div>
            </div>
            </div>
        )}
        </div>
        <Footer/>
    </div>
  );
};

export default UserContentSection;