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
import { useBlogCache } from "@/context/BlogCacheContext";

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
  const { getBlogDetail, setBlogDetail } = useBlogCache();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch blog data
  useEffect(() => {
    if (!blogId) return;

    const cachedBlog = getBlogDetail(blogId);
    if (cachedBlog) {
      setBlog(cachedBlog as unknown as Blog);
      setLikes(cachedBlog.likes ?? 0);
      return;
    }

    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/${blogId}`);
        const data = await res.json();
        setBlog(data);
        setLikes(data.likes ?? 0);
        setBlogDetail(blogId, data);
      } catch (err) {
        console.error("Failed to fetch blog", err);
      }
    };
    fetchBlog();
  }, [blogId, API_URL, getBlogDetail, setBlogDetail]);

  // Fetch like-status for current user
  useEffect(() => {
    if (!blogId) return;
    const checkLikeStatus = async () => {
      try {
        const token = await (window as any).Clerk?.session?.getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/api/blogs/${blogId}/like-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLiked(data.isLiked);
      } catch {}
    };
    checkLikeStatus();
  }, [blogId, API_URL]);

  // WebSocket for real-time like count updates from other users
  useEffect(() => {
    if (!blogId) return;

    const wsUrl = import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, "ws").replace(/3000/, "3001");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
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

  const handleLike = async () => {
    if (isProcessing) return;

    const token = await (window as any).Clerk?.session?.getToken();
    if (!token) {
      alert("Please log in to like this blog!");
      return;
    }

    setIsProcessing(true);
    const wasLiked = liked;
    const method = wasLiked ? "DELETE" : "POST";

    // Optimistic UI update
    setLiked(!wasLiked);
    setLikes((prev) => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Like action failed");
    } catch (err) {
      console.error(err);
      // Revert optimistic UI on failure
      setLiked(wasLiked);
      setLikes((prev) => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsProcessing(false);
    }
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

  const imageMatch = blog?.content?.match(/!\[.*?\]\((.*?)\)/);
  const coverImage = imageMatch ? imageMatch[1] : `https://picsum.photos/seed/${blog.id}/2000/800`;
  const contentWithoutCover = imageMatch && blog.content ? blog.content.replace(imageMatch[0], '').replace(/^\s+/, '') : blog?.content;


  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Header2 />
      </div>

      {/* Blog Content */}
      <main className="pt-28 max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-12 w-full pb-16">
        {/* Left Sidebar: Table of Contents */}
        <aside className="h-screen sticky top-24 w-full hidden lg:block">
          <BackButton variant="link" onClick={() => window.history.back()} className="mb-6 -ml-4 hover:bg-surface-container-low transition-colors px-4 py-2 rounded-md font-medium text-on-surface-variant">
            <ChevronLeft className="me-1 opacity-60" size={16} /> Back To Blogs
          </BackButton>
          <div className="flex flex-col gap-2 p-px">
            <h3 className="text-lg font-bold text-on-surface font-headline mb-4">Navigation</h3>
            <p className="text-xs text-on-surface-variant font-medium italic mb-2">Automated TOC</p>
            <div className="flex items-center gap-2 text-sm text-outline font-medium">
               <span className="material-symbols-outlined text-sm">segment</span>
               Content mapped below
            </div>
          </div>
        </aside>

        {/* Middle Column: Main Content */}
        <article className="bg-surface-container-lowest p-8 md:p-12 shadow-sm rounded-xl outline outline-variant/20">
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-outline">Technical Publication</span>
              <span className="h-1 w-1 bg-outline-variant rounded-full"></span>
              <span className="text-xs font-medium text-outline">{formattedDate}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black font-headline tracking-tighter leading-tight text-primary mb-6">
              {blog.title}
            </h1>
          </header>

          <img 
            className="w-full aspect-[21/9] object-cover rounded-xl mb-12 shadow-sm border border-outline-variant/30" 
            src={coverImage}
            alt="Blog Cover Hero" 
          />

          <div data-color-mode="light" className="w-full blueprint-prose">
            <MDEditor.Markdown 
              source={contentWithoutCover} 
              className="wmde-markdown max-w-none !bg-transparent !text-on-surface"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        </article>

        {/* Right Column: Meta & Actions */}
        <aside className="space-y-8">
          {/* Author Card */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-transparent hover:border-outline-variant transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
                 <span className="material-symbols-outlined text-outline">person</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface">{blog.author.email.split('@')[0]}</h4>
                <p className="text-xs text-on-surface-variant">Author</p>
              </div>
            </div>
            <button className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-md hover:bg-primary-container transition-all active:scale-95">Follow Updates</button>
          </div>

          {/* Engagement Actions: Likes & Share */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 flex flex-col gap-4 shadow-sm">
            <h4 className="font-bold text-sm tracking-tight mb-2 text-on-surface">Engagement</h4>
            <div className="flex items-center justify-between">
                <button
                  id={`like-btn-${blog.id}`}
                  onClick={handleLike}
                  className={`
                    group flex items-center gap-2 px-4 py-2 rounded-full border font-medium text-sm
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary
                    ${liked
                      ? "bg-primary border-primary text-on-primary shadow-sm"
                      : "bg-surface border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                    }
                  `}
                >
                  <Heart
                    size={18}
                    strokeWidth={2}
                    className={`transition-all duration-200 ${liked ? "fill-on-primary text-on-primary scale-110" : "group-hover:scale-110"}`}
                  />
                  <span className="tabular-nums font-bold">{likes}</span>
                </button>

                <ShareButton
                  variant="outline"
                  className="flex items-center gap-2 text-on-surface-variant hover:text-primary border border-outline-variant hover:border-primary transition-colors px-4 py-2 rounded-full bg-surface"
                  onClick={(e) => {
                    e.stopPropagation();
                    const postUrl = `${window.location.origin}/blog/${blog.id}`;
                    navigator.clipboard
                      .writeText(postUrl)
                      .then(() => setCopied(true))
                      .catch(() => alert("Failed to copy the link."));
                  }}
                >
                  <Share className="opacity-80" size={16} strokeWidth={2} />
                  <span className="font-medium text-sm">{copied ? "Copied!" : "Share"}</span>
                </ShareButton>
            </div>
          </div>

          {/* Support Action */}
          <div className="bg-secondary p-6 rounded-xl flex flex-col gap-4 shadow-md mt-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary-container">coffee</span>
              <h4 className="font-bold text-sm text-on-secondary">Support the Writer</h4>
            </div>
            <p className="text-xs text-on-secondary/90 leading-relaxed font-medium">If you found this technical guide useful, consider supporting future deep-dives.</p>
            <a href="https://buymeacoffee.com/abhash" target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-secondary-container text-on-secondary-container text-sm font-black rounded-md hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-all flex items-center justify-center gap-2 mt-2">
                Buy Me a Coffee
            </a>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <div className="mt-auto border-t border-outline-variant/30">
        <Footer />
      </div>
    </div>
  );
};

export default BlogView;