import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { usePageCache } from "@/context/PageCacheContext";
import { useLike } from "@/context/LikeContext";
import { useBookmarks } from "@/context/BookmarkContext";
import BlogSkeleton from "@/components/BlogSkeleton";
import { NewAppShell } from "@/components/new-components";
import { BackButton } from "@/components/ui/backButton";
import {
  ChevronLeft,
  MessageCircle,
  Trash2,
  Link2,
  Headphones,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Flame,
  Highlighter,
  Twitter,
  Linkedin,
  Share2,
  Heart,
  Bookmark
} from "lucide-react";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import 'highlight.js/styles/atom-one-dark.css';
import MDEditor from '@uiw/react-md-editor';
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  views?: number;
  coverImage?: string;
  authorId?: string;
  author: {
    id?: string;
    email: string;
    name?: string;
    profilePicture?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id?: string; email: string; name?: string; profilePicture?: string };
  authorId?: string;
}

interface RelatedBlog {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  authorId?: string;
  author: { id?: string; email: string; name?: string; profilePicture?: string };
  tags: { id: string; name: string }[];
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const BlogView = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
  const [showHighlightNote, setShowHighlightNote] = useState(false);
  const [highlightNote, setHighlightNote] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const cache = usePageCache();
  const likeHook = useLike(blogId ?? "");
  const { isBookmarked, toggleBookmark } = useBookmarks();

  // Fetch blog data
  useEffect(() => {
    if (!blogId) return;
    const cacheKey = `blogview:${blogId}`;

    // Always fire side-effects (view count + history) regardless of cache
    fetch(`${API_URL}/api/blogs/${blogId}/view`, { method: 'POST' }).catch(() => {});
    if (isSignedIn) {
      getToken().then(token => {
        fetch(`${API_URL}/api/user/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ blogId }),
        }).then(r => r.json()).then(d => {
          if (d.streak) setStreak(d.streak);
        }).catch(() => {});
      });
    }

    // Check cache first
    const cached = cache.get(cacheKey, 300000);
    if (cached) {
      setBlog(cached.blog);
      setComments(cached.comments || []);
      setHighlights(cached.highlights || []);
      setRelatedBlogs(cached.relatedBlogs || []);
      return;
    }

    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/${blogId}`);
        const blogData = await res.json();
        setBlog(blogData);
        // Fetch comments
        const commentsRes = await fetch(`${API_URL}/api/blogs/${blogId}/comments`);
        const commentsData = commentsRes.ok ? await commentsRes.json() : [];
        setComments(commentsData);
        // Fetch highlights
        const highlightsRes = await fetch(`${API_URL}/api/highlights/blog/${blogId}`);
        const highlightsData = highlightsRes.ok ? await highlightsRes.json() : [];
        setHighlights(highlightsData);
        // Fetch related blogs
        let relatedData: RelatedBlog[] = [];
        try {
          const relatedRes = await fetch(`${API_URL}/api/blogs/${blogId}/related`);
          if (relatedRes.ok) relatedData = await relatedRes.json();
        } catch {}
        setRelatedBlogs(relatedData);

        cache.set(cacheKey, { blog: blogData, comments: commentsData, highlights: highlightsData, relatedBlogs: relatedData });
      } catch (err) {
        console.error("Failed to fetch blog", err);
      }
    };
    fetchBlog();
  }, [blogId, API_URL, isSignedIn]);

  useEffect(() => {
    if (copied) { const timer = setTimeout(() => setCopied(false), 1000); return () => clearTimeout(timer); }
  }, [copied]);

  // Close share dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const stopTTS = () => {
    window.speechSynthesis.cancel();
    if (ttsIntervalRef.current) {
      clearInterval(ttsIntervalRef.current);
      ttsIntervalRef.current = null;
    }
    utteranceRef.current = null;
    setIsPlaying(false);
  };

  const toggleTTS = () => {
    if (isPlaying) {
      stopTTS();
      return;
    }

    const rawContent = blog?.content || '';
    const cleanContent = rawContent
      .replace(/!\[.*?\]\(.*?\)/g, '')        // Strip markdown images
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')     // Strip markdown links, keep text
      .replace(/<[^>]*>?/gm, '')              // Strip HTML tags
      .replace(/https?:\/\/[^\s)]+/g, '')     // Strip any remaining URLs
      .replace(/[#*`>\[\]]/g, '')             // Strip markdown symbols
      .replace(/\n{2,}/g, '. ')               // Paragraph breaks → pauses
      .replace(/\s{2,}/g, ' ')               // Collapse whitespace
      .trim();

    const text = `${blog?.title}. ${cleanContent}`;

    const speak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Prefer a natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && v.localService)
        ?? voices.find(v => v.lang.startsWith('en'))
        ?? voices[0];
      if (preferred) utterance.voice = preferred;

      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => stopTTS();
      utterance.onerror = () => stopTTS();

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);

      // Chrome bug: SpeechSynthesis pauses after ~15s unless resumed periodically
      ttsIntervalRef.current = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          stopTTS();
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    };

    // Voices may not be loaded yet on first call
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
      // Fallback: some browsers never fire onvoiceschanged
      setTimeout(() => {
        if (!isPlaying) speak();
      }, 300);
    }
  };

  // Cancel speech when navigating away
  useEffect(() => () => stopTTS(), []);

  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(null);
      setShowHighlightNote(false);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const text = sel.toString().trim();

    if (text.length > 0) {
      setSelection({
        text,
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 10
      });
    }
  };

  const saveHighlight = async () => {
    if (!selection || !isSignedIn) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          blogId,
          text: selection.text,
          note: highlightNote
        }),
      });
      if (res.ok) {
        const newH = await res.json();
        setHighlights([newH, ...highlights]);
        setSelection(null);
        setHighlightNote("");
        setShowHighlightNote(false);
      }
    } catch (err) {
      console.error("Failed to save highlight", err);
    }
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  // Generate Table of Contents from markdown headings
  const tocItems = useMemo<TocItem[]>(() => {
    if (!blog?.content) return [];
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;
    while ((match = headingRegex.exec(blog.content)) !== null) {
      const text = match[2].replace(/[#*`\[\]]/g, "").trim();
      items.push({
        id: text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
        text,
        level: match[1].length,
      });
    }
    return items;
  }, [blog?.content]);

  if (!blog) {
    return (
      <NewAppShell hideFooter>
        <div className="py-12 px-4 sm:px-8 lg:px-12">
           <BlogSkeleton variant="large" />
        </div>
      </NewAppShell>
    );
  }

  const wordCount = (blog.content || "").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const postUrl = `${window.location.origin}/blog/${blog.id}`;
  const authorName = blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";

  const RightPanelContent = (
    <div className="space-y-10">
      {/* TOC Widget */}
      {tocItems.length > 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Outline</h3>
          <nav className="space-y-4">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block text-sm font-bold transition-all truncate ${
                  item.level === 1
                    ? "text-gray-900 dark:text-gray-100"
                    : item.level === 2
                      ? "pl-4 text-gray-500 hover:text-blue-500"
                      : "pl-8 text-xs text-gray-400"
                }`}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Author & Stats Widget */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
         <div className="flex items-center gap-4 mb-6">
            <img
              src={blog.author.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author.email}`}
              className="w-12 h-12 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
              alt={authorName}
              onClick={() => navigate(`/author/${blog.author?.id || blog.authorId}`)}
            />
            <div>
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Written By</p>
               <h4 className="font-bold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors duration-200" onClick={() => navigate(`/author/${blog.author?.id || blog.authorId}`)}>{authorName}</h4>
            </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
               <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Views</p>
               <p className="text-xl font-headline font-bold text-gray-900 dark:text-white">{blog.views || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
               <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time</p>
               <p className="text-xl font-headline font-bold text-gray-900 dark:text-white">{readingTime}m</p>
            </div>
         </div>
         {streak && (
           <div className="mt-4 flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              <span className="text-xs font-bold text-orange-600 italic">On a {streak} day reading streak!</span>
           </div>
         )}
      </div>

      {/* Community Highlights Widget */}
      {highlights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Top Highlights</h3>
           <div className="space-y-4">
              {highlights.slice(0, 3).map((h) => (
                <div key={h.id} className="group">
                   <p className="text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-2 italic mb-2">"{h.text}"</p>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span className="text-[10px] font-black uppercase text-gray-400">{h.user.name || h.user.email.split('@')[0]}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );

  return (
    <NewAppShell
      hideSidebar={isFocusMode}
      hideRightPanel={isFocusMode}
      hideFooter
      rightPanelContent={RightPanelContent}
      showSearch={!isFocusMode}
    >
      <Helmet>
        <title>{blog.title} — DraftDock</title>
      </Helmet>
      <ReadingProgressBar />

      <div className="px-4 sm:px-8 lg:px-12 py-8">
        <div className="mb-10 lg:hidden">
          <BackButton variant="link" onClick={() => navigate(-1)}>
            <ChevronLeft className="me-1" size={16} /> Back
          </BackButton>
        </div>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Cover Image */}
          {blog.coverImage && (
            <div className="relative aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl">
               <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          {/* Title and Meta */}
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 mb-12 pb-12 border-b border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3">
               <img
                 src={blog.author.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author.email}`}
                 className="w-10 h-10 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
                 alt={authorName}
                 onClick={(e) => { e.stopPropagation(); navigate(`/author/${blog.author?.id || blog.authorId}`); }}
               />
               <div className="text-sm">
                 <p className="font-bold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors duration-200" onClick={() => navigate(`/author/${blog.author?.id || blog.authorId}`)}>{authorName}</p>
                 <p className="text-xs text-gray-500">{new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
               </div>
             </div>

             <div className="flex items-center gap-4 ml-auto">
                {/* Like Button */}
                <button
                  onClick={() => likeHook.toggle()}
                  aria-pressed={likeHook.liked}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    likeHook.liked
                      ? "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400"
                      : "bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 hover:bg-rose-50 hover:text-rose-500"
                  }`}
                >
                  <Heart size={18} className={likeHook.liked ? "fill-rose-500" : ""} />
                  <span className="text-sm font-bold tabular-nums">{likeHook.likes}</span>
                </button>

                {/* Bookmark Button */}
                <button
                  onClick={() => blogId && toggleBookmark(blogId)}
                  aria-pressed={blogId ? isBookmarked(blogId) : false}
                  className={`p-2 rounded-xl border transition-all ${
                    blogId && isBookmarked(blogId)
                      ? "bg-blue-50 border-blue-200 text-blue-500 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
                      : "bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 hover:bg-blue-50 hover:text-blue-500"
                  }`}
                >
                  <Bookmark size={18} className={blogId && isBookmarked(blogId) ? "fill-blue-500" : ""} />
                </button>

                <div ref={shareRef} className="relative">
                  <button
                    onClick={() => setShareOpen(!shareOpen)}
                    className="p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent hover:bg-blue-50 hover:text-blue-500 transition-all text-gray-500"
                  >
                    <Share2 size={18} />
                  </button>
                  <AnimatePresence>
                    {shareOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-4 w-52 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl p-2 z-50 overflow-hidden"
                      >
                         <button onClick={() => { navigator.clipboard.writeText(postUrl); setCopied(true); setShareOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition flex items-center gap-3">
                            <Link2 size={14} /> {copied ? "Copied Link!" : "Copy Link"}
                         </button>
                         <div className="h-px bg-gray-50 dark:bg-gray-700 my-1 mx-2" />
                         <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(postUrl)}`} target="_blank" className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition flex items-center gap-3">
                            <Twitter size={14} className="text-blue-400" /> Twitter / X
                         </a>
                         <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`} target="_blank" className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition flex items-center gap-3">
                            <Linkedin size={14} className="text-blue-600" /> LinkedIn
                         </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             </div>
          </div>

          {/* Reading Controls Sticky Wrapper */}
          <div className={`sticky ${isFocusMode ? 'top-10' : 'top-20'} z-[49] mb-12 flex items-center justify-between p-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl transition-all duration-500`}>
             <div className="flex items-center gap-4 px-3">
                <div className="p-2 bg-violet-600 rounded-xl text-white">
                   <Headphones size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Reading Mode</p>
             </div>
             <div className="flex items-center gap-2">
                <button
                  onClick={toggleTTS}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isPlaying ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  {isPlaying ? "Stop" : "Listen"}
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                <button
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isFocusMode ? 'bg-violet-600 text-white shadow-violet-200' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {isFocusMode ? "Exit Focus" : "Focus"}
                </button>
             </div>
          </div>

          {/* Markdown Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none font-body leading-relaxed selection:bg-yellow-200 selection:text-black relative"
            onMouseUp={handleSelection}
          >
            <MDEditor.Markdown
              source={blog.content}
              className="!bg-transparent !text-gray-800 dark:!text-gray-200"
            />

            {/* Selection Popover */}
            <AnimatePresence>
              {selection && !showHighlightNote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute z-50 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-2xl cursor-pointer flex items-center gap-2"
                  style={{ top: selection.y, left: selection.x, transform: 'translate(-50%, -100%)' }}
                  onClick={() => setShowHighlightNote(true)}
                >
                  <Highlighter size={14} className="text-yellow-400" />
                  Highlight
                </motion.div>
              )}
            </AnimatePresence>

            {/* Note Popover */}
            <AnimatePresence>
              {selection && showHighlightNote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-3xl shadow-2xl w-72"
                  style={{ top: selection.y, left: selection.x, transform: 'translate(-50%, -100%)' }}
                >
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Add private note</h4>
                  <textarea
                    autoFocus
                    placeholder="Reflect on this passage..."
                    value={highlightNote}
                    onChange={(e) => setHighlightNote(e.target.value)}
                    className="w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-0 mb-4 resize-none h-24"
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowHighlightNote(false)} className="text-[10px] text-gray-400 font-black uppercase hover:text-gray-600 transition">Cancel</button>
                    <button onClick={saveHighlight} className="bg-violet-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase transition hover:opacity-90 shadow-md">Save Note</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <hr className="my-16 border-gray-100 dark:border-gray-700" />

          {/* Comments Section */}
          <section className="space-y-10">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-headline font-bold text-gray-900 dark:text-white flex items-center gap-3">
                   <MessageCircle size={24} className="text-blue-500" /> Discussions
                </h2>
                <span className="bg-gray-100 dark:bg-gray-900 text-gray-500 font-bold px-3 py-1 rounded-full text-xs">{comments.length}</span>
             </div>

             <div className="flex gap-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl group transition-all focus-within:ring-2 focus-within:ring-violet-500/20">
                <div className="hidden sm:block">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`} className="w-10 h-10 rounded-xl" alt="" />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row gap-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Join the conversation..."
                    rows={2}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 resize-none font-body leading-relaxed"
                  />
                  <button
                    onClick={async () => {
                      if (!newComment.trim() || submittingComment) return;
                      setSubmittingComment(true);
                      try {
                        const token = await getToken();
                        const res = await fetch(`${API_URL}/api/blogs/${blogId}/comments`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ content: newComment.trim() }),
                        });
                        if (res.ok) { const comment = await res.json(); setComments((prev) => [...prev, comment]); setNewComment(""); }
                      } catch (err) { console.error("Failed to post comment", err); }
                      finally { setSubmittingComment(false); }
                    }}
                    disabled={!newComment.trim() || submittingComment}
                    className="h-fit px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-30"
                  >
                    {submittingComment ? "..." : "Post"}
                  </button>
                </div>
             </div>

             <div className="space-y-8">
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/30 dark:bg-gray-900/10 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No thoughts yet. Lead the way!</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4 group"
                    >
                      <img
                        src={c.author?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.email}`}
                        className="w-10 h-10 rounded-xl bg-gray-100 cursor-pointer transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
                        alt={c.author.name || c.author.email.split("@")[0]}
                        onClick={() => navigate(`/author/${(c.author as any)?.id || c.authorId}`)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-sm font-bold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors duration-200" onClick={() => navigate(`/author/${(c.author as any)?.id || c.authorId}`)}>{c.author.name || c.author.email.split("@")[0]}</span>
                           <span className="text-[10px] font-bold text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body leading-relaxed">{c.content}</p>
                      </div>
                      {c.authorId === (useAuth as any)?.userId && (
                        <button
                          onClick={async () => {
                            const token = await getToken();
                            await fetch(`${API_URL}/api/comments/${c.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                            setComments((prev) => prev.filter((x) => x.id !== c.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
             </div>
          </section>
        </motion.article>

        {/* Related Posts Section inside main content for mobile, or below for desktop */}
        {relatedBlogs.length > 0 && (
          <section className="mt-16 pt-12 border-t border-gray-100 dark:border-gray-700">
             <h2 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-8 italic">More from DraftDock</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedBlogs.map((rb) => {
                  const excerpt = rb.content.replace(/[#*`>\[\]]/g, "").slice(0, 100) + "...";
                  return (
                    <div
                      key={rb.id}
                      onClick={() => navigate(`/blog/${rb.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                       <div className="aspect-video relative overflow-hidden">
                          <img src={rb.coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                       </div>
                       <div className="p-5">
                          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition line-clamp-2 mb-2 leading-tight">{rb.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 font-body">{excerpt}</p>
                       </div>
                    </div>
                  );
                })}
             </div>
          </section>
        )}

        {/* Footer info inside main content */}
        <div className="mt-20 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] border-t border-gray-100 dark:border-gray-700 pt-16">
           Fin. DraftDock V2
        </div>
      </div>

    </NewAppShell>
  );
};

export default BlogView;