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

  // Function to sanitize HTML content (basic sanitization)
  const sanitizeHtml = (html: string) => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove any script tags for security
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    return tempDiv.innerHTML;
  };

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

          {/* Blog Content - Now renders HTML */}
          <article 
            className="blog-content font-serif text-[1.2rem] sm:text-[1.3rem] leading-relaxed text-gray-900"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content) }}
          />
        </div>
      </main>

      {/* Footer */}
      <div className="bg-gray-100/30 mt-auto">
        <Footer />
      </div>

      {/* Add custom styles for blog content */}
      <style>{`
        :global(.blog-content) {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        :global(.blog-content p) {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        
        :global(.blog-content h1) {
          font-size: 2rem;
          font-weight: bold;
          margin: 1.5rem 0 1rem 0;
          line-height: 1.3;
        }
        
        :global(.blog-content h2) {
          font-size: 1.75rem;
          font-weight: bold;
          margin: 1.25rem 0 0.75rem 0;
          line-height: 1.3;
        }
        
        :global(.blog-content h3) {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.3;
        }
        
        :global(.blog-content strong) {
          font-weight: bold;
        }
        
        :global(.blog-content em) {
          font-style: italic;
        }
        
        :global(.blog-content u) {
          text-decoration: underline;
        }
        
        :global(.blog-content strike) {
          text-decoration: line-through;
        }
        
        :global(.blog-content pre) {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        :global(.blog-content code) {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
        }
        
        :global(.blog-content blockquote) {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        :global(.blog-content ul) {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        :global(.blog-content ol) {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        :global(.blog-content li) {
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }
        
        :global(.blog-content a) {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        :global(.blog-content a:hover) {
          color: #1d4ed8;
        }
        
        /* Handle different font sizes */
        :global(.blog-content [style*="font-size"]) {
          line-height: 1.4;
        }
        
        /* Preserve spacing for formatted content */
        :global(.blog-content br) {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default BlogView;