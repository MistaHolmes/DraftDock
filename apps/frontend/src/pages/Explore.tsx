import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";
import { usePageCache } from "@/context/PageCacheContext";
import { LikeContext } from "@/context/LikeContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  likes: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  author: { id?: string; email: string; name?: string; profilePicture?: string };
  tags: { id: string; name: string }[];
}

interface TagItem {
  name: string;
  count: number;
}

import { AppShell } from "@/components/layout/AppShell";
import FooterNewsletter from "@/components/FooterNewsletter";

const Explore = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Blog[]>([]);
  const [featured, setFeatured] = useState<Blog[]>([]);
  const [recent, setRecent] = useState<Blog[]>([]);
  const [personalized, setPersonalized] = useState<Blog[]>([]);
  const [recommendedAuthors, setRecommendedAuthors] = useState<any[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'foryou'>('trending');
  const { getToken, isSignedIn } = useAuth();
  const cache = usePageCache();
  const likeCtx = useContext(LikeContext);

  useEffect(() => {
    const cacheKey = `explore:${isSignedIn}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      setTrending(cached.trending);
      setFeatured(cached.featured);
      setRecent(cached.recent);
      setTags(cached.tags);
      if (cached.personalized) setPersonalized(cached.personalized);
      if (cached.recommendedAuthors) setRecommendedAuthors(cached.recommendedAuthors);
      if (isSignedIn) setActiveTab('foryou');
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
          tRes.json(), fRes.json(), rRes.json(), tagsRes.json(),
        ]);
        setTrending(Array.isArray(tData) ? tData : []);
        setFeatured(Array.isArray(fData) ? fData : []);
        setRecent(Array.isArray(rData) ? rData.slice(0, 9) : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);

        let pData: any[] = [];
        let aData: any[] = [];

        if (isSignedIn) {
          const token = await getToken();
          const [pRes, aRes] = await Promise.all([
            fetch(`${API_URL}/api/discovery/personalized-feed`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/api/discovery/recommended-authors`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          if (pRes.ok) { pData = await pRes.json(); setPersonalized(pData); }
          if (aRes.ok) { aData = await aRes.json(); setRecommendedAuthors(aData); }
          setActiveTab('foryou');
        }

        cache.set(cacheKey, {
          trending: Array.isArray(tData) ? tData : [],
          featured: Array.isArray(fData) ? fData : [],
          recent: Array.isArray(rData) ? rData.slice(0, 9) : [],
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

  // Subscribe to like updates for trending blogs so we can keep the list sorted
  useEffect(() => {
    if (!likeCtx) return;
    if (!trending || trending.length === 0) return;

    const unsubscribers: Array<() => void> = [];

    trending.forEach((b) => {
      // Kick off fetch for fresh like counts (won't clobber optimistic toggles)
      likeCtx.fetchLikeState(b.id).catch(() => {});

      // Subscribe to updates for this blog
      const unsub = likeCtx.subscribe(b.id, () => {
        const s = likeCtx.getLikeState(b.id);
        if (!s) return;
        setTrending((prev) => {
          const found = prev.find((p) => p.id === b.id);
          if (!found) return prev;
          const updated = prev.map((p) => (p.id === b.id ? { ...p, likes: s.likes } : p));
          // Keep highest likes first
          return [...updated].sort((x, y) => (y.likes ?? 0) - (x.likes ?? 0));
        });
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((u) => u());
  }, [trending, likeCtx]);

  const featuredBlog = featured[0] || trending[0];

  return (
    <AppShell activePage="explore">
      <Helmet>
        <title>Explore | DraftDock</title>
        <meta name="description" content="Discover trending, featured, and recent blogs on DraftDock." />
      </Helmet>

      {/* Hero Section */}
      <section className="mb-20">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-end">
          <div className="xl:col-span-12 mb-8 xl:mb-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-headline text-6xl md:text-7xl font-medium tracking-tight leading-[0.9] mb-8"
            >
              Explore.<br />Discover what people are talking about.
            </motion.h1>
          </div>

          {featuredBlog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate(`/blog/${featuredBlog.id}`)}
              className="xl:col-span-12 relative group cursor-pointer overflow-hidden rounded-3xl"
            >
              <div className="aspect-[21/9] w-full bg-stitch-surface-container-high overflow-hidden">
                <img
                  alt={featuredBlog.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={featuredBlog.coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000"}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12 text-white">
                <span className="font-label text-xs uppercase tracking-widest mb-4 opacity-80">Featured Draft</span>
                <h2 className="font-headline text-3xl md:text-5xl font-semibold mb-6 max-w-4xl leading-tight">
                  {featuredBlog.title}
                </h2>
                  <div className="flex items-center gap-6">
                    <div
                      className="flex items-center gap-3 cursor-pointer group/author"
                      onClick={(e) => { e.stopPropagation(); navigate(`/author/${featuredBlog.author?.id || featuredBlog.authorId}`); }}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover/author:scale-110 group-hover/author:ring-2 group-hover/author:ring-violet-400 group-hover/author:shadow-lg group-hover/author:shadow-violet-500/30">
                        <img
                          src={featuredBlog.author?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${featuredBlog.author?.email}`}
                          alt={featuredBlog.author?.name || 'Author'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-label text-sm font-medium group-hover/author:text-violet-300 transition-colors duration-200">
                        {featuredBlog.author?.name || featuredBlog.author?.email?.split('@')[0] || 'Anonymous'}
                      </span>
                    </div>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span className="font-label text-sm opacity-80">
                    {Math.ceil((featuredBlog.content || "").length / 1000) || 1} min read
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Trending Topics (Horizontal Scroll) */}
      {tags.length > 0 && (
        <section className="mb-24">
          <div className="mb-8 flex justify-between items-end">
            <h3 className="font-headline text-3xl font-bold tracking-tight text-stitch-on-surface">Trending Topics</h3>
            <button onClick={() => navigate('/tags')} className="font-label text-sm font-semibold border-b border-stitch-on-surface pb-1 hover:opacity-60 transition-opacity">
              View all tags
            </button>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-4 scroll-smooth">
            {tags.map((tag, idx) => (
              <motion.div
                key={tag.name}
                onClick={() => navigate(`/tags/${tag.name}`)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="flex-none w-64 aspect-square bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-4xl group-hover:text-white text-stitch-on-surface" data-icon={idx % 4 === 0 ? "memory" : idx % 4 === 1 ? "palette" : idx % 4 === 2 ? "smart_toy" : "spa"}>
                  {idx % 4 === 0 ? "memory" : idx % 4 === 1 ? "palette" : idx % 4 === 2 ? "smart_toy" : "spa"}
                </span>
                <div>
                  <span className="font-headline text-2xl font-medium group-hover:text-white text-stitch-on-surface block">{tag.name}</span>
                  <span className="font-label text-xs text-stitch-secondary group-hover:text-white/70">{tag.count} blog{tag.count !== 1 ? "s" : ""}</span>
                </div>
              </motion.div>
            ))}
            </div>
        </section>
      )}

      {/* Discovery Section */}
      <section>
        <div className="flex items-center justify-between mb-12 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex gap-8">
             <button
               onClick={() => setActiveTab('trending')}
               className={`font-headline text-3xl font-bold transition-all ${activeTab === 'trending' ? 'text-gray-900 dark:text-white' : 'text-gray-400 opacity-60 hover:opacity-100'}`}
             >
               Trending
             </button>
             {isSignedIn && (
               <button
                 onClick={() => setActiveTab('foryou')}
                 className={`font-headline text-3xl font-bold transition-all flex items-center gap-2 ${activeTab === 'foryou' ? 'text-gray-900 dark:text-white' : 'text-gray-400 opacity-60 hover:opacity-100'}`}
               >
                 For You
                 <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
             {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
             ) : (
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ when: "beforeChildren" }}
                   className="grid grid-cols-1 md:grid-cols-2 gap-y-16 gap-x-10"
                 >
                   {(activeTab === 'foryou' ? personalized : recent).map((blog, idx) => (
                    <motion.article
                      key={blog.id}
                      className="flex flex-col group cursor-pointer"
                      onClick={() => navigate(`/blog/${blog.id}`)}
                      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ translateY: -6 }}
                    >
                    <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-800 mb-6 overflow-hidden rounded-2xl">
                      <img
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={blog.coverImage || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800"}
                      />
                    </div>
                    <div className="flex gap-2 mb-4">
                      {(blog.tags || []).slice(0, 2).map(t => (
                        <span key={t.id} className="font-label text-[10px] uppercase tracking-widest px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md font-bold">
                          {t.name}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-headline text-2xl font-bold mb-4 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors text-gray-900 dark:text-white">
                      {blog.title || "Untitled Draft"}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 font-body line-clamp-2 mb-6 leading-relaxed">
                      {(blog.content || "").replace(/[#*`>\[\]]/g, "").slice(0, 150)}...
                    </p>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                      <span
                        className="font-label text-sm text-gray-500 font-medium hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors duration-200"
                        onClick={(e) => { e.stopPropagation(); navigate(`/author/${blog.author?.id || blog.authorId}`); }}
                      >
                        By {blog.author?.name || blog.author?.email?.split('@')[0] || 'Anonymous'}
                      </span>
                      <button className="font-label text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform text-gray-900 dark:text-white">
                        Read Story <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </motion.article>
                 ))}
                 </motion.div>
               </AnimatePresence>
             )}

             {recent.length === 0 && !loading && (
               <div className="text-center py-20 text-gray-400">
                  <p className="text-lg">Nothing to explore yet. Start writing!</p>
               </div>
             )}

             <div className="flex justify-center mt-20">
               <button className="px-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-label font-bold text-sm tracking-tight rounded-xl text-gray-900 dark:text-white shadow-sm">
                 Load more stories
               </button>
             </div>
          </div>

          {/* Sidebar / Right Panel */}
          <div className="lg:col-span-1 border-l border-gray-100 dark:border-gray-800 pl-8 hidden lg:block">
             <div className="sticky top-28 space-y-12">
                {recommendedAuthors.length > 0 && (
                  <div className="space-y-6">
                     <h4 className="font-headline text-sm font-black uppercase tracking-widest text-gray-400">Writers to Follow</h4>
                     <div className="space-y-6">
                        {recommendedAuthors.map((author) => (
                           <div key={author.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate(`/author/${author.id}`)}>
                              <div className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-violet-500 overflow-hidden transition-all">
                                 <img
                                   src={author.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.email}`}
                                   alt={author.name}
                                   className="w-full h-full object-cover"
                                 />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-1">
                                    <h5 className="font-headline text-sm font-bold truncate group-hover:text-violet-600 transition-colors">{author.name}</h5>
                                    {author.isVerified && <span className="material-symbols-outlined text-[14px] text-blue-500 fill-blue-500">verified</span>}
                                 </div>
                                 <p className="font-body text-xs text-gray-500 line-clamp-1 mt-0.5">{author.bio || `Level ${author.writerLevel} Writer`}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="p-8 bg-black rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Compass size={80} strokeWidth={1} />
                   </div>
                   <h4 className="font-headline text-2xl font-bold mb-4 relative z-10">Premium Access</h4>
                   <p className="font-body text-sm opacity-70 mb-8 relative z-10 leading-relaxed">Unlock exclusive drafts, early access to features, and custom themes.</p>
                   <button className="w-full py-4 bg-white text-black font-label font-bold text-xs uppercase rounded-xl shadow-lg hover:bg-violet-500 hover:text-white transition-all relative z-10">Upgrade to Elite</button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA above site footer */}
      <FooterNewsletter />
    </AppShell>
  );
};

export default Explore;

