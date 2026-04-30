import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Hash, ArrowLeft, Heart, Bookmark, TrendingUp, Clock, Filter } from "lucide-react";
import { usePageCache } from "@/context/PageCacheContext";
import { useLike } from "@/context/LikeContext";
import { useBookmarks } from "@/context/BookmarkContext";
import BlogSkeleton from "@/components/BlogSkeleton";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  likes: number;
  views?: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  author: { id?: string; email: string; name?: string; profilePicture?: string };
  tags: { id: string; name: string }[];
}

interface TagItem {
  name: string;
  count: number;
}

/* ── Like button (matches Explore page style) ── */
const TagLikeButton = ({ blogId }: { blogId: string }) => {
  const { likes, liked, toggle } = useLike(blogId);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      aria-label="Like"
      aria-pressed={liked}
      className={`inline-flex items-center gap-1.5 p-2 rounded-md transition-colors ${
        liked
          ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <Heart size={16} className={liked ? "fill-rose-500" : ""} />
      <span className="text-xs font-medium">{likes}</span>
    </button>
  );
};

/* ── Bookmark button (matches Explore page style) ── */
const TagBookmarkButton = ({ blogId }: { blogId: string }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(blogId);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleBookmark(blogId); }}
      aria-label="Bookmark"
      aria-pressed={bookmarked}
      className={`inline-flex items-center p-2 rounded-md transition-colors ${
        bookmarked
          ? "text-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <Bookmark size={16} className={bookmarked ? "fill-blue-500" : ""} />
    </button>
  );
};

const TagBlogs = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [relatedTags, setRelatedTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const cache = usePageCache();

  useEffect(() => {
    if (!tagName) return;
    setLoading(true);

    const cacheKey = `tag:${tagName}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      setBlogs(cached);
      setLoading(false);
    }

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/by-tag/${encodeURIComponent(tagName)}`);
        const data = await res.json();
        const blogData = Array.isArray(data) ? data : [];
        cache.set(cacheKey, blogData);
        setBlogs(blogData);
      } catch (err) {
        console.error("Failed to fetch tag blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedTags = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tags/trending`);
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (t: TagItem) => t.name.toLowerCase() !== tagName.toLowerCase()
        );
        setRelatedTags(filtered.slice(0, 8));
      } catch {
        /* ignore */
      }
    };

    if (!cached) fetchBlogs();
    else fetchBlogs(); // still refresh in background
    fetchRelatedTags();
  }, [tagName]);

  const sortedBlogs = useMemo(() => {
    if (sortBy === "popular") {
      return [...blogs].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    }
    return [...blogs].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [blogs, sortBy]);

  /* ── Hero blog for the tag ── */
  const heroBlog = sortedBlogs[0];
  const remainingBlogs = sortedBlogs.slice(1);

  return (
    <>
      <Helmet>
        <title>#{tagName} — DraftDock</title>
        <meta name="description" content={`Blogs tagged with #${tagName} on DraftDock.`} />
      </Helmet>

      <div className="px-6 md:px-12 min-h-screen pb-16">
        {/* ── Breadcrumb ── */}
        <div className="pt-8 pb-4">
          <button
            onClick={() => navigate("/explore")}
            className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            Back to Explore
          </button>
        </div>

        {/* ── Header ── */}
        <header className="pb-8 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-start gap-5 mb-4">
            <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200/40 dark:shadow-none">
              <Hash className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter text-gray-900 dark:text-white leading-none">
                {tagName}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400 font-body">
                {loading
                  ? "Loading..."
                  : `${blogs.length} article${blogs.length !== 1 ? "s" : ""} published`}
              </p>
            </div>
          </div>

          {/* Sort + filter bar */}
          <div className="flex items-center gap-3 mt-6">
            <Filter size={14} className="text-gray-400" />
            <span className="text-[10px] font-label font-bold uppercase tracking-widest text-gray-400 mr-2">
              Sort by
            </span>
            <button
              onClick={() => setSortBy("latest")}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-label uppercase tracking-wider font-bold transition-colors ${
                sortBy === "latest"
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              }`}
            >
              <Clock size={12} />
              Latest
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-label uppercase tracking-wider font-bold transition-colors ${
                sortBy === "popular"
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              }`}
            >
              <TrendingUp size={12} />
              Popular
            </button>
          </div>
        </header>

        {/* ── Loading State ── */}
        {loading ? (
          <div className="space-y-12 py-10">
            {/* Hero skeleton */}
            <div className="rounded-xl bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] animate-pulse h-[320px]" />
            {/* Feed skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full">
                <BlogSkeleton variant="large" />
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          /* ── Empty State ── */
          <div className="text-center py-24">
            <div className="inline-flex p-5 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
              <Hash className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-headline font-bold text-gray-900 dark:text-white mb-2">
              No articles yet for #{tagName}
            </h3>
            <p className="text-gray-400 dark:text-gray-500 max-w-md mx-auto mb-8">
              Be the first to write about this topic and share your insights with the community.
            </p>
            <button
              onClick={() => navigate("/create-blog")}
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg font-headline font-bold text-sm hover:opacity-80 transition-all active:scale-95"
            >
              Write an Article
            </button>
          </div>
        ) : (
          <>
            {/* ── Hero Card (first blog) ── */}
            {heroBlog && (
              <section className="py-8">
                <div
                  className="relative group overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                  onClick={() => navigate(`/blog/${heroBlog.id}`)}
                >
                  <div className="relative h-[340px] md:h-[400px]">
                    <img
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-80"
                      src={
                        heroBlog.coverImage ||
                        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000"
                      }
                      alt={heroBlog.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-indigo-600 px-3 py-1 rounded text-[10px] font-label uppercase tracking-widest font-bold">
                          #{tagName}
                        </span>
                        <span className="text-xs font-label text-gray-300">
                          {new Date(heroBlog.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-headline font-bold mb-3 leading-tight line-clamp-2">
                        {heroBlog.title}
                      </h2>
                      <p className="text-gray-300 font-body max-w-2xl mb-4 line-clamp-2">
                        {(heroBlog.summary || heroBlog.title || "").slice(0, 200)}...
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {heroBlog.author?.profilePicture ? (
                            <img
                              src={heroBlog.author.profilePicture}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border-2 border-white/20"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-white font-bold text-sm">
                              {(heroBlog.author?.name || heroBlog.author?.email || "A").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-label font-medium">
                            {heroBlog.author?.name || heroBlog.author?.email?.split("@")[0] || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                          <TagLikeButton blogId={heroBlog.id} />
                          <TagBookmarkButton blogId={heroBlog.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Editorial Feed ── */}
            {remainingBlogs.length > 0 && (
              <section className="py-8">
                <h3 className="text-[10px] font-label font-black uppercase tracking-[0.15em] text-gray-400 mb-8">
                  All articles in #{tagName}
                </h3>

                <div className="flex flex-col gap-14">
                  {remainingBlogs.map((blog, idx) => {
                    const displayName =
                      blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous";
                    return (
                      <article
                        key={blog.id}
                        className="grid grid-cols-12 gap-8 items-center group cursor-pointer rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                        onClick={() => navigate(`/blog/${blog.id}`)}
                      >
                        <div
                          className={`col-span-12 md:col-span-4 ${
                            idx % 2 !== 0 ? "md:order-last" : ""
                          } overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800`}
                        >
                          <img
                            className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
                            src={
                              blog.coverImage ||
                              "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800"
                            }
                            alt={blog.title}
                          />
                        </div>
                        <div
                          className={`col-span-12 md:col-span-8 flex flex-col gap-3 ${
                            idx % 2 !== 0 ? "md:text-right md:items-end" : ""
                          }`}
                        >
                          <div className="flex items-center gap-4 text-xs font-label uppercase tracking-widest text-gray-400">
                            <span>
                              {new Date(blog.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                            <span>{displayName}</span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-headline font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight line-clamp-2">
                            {blog.title}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 font-body leading-relaxed max-w-2xl line-clamp-2">
                            {(blog.summary || blog.title || "").slice(0, 200)}...
                          </p>
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(blog.tags || []).slice(0, 4).map((tag) => (
                              <button
                                key={tag.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/tags/${tag.name}`);
                                }}
                                className={`px-3 py-1 rounded-md text-[10px] font-label uppercase tracking-wider font-bold transition-colors ${
                                  tag.name.toLowerCase() === tagName?.toLowerCase()
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                }`}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                          {/* Actions */}
                          <div
                            className="flex items-center gap-3 mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TagLikeButton blogId={blog.id} />
                            <TagBookmarkButton blogId={blog.id} />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Related Tags ── */}
        {relatedTags.length > 0 && (
          <section className="py-10 mt-8 border-t border-gray-200/50 dark:border-gray-800/50">
            <h4 className="text-[10px] font-label font-black uppercase tracking-[0.15em] text-gray-400 mb-5">
              Explore more topics
            </h4>
            <div className="flex flex-wrap gap-3">
              {relatedTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => navigate(`/tags/${tag.name}`)}
                  className="group px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
                >
                  <span className="text-sm font-headline font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    #{tag.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{tag.count}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default TagBlogs;
