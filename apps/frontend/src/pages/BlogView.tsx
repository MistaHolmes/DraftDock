import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import BlogSkeleton from "@/components/BlogSkeleton";
import Header2 from "@/components/ui/header2";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/ui/backButton";
import { ChevronLeft, Heart, Share } from "lucide-react";
import { ShareButton } from "@/components/ui/shareButton";
import 'highlight.js/styles/atom-one-dark.css';
import MDEditor from '@uiw/react-md-editor';

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
  author: {
    email: string;
  };
}

const BlogView = () => {
  const { blogId } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeQueue, setLikeQueue] = useState(0); // Tracks pending likes (+ or -)
  const wsRef = useRef<WebSocket | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch blog data
  useEffect(() => {
    if (!blogId) return;
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/${blogId}`);
        const data = await res.json();
        setBlog(data);
        setLikes(data.likes ?? 0);
      } catch (err) {
        console.error("Failed to fetch blog", err);
      }
    };
    fetchBlog();
  }, [blogId, API_URL]);

  // WebSocket for real-time likes
  useEffect(() => {
    if (!blogId) return;

    const wsUrl = API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Request current like count immediately on connect
      ws.send(`getLikes:${blogId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "likes_update" && data.blogId === blogId) {
          setLikes(data.likes);
        }
      } catch {
        // ignore non-JSON messages (pong, etc.)
      }
    };

    ws.onerror = (err) => console.warn("Likes WS error:", err);

    return () => {
      ws.close();
    };
  }, [blogId, API_URL]);

  // Cleanup copy timer
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Debounced queue for sending likes to WebSocket
  useEffect(() => {
    if (likeQueue === 0 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !blogId) return;

    const timeoutPath = setTimeout(() => {
      // Send the net result over WebSocket
      if (likeQueue > 0) {
        wsRef.current?.send(`like:${blogId}`);
      } else if (likeQueue < 0) {
        wsRef.current?.send(`unlike:${blogId}`);
      }
      // Reset the queue after sending
      setLikeQueue(0);
    }, 1000); // 1-second debounce delay

    return () => clearTimeout(timeoutPath);
  }, [likeQueue, blogId]);

  const handleLike = () => {
    // Optimistically update UI immediately
    if (liked) {
      setLikes((prev) => Math.max(0, prev - 1));
      setLikeQueue((prev) => prev - 1); // Add "unlike" action to queue
    } else {
      setLikes((prev) => prev + 1);
      setLikeQueue((prev) => prev + 1); // Add "like" action to queue
    }
    setLiked((prev) => !prev);
  };

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

            {/* Right: Like and Share Buttons */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  id={`like-btn-${blog.id}`}
                  onClick={handleLike}
                  aria-pressed={liked}
                  aria-label={liked ? "Unlike this post" : "Like this post"}
                  className={`
                    group flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium text-sm
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400
                    ${liked
                      ? "bg-rose-50 border-rose-300 text-rose-600 shadow-sm"
                      : "bg-white border-gray-300 text-gray-600 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50"
                    }
                  `}
                >
                  <Heart
                    size={16}
                    strokeWidth={2}
                    className={`transition-all duration-200 ${liked ? "fill-rose-500 text-rose-500 scale-110" : "group-hover:scale-110"}`}
                  />
                  <span className="tabular-nums">{likes}</span>
                  <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
                </button>
              </div>

              <ShareButton
                variant="link"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 border border-transparent rounded-full hover:bg-gray-100"
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
          </div>

          <hr className="border-gray-300 mb-10" />

          {/* Blog Content - Now renders HTML with proper styling */}
          <div data-color-mode="light" className="blog-content w-full">
            <MDEditor.Markdown 
              source={blog.content} 
              className="prose prose-lg max-w-none !bg-transparent !text-gray-800"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>

          {/* ────────────────────────────────────────────────────── */}
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