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
  const API_URL = import.meta.env.VITE_API_URL;

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

  // Enhanced HTML sanitization function
  const sanitizeHtml = (html: string) => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove any potentially dangerous tags
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input'];
    dangerousTags.forEach(tag => {
      const elements = tempDiv.querySelectorAll(tag);
      elements.forEach(element => element.remove());
    });
    
    // Remove any event handlers (onclick, onload, etc.)
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(element => {
      const attributes = element.attributes;
      for (let i = attributes.length - 1; i >= 0; i--) {
        const attr = attributes[i];
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      }
    });
    
    return tempDiv.innerHTML;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-100/30">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-gray-100/30">
        <Header2 />
      </div>

      {/* Blog Content */}
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Back Button */}
        <div className="px-0 mb-6">
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
          <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight text-gray-900 mb-6">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm sm:text-base text-gray-700 font-sans mb-8">
            {/* Left: Author and Date */}
            <div className="flex items-center gap-2">
              <span>By <span className="font-medium">{blog.author.email}</span></span>
              <span className="text-gray-400">•</span>
              <span>{formattedDate}</span>
            </div>

            {/* Right: Share Button */}
            <ShareButton
              variant="link"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
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
              <span>{copied ? "Copied!" : "Share"}</span>
            </ShareButton>
          </div>

          <hr className="border-gray-300 mb-10" />

          {/* Blog Content - Now renders HTML with proper styling */}
          <article 
            className="blog-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content) }}
          />
        </div>
      </main>

      {/* Footer */}
      <div className="bg-gray-100/30 mt-auto">
        <Footer />
      </div>

      {/* Enhanced custom styles for blog content */}
      <style>{`
        .blog-content {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #1f2937;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .blog-content p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }
        
        .blog-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 2rem 0 1.5rem 0;
          line-height: 1.2;
          color: #111827;
          font-family: Georgia, serif;
        }
        
        .blog-content h2 {
          font-size: 2rem;
          font-weight: 600;
          margin: 1.75rem 0 1rem 0;
          line-height: 1.3;
          color: #111827;
          font-family: Georgia, serif;
        }
        
        .blog-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem 0;
          line-height: 1.4;
          color: #111827;
          font-family: Georgia, serif;
        }
        
        .blog-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem 0;
          line-height: 1.4;
          color: #111827;
        }
        
        .blog-content h5, .blog-content h6 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.4;
          color: #111827;
        }
        
        .blog-content strong, .blog-content b {
          font-weight: 700;
          color: #111827;
        }
        
        .blog-content em, .blog-content i {
          font-style: italic;
        }
        
        .blog-content u {
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
        }
        
        .blog-content strike, .blog-content s {
          text-decoration: line-through;
          text-decoration-thickness: 1px;
        }
        
        .blog-content pre {
          background-color: #1e1e1e;
          color: #ffffff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin: 2rem 0;
          overflow-x: auto;
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          border: 1px solid #374151;
        }
        
        .blog-content code {
          background-color: #f3f4f6;
          color: #1f2937;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          font-size: 0.9em;
          border: 1px solid #e5e7eb;
        }
        
        .blog-content pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          border: none;
          border-radius: 0;
        }
        
        .blog-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #4b5563;
          background-color: #f8fafc;
          padding: 1rem 1.5rem;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        
        .blog-content ul {
          list-style-type: disc;
          margin-left: 2rem;
          margin-bottom: 1.5rem;
          padding-left: 0;
        }
        
        .blog-content ol {
          list-style-type: decimal;
          margin-left: 2rem;
          margin-bottom: 1.5rem;
          padding-left: 0;
        }
        
        .blog-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
          padding-left: 0.5rem;
        }
        
        .blog-content li > ul,
        .blog-content li > ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .blog-content a {
          color: #3b82f6;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
          transition: color 0.2s ease;
        }
        
        .blog-content a:hover {
          color: #1d4ed8;
          text-decoration-thickness: 2px;
        }
        
        /* Handle custom font sizes from rich text editor */
        .blog-content [style*="font-size: 12px"] {
          font-size: 0.75rem !important;
          line-height: 1.6;
        }
        
        .blog-content [style*="font-size: 14px"] {
          font-size: 0.875rem !important;
          line-height: 1.6;
        }
        
        .blog-content [style*="font-size: 16px"] {
          font-size: 1rem !important;
          line-height: 1.7;
        }
        
        .blog-content [style*="font-size: 18px"] {
          font-size: 1.125rem !important;
          line-height: 1.7;
        }
        
        .blog-content [style*="font-size: 24px"] {
          font-size: 1.5rem !important;
          line-height: 1.5;
        }
        
        .blog-content [style*="font-size: 36px"] {
          font-size: 2.25rem !important;
          line-height: 1.3;
        }
        
        /* Handle custom font families */
        .blog-content [style*="font-family"] {
          line-height: inherit;
        }
        
        /* Handle custom colors */
        .blog-content [style*="color"] {
          /* Colors are preserved from inline styles */
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .blog-content {
            font-size: 1rem;
            line-height: 1.7;
          }
          
          .blog-content h1 {
            font-size: 2rem;
          }
          
          .blog-content h2 {
            font-size: 1.75rem;
          }
          
          .blog-content h3 {
            font-size: 1.375rem;
          }
          
          .blog-content pre {
            padding: 1rem;
            margin: 1.5rem 0;
            font-size: 0.8rem;
          }
          
          .blog-content ul, .blog-content ol {
            margin-left: 1.5rem;
          }
        }
        
        /* Preserve spacing and formatting */
        .blog-content br {
          margin-bottom: 0.5rem;
        }
        
        .blog-content hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 2rem 0;
        }
        
        /* Table styling if tables are used */
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        
        .blog-content th, .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        
        .blog-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        /* Image styling */
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default BlogView;