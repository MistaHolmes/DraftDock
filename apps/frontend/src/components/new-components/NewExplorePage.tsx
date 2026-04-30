import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Helmet } from "react-helmet-async";
import { Compass, Heart, Bookmark } from "lucide-react";
import BlogSkeleton from "@/components/BlogSkeleton";
import { usePageCache, PAGE_TTL } from "@/context/PageCacheContext";
import { useLike } from "@/context/LikeContext";
import { useBookmarks } from "@/context/BookmarkContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  summary?: string;
  likes: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  author: { email: string; name?: string };
  tags: { id: string; name: string }[];
}

interface TagItem {
  name: string;
  count: number;
}

const NewExplorePage = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Blog[]>([]);
  const [featured, setFeatured] = useState<Blog[]>([]);
  const [recent, setRecent] = useState<Blog[]>([]);
  const [, setPersonalized] = useState<Blog[]>([]);
  const [, setRecommendedAuthors] = useState<any[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "foryou">("trending");
  const { getToken, isSignedIn } = useAuth();
  const cache = usePageCache();

  useEffect(() => {
    const cacheKey = `explore:${isSignedIn}`;
    const cached = cache.get(cacheKey, PAGE_TTL.explore);
    if (cached) {
      setTrending(cached.trending);
      setFeatured(cached.featured);
      setRecent(cached.recent);
      setTags(cached.tags);
      if (cached.personalized) setPersonalized(cached.personalized);
      if (cached.recommendedAuthors) setRecommendedAuthors(cached.recommendedAuthors);
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      try {
        const [tRes, fRes, rRes, tagsRes] = await Promise.all([
          fetch(`${API_URL}/api/blogs/trending`),
          fetch(`${API_URL}/api/blogs/featured`),
          fetch(`${API_URL}/api/blogs`),
          fetch(`${API_URL}/api/tags/trending`),
        ]);
        const [tData, fData, rData, tagsData] = await Promise.all([
          tRes.json(),
          fRes.json(),
          rRes.json(),
          tagsRes.json(),
        ]);
        setTrending(Array.isArray(tData) ? tData : []);
        setFeatured(Array.isArray(fData) ? fData : []);
        setRecent(Array.isArray(rData) ? rData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);

        let pData: any[] = [];
        let aData: any[] = [];
        if (isSignedIn) {
          const token = await getToken();
          const [pRes, aRes] = await Promise.all([
            fetch(`${API_URL}/api/discovery/personalized-feed`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/api/discovery/recommended-authors`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          if (pRes.ok) {
            pData = await pRes.json();
            setPersonalized(pData);
          }
          if (aRes.ok) {
            aData = await aRes.json();
            setRecommendedAuthors(aData);
          }
          // don't automatically switch to 'foryou' — keep default as 'trending'
        }
        cache.set(cacheKey, {
          trending: Array.isArray(tData) ? tData : [],
          featured: Array.isArray(fData) ? fData : [],
          recent: Array.isArray(rData) ? rData : [],
          tags: Array.isArray(tagsData) ? tagsData : [],
          personalized: pData,
          recommendedAuthors: aData,
        });
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isSignedIn]);

  const featuredBlog = featured[0] || trending[0];
  // Trending = all blogs sorted by like count desc; For You = all blogs (newest first)
  const trendingByLikes = useMemo(
    () => [...recent].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)),
    [recent]
  );
  const displayBlogs = activeTab === "foryou" ? recent : trendingByLikes;

  // Typewriter + rotating words component
  const RotatingWords = ({ words, className }: { words: string[]; className?: string }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const [text, setText] = useState("");
    const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

    useEffect(() => {
      let timeout: ReturnType<typeof setTimeout>;
      const current = words[wordIndex];

      if (phase === "typing") {
        if (text.length < current.length) {
          timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), 80);
        } else {
          timeout = setTimeout(() => setPhase("pausing"), 700);
        }
      } else if (phase === "pausing") {
        timeout = setTimeout(() => setPhase("deleting"), 800 + Math.random() * 400);
      } else if (phase === "deleting") {
        if (text.length > 0) {
          timeout = setTimeout(() => setText(text.slice(0, text.length - 1)), 40);
        } else {
          setWordIndex((i) => (i + 1) % words.length);
          setPhase("typing");
        }
      }

      return () => clearTimeout(timeout);
    }, [text, phase, wordIndex, words]);

    return (
      <span className={className}>
        {text}
        <span className="ml-1 inline-block text-indigo-600 dark:text-indigo-400 animate-pulse">|</span>
      </span>
    );
  };

  // words for rotating typewriter
  const rotatingWords = ["Intelligence", "Insights", "Architectures", "Patterns", "Practices"];

  // Reusable like button for explore cards
  const ExploreLikeButton = ({ blogId }: { blogId: string }) => {
    const { likes, liked, toggle } = useLike(blogId);
    return (
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        aria-label="Like"
        aria-pressed={liked}
        className={`inline-flex items-center gap-2 p-2 rounded-md transition-colors ${
          liked
            ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <Heart size={18} className={liked ? "fill-rose-500" : ""} />
        <span className="text-xs font-label text-gray-600 dark:text-gray-400">{likes}</span>
      </button>
    );
  };

  // Reusable bookmark button for explore cards
  const ExploreBookmarkButton = ({ blogId }: { blogId: string }) => {
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
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <Bookmark size={18} className={bookmarked ? "fill-blue-500" : ""} />
      </button>
    );
  };

  // Newsletter dialog visibility (persist per session)
  const [showNewsletter, setShowNewsletter] = useState<boolean>(false);
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("dd_newsletter_dismissed");
      setShowNewsletter(!dismissed);
    } catch (e) {
      setShowNewsletter(true);
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Explore | DraftDock</title>
      </Helmet>

      <div className="px-8 md:px-12 min-h-screen">
        {/* Hero Header - matching stitch explore */}
        <header className="pt-12 pb-8">
          <h2 className="text-4xl md:text-[3.5rem] font-bold font-headline tracking-tighter leading-none text-gray-900 dark:text-white mb-4">
            Explore{" "}
            <RotatingWords words={rotatingWords} className="text-indigo-600 dark:text-indigo-400 italic" />
            .
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 border-b border-gray-200/50 dark:border-gray-800/50 pb-6">
            <p className="text-gray-500 dark:text-gray-400 max-w-xl font-body">
              Curated technical insights from the world's leading engineers.
              Dive into deep-dives that define the next decade of tech.
            </p>
            <div className="flex gap-2 ml-auto flex-wrap">
              {tags.slice(0, 4).map((tag, i) => (
                <button
                  key={tag.name}
                  onClick={() => navigate(`/tags/${tag.name}`)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-label uppercase tracking-wider font-bold transition-colors ${
                    i === 0
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Bento Grid - matching stitch */}
        <section className="py-8 grid grid-cols-12 gap-6 auto-rows-[280px]">
          {/* Featured Post (Large) */}
          {featuredBlog && (
            <div
              className="col-span-12 md:col-span-8 row-span-2 group relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm cursor-pointer"
              onClick={() => navigate(`/blog/${featuredBlog.id}`)}
            >
              <img
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-80"
                src={
                  featuredBlog.coverImage ||
                  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000"
                }
                alt={featuredBlog.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 p-8 md:p-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-600 px-3 py-1 rounded text-[10px] font-label uppercase tracking-widest font-bold">
                    Editor's Choice
                  </span>
                  <span className="text-xs font-label text-gray-300">
                    {Math.ceil(
                      (featuredBlog.summary || featuredBlog.title || "").length / 200
                    ) || 1}{" "}
                    min read
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-headline font-bold mb-4 leading-tight">
                  {featuredBlog.title}
                </h3>
                <p className="text-gray-300 font-body max-w-lg mb-4 line-clamp-2">
                  {(featuredBlog.summary || featuredBlog.title || "").slice(0, 150)}
                  ...
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center text-white font-bold text-sm">
                    {(
                      featuredBlog.author?.name ||
                      featuredBlog.author?.email ||
                      "A"
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm font-label font-medium">
                    {featuredBlog.author?.name ||
                      featuredBlog.author?.email?.split("@")[0] ||
                      "Anonymous"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Side Cards */}
          {trending.slice(1, 3).map((blog, i) => (
            <div
              key={blog.id}
              className={`col-span-12 md:col-span-4 row-span-1 ${
                i === 0
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-800 dark:bg-indigo-900"
              } p-6 md:p-8 flex flex-col justify-between rounded-xl group hover:shadow-lg transition-all cursor-pointer border border-gray-200/80 dark:border-gray-800`}
              onClick={() => navigate(`/blog/${blog.id}`)}
            >
              <div>
                <span
                  className={`text-[10px] font-label font-bold uppercase tracking-widest mb-2 block ${
                    i === 0
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-300"
                  }`}
                >
                  {(blog.tags || [])[0]?.name || "Tech"}
                </span>
                <h4
                  className={`text-xl font-headline font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                    i === 0
                      ? "text-gray-900 dark:text-white"
                      : "text-white"
                  }`}
                >
                  {blog.title}
                </h4>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span
                  className={`text-xs font-label ${
                    i === 0
                      ? "text-gray-500 dark:text-gray-400"
                      : "text-gray-300"
                  }`}
                >
                  by{" "}
                  {blog.author?.name ||
                    blog.author?.email?.split("@")[0] ||
                    "Anonymous"}
                </span>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Editorial Feed */}
        <section className="py-12">
          <div className="flex items-center gap-8 mb-12 border-b border-gray-200 dark:border-gray-800 pb-4">
            <button
              onClick={() => setActiveTab("trending")}
              className={`font-headline text-2xl font-bold transition-all ${
                activeTab === "trending"
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 opacity-60 hover:opacity-100"
              }`}
            >
              Trending
            </button>
            {isSignedIn && (
              <button
                onClick={() => setActiveTab("foryou")}
                className={`font-headline text-2xl font-bold transition-all flex items-center gap-2 ${
                  activeTab === "foryou"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 opacity-60 hover:opacity-100"
                }`}
              >
                For You
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-12 py-6">
              {/* Hero skeleton */}
              <header className="pt-12 pb-8">
                <div className="h-12 md:h-20 w-2/3 bg-gray-200 dark:bg-[rgba(255,255,255,0.06)] rounded-md animate-pulse" />
                <div className="mt-4 space-y-3 max-w-2xl">
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
                </div>
              </header>

              {/* Bento grid skeleton */}
              <section className="py-8 grid grid-cols-12 gap-6 auto-rows-[280px]">
                <div className="col-span-12 md:col-span-8 row-span-2 rounded-xl bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] animate-pulse" />
                <div className="col-span-12 md:col-span-4 row-span-1 rounded-xl bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] animate-pulse" />
                <div className="col-span-12 md:col-span-4 row-span-1 rounded-xl bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] animate-pulse" />
              </section>

              {/* Editorial feed skeletons */}
              <section className="py-12 space-y-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full">
                    <BlogSkeleton variant="large" />
                  </div>
                ))}
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-16">
              {displayBlogs.map((blog, idx) => (
                <motion.article
                  key={blog.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.05 }}
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
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>
                        {(blog.tags || [])[0]?.name || "General"}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-headline font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight">
                      {blog.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 font-body leading-relaxed max-w-2xl line-clamp-2">
                      {(blog.summary || blog.title || "").slice(0, 200)}
                      ...
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <ExploreLikeButton blogId={blog.id} />
                      <ExploreBookmarkButton blogId={blog.id} />
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {displayBlogs.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-400">
              <Compass
                className="mx-auto mb-4 opacity-30"
                size={48}
              />
              <p className="text-lg">Nothing to explore yet.</p>
            </div>
          )}
        </section>

        {/* Newsletter dialog (dismissible for the session) */}
        {showNewsletter && (
          <div className="fixed bottom-8 right-8 z-50 w-full max-w-2xl px-4">
            <div className="relative bg-white dark:bg-[var(--card)] text-gray-900 dark:text-[var(--card-foreground)] rounded-xl shadow-2xl border border-gray-200 dark:border-[var(--sidebar-border)] p-6">
              <button
                aria-label="Close newsletter"
                onClick={() => {
                  try { sessionStorage.setItem('dd_newsletter_dismissed', '1'); } catch (e) {}
                  setShowNewsletter(false);
                }}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row items-stretch gap-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-headline font-bold mb-2">Stay synchronized.</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Weekly technical deep-dives and architectural blueprints delivered directly to your inbox. No fluff, just signal.</p>
                  <div className="flex gap-2">
                    <input
                      className="bg-white dark:bg-[var(--card)] border border-gray-200 dark:border-[var(--sidebar-border)] rounded-lg px-4 py-2 flex-1 min-w-0 focus:ring-2 focus:ring-indigo-500/20 text-sm font-label focus:outline-none"
                      placeholder="engineer@domain.com"
                      type="email"
                    />
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Subscribe</button>
                  </div>
                </div>

                <div className="w-full md:w-64 grid grid-cols-2 gap-3 items-stretch">
                  {[
                    { label: "Contributors", value: "12k+" },
                    { label: "Daily Posts", value: "450" },
                    { label: "Monthly Readers", value: "8.4m" },
                    { label: "Signal Ratio", value: "99.9" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-gray-50 dark:bg-[rgba(255,255,255,0.02)] rounded-lg text-center border border-gray-100 dark:border-[var(--sidebar-border)] flex flex-col justify-center">
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stat.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default NewExplorePage;
