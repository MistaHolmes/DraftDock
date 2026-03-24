import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share, Heart } from "lucide-react";
import { ShareButton } from "./ui/shareButton";
import { useAuth } from "@clerk/clerk-react";

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, "");
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, "ws");

const BlogCardLikeButton = ({ blogId }: { blogId: string }) => {
  const { getToken, userId } = useAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/${blogId}`);
        const data = await res.json();
        setLikes(data.likes ?? 0);
      } catch (err) {}
    };
    fetchLikes();
  }, [blogId]);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/blogs/${blogId}/like-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLiked(data.isLiked);
      } catch (err) {}
    };
    fetchLikeStatus();
  }, [blogId, userId, getToken]);

  useEffect(() => {
    if (!blogId) return;
    const wsUrl = WS_URL;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "likes_update" && data.blogId === blogId) {
          setLikes(data.likes);
        }
      } catch {}
    };

    return () => {
      ws.close();
    };
  }, [blogId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      alert("Please log in to like this blog!");
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    const method = liked ? "DELETE" : "POST";
    
    // Optimistic UI updates
    setLiked(!liked);
    setLikes(prev => liked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/blogs/${blogId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Like failed");
    } catch (err) {
      console.error(err);
      // Revert optimistic UI
      setLiked(liked);
      setLikes(prev => liked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      aria-pressed={liked}
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
  );
};

interface Blog {
  id: string;
  title: string;
  summary: string;
  content?: string;
  author: string;
  published: string;
}

interface BlogListProps {
  posts: Blog[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  const scrollRef = useRef<HTMLDivElement>(null); // ✅ Ref for scrolling

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const stripHtmlTags = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const handleClick = (id: string) => {
    navigate(`/blog/${id}`);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      scrollToTop(); // ✅ Scroll to top on next
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      scrollToTop(); // ✅ Scroll to top on back
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={scrollRef}></div> {/* 👈 Scroll Target */}

      {posts.length === 0 ? (
        <div className="text-center py-12 w-full">
          <p className="text-gray-500 font-body">No blogs available</p>
          <Button className="mt-4 gap-2 bg-primary text-on-primary font-headline" onClick={() => navigate('/create-blog')}>
            Create your first blog
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-12">
          {currentPosts.map((post, index) => (
            <motion.article
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => handleClick(post.id)}
              onKeyDown={(e) => e.key === "Enter" && handleClick(post.id)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="cursor-pointer group relative bg-surface-container-lowest p-8 rounded-xl transition-all hover:bg-surface-container-low"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    {index === 0 && (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-primary text-on-primary px-2 py-0.5 rounded-sm">Featured</span>
                    )}
                    <span className="text-xs font-medium text-on-surface-variant font-label">{Math.max(1, Math.ceil(stripHtmlTags(post.summary).length / 200))} min read</span>
                    <span className="text-xs text-outline-variant font-label">{post.published}</span>
                  </div>
                  <h2 className="text-3xl font-bold font-headline tracking-tight mb-3 group-hover:underline decoration-2 break-words">{stripHtmlTags(post.title)}</h2>
                  <p className="text-on-surface-variant line-clamp-2 mb-6 font-body leading-relaxed break-words">{stripHtmlTags(post.summary)}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center text-[10px] font-bold text-on-surface">
                          {post.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{post.author}</span>
                      </div>
                      <span className="text-outline-variant">•</span>
                      <div className="flex gap-2">
                        <span className="text-xs font-medium px-2 py-1 bg-surface-container-high rounded-sm text-on-surface-variant">Tech</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <BlogCardLikeButton blogId={post.id} />
                      <ShareButton
                        variant="link"
                        className="flex items-center gap-1 text-on-surface-variant hover:text-black hover:bg-surface-container-high rounded-sm px-2 py-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const postUrl = `${window.location.origin}/blog/${post.id}`;
                          navigator.clipboard.writeText(postUrl)
                            .then(() => {
                              setCopiedId(post.id);
                              setTimeout(() => setCopiedId(null), 1000);
                            });
                        }}
                      >
                        <Share className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                        <span className="text-xs font-medium">{copiedId === post.id ? "Copied!" : "Share"}</span>
                      </ShareButton>
                    </div>
                  </div>
                </div>
                
                {/* Extract the cover image from markdown or fallback to aesthetic mockup */}
                <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                  <img 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" 
                    alt="blog illustration" 
                    src={post.content && post.content.match(/!\[.*?\]\((.*?)\)/) ? post.content.match(/!\[.*?\]\((.*?)\)/)![1] : `https://picsum.photos/seed/${post.id}/300/200`} 
                  />
                </div>
              </div>
            </motion.article>
          ))}

          {/* Pagination Controls */}
          {posts.length > 0 && (
            <nav className="mt-16 flex items-center justify-center gap-2">
              <button 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1}
                className={`px-4 h-10 flex items-center justify-center rounded-sm font-medium transition-colors ${currentPage > 1 ? 'hover:bg-surface-container-high text-on-surface-variant cursor-pointer' : 'text-outline-variant cursor-not-allowed opacity-50'}`}
              >
                Prev
              </button>
              
              <button className="w-10 h-10 flex items-center justify-center rounded-sm bg-primary text-on-primary font-bold font-headline">
                {currentPage}
              </button>
              
              <span className="mx-2 text-outline-variant text-sm border-l border-outline-variant/30 h-4"></span>
              <span className="text-sm font-medium text-on-surface-variant px-2">Page {currentPage} of {Math.max(1, totalPages)}</span>
              <span className="mx-2 text-outline-variant text-sm border-l border-outline-variant/30 h-4"></span>
              
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-4 h-10 flex items-center justify-center rounded-sm font-medium transition-colors ${currentPage < totalPages ? 'hover:bg-surface-container-high text-on-surface-variant cursor-pointer' : 'text-outline-variant cursor-not-allowed opacity-50'}`}
              >
                Next
              </button>
            </nav>
          )}

          {currentPage === totalPages && posts.length > 0 && (
            <p className="mt-2 text-center text-on-surface-variant/70 italic text-sm">No more drafts — dock a new one!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogList;
