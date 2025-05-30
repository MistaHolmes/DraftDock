import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BlogSkeleton from "@/components/BlogSkeleton";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/ui/backButton";
import { ChevronLeft, Share } from "lucide-react";
import { ShareButton } from "@/components/ui/shareButton";

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    email: string;
  };
}

const BlogView = () => {
  const { blogId } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/${blogId}`);
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error("Failed to fetch blog", err);
      }
    };

    fetchBlog();
  }, [blogId, API_URL]);

  // Cleanup timer if component unmounts or copied changes
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!blog) {
    return (
      <div className="bg-gray-100/30 min-h-screen">
        <main className="max-w-3xl mx-auto p-6 bg-gray-100/30">
          <BlogSkeleton variant="large" />
        </main>
      </div>
    );
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-100/30">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-gray-100/30">
        <Header2 />
      </div>

      {/* Blog Content */}
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        {/* Back Button */}
        <div className="px-0">
          <BackButton variant="link" onClick={() => window.history.back()}>
            <ChevronLeft
              className="me-1 opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Back To Blogs
          </BackButton>
        </div>

        <div className="px-6">
          {/* Title */}
          <h1 className="font-serif text-5xl font-bold leading-tight text-gray-900 mb-4">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="mt-4 flex items-center justify-between text-sm sm:text-base text-gray-700 font-sans mb-6">
            {/* Left: Author and Date */}
            <div>
              By <span className="font-medium">{blog.author.email}</span> •{" "}
              {formattedDate}
            </div>

            {/* Right: Share Button */}
            <ShareButton
              variant="link"
              className="flex items-center gap-1 text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                const postUrl = `${window.location.origin}/blog/${blog.id}`;
                navigator.clipboard
                  .writeText(postUrl)
                  .then(() => setCopied(true))
                  .catch(() => alert("Failed to copy the link."));
              }}
            >
              <Share
                className="opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="text-gray-700">{copied ? "Copied!" : "Share"}</span>
            </ShareButton>
          </div>

          <hr className="border-gray-300 mb-8" />

          {/* Blog Content */}
          <article className="font-serif text-[1.2rem] sm:text-[1.3rem] leading-relaxed text-gray-900 whitespace-pre-wrap">
            {blog.content}
          </article>
        </div>
      </main>

      {/* Footer */}
      <div className="bg-gray-100/30 mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default BlogView;
