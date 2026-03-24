import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import BlogList from "@/components/BlogList";
import BlogSkeleton from "@/components/BlogSkeleton";
import { Footer } from "@/components/Footer";
import Header from "@/components/ui/header";
import { useBlogCache } from "@/context/BlogCacheContext";
// Define the Blog type
interface Blog {
  id: string;
  title: string;
  summary: string;
  label?: string;
  author: string;
  authorId: string;
  published: string;
  isPublished: boolean;
  image?: string;
  tags?: string[];
}

const Blogs: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const initialTab = (searchParams.get("tab") as "all" | "drafts" | "published") || "all";
  const [filter, setFilter] = useState<"all" | "drafts" | "published">(initialTab);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const { dashboardBlogs, setDashboardBlogs } = useBlogCache();
  
  const hasFetchedAllBlogs = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || hasFetchedAllBlogs.current) return;
    hasFetchedAllBlogs.current = true;

    if (dashboardBlogs) {
      setAllBlogs(dashboardBlogs);
      setFilteredBlogs(dashboardBlogs);
      setLoading(false);
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;
    const authorName = user.primaryEmailAddress?.emailAddress 
      ? user.primaryEmailAddress.emailAddress.split("@")[0].replace(/^./, c => c.toUpperCase())
      : "DraftDock User";

    const fetchDashboardFeeds = async () => {
      try {
        const token = await (window as any).Clerk?.session?.getToken();
        
        // Fetch global published posts and user's personal posts
        const [globalRes, userRes] = await Promise.all([
          axios.get(`${API_URL}/api/blogs`),
          token ? axios.get(`${API_URL}/api/user/blogs/all`, { 
            headers: { Authorization: `Bearer ${token}` }
          }) : Promise.resolve({ data: { blogs: [] } })
        ]);

        const globalBlogs = globalRes.data || [];
        const userBlogs = userRes.data.blogs || [];

        // Merge and deduplicate by ID
        const blogMap = new Map();
        
        const mapBlogData = (b: any, isGlobal: boolean) => {
          if (!blogMap.has(b.id)) {
            const rawContent = b.content || "";
            // Remove image markdown completely
            let cleanContent = rawContent.replace(/!\[.*?\]\(.*?\)/g, "");
            // Replace links with just their text
            cleanContent = cleanContent.replace(/\[(.*?)\]\(.*?\)/g, "$1");
            // Remove markdown heading characters
            cleanContent = cleanContent.replace(/#{1,6}\s?/g, "");
            cleanContent = cleanContent.trim();

            blogMap.set(b.id, {
              id: b.id,
              title: b.title || "Untitled Draft",
              summary: cleanContent ? cleanContent.slice(0, 150) + "..." : "Start writing your next big article...",
              content: b.content,
              author: isGlobal && b.author?.email ? b.author.email.split("@")[0].replace(/^./, (c: string) => c.toUpperCase()) : authorName,
              authorId: b.authorId,
              updatedAt: new Date(b.updatedAt),
              published: b.published ? new Date(b.createdAt).toLocaleDateString() : "Draft",
              isPublished: b.published,
              tags: b.tags || [],
            });
          }
        };

        globalBlogs.forEach((b: any) => mapBlogData(b, true));
        userBlogs.forEach((b: any) => mapBlogData(b, false));

        const fetchedBlogs = Array.from(blogMap.values())
          .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());

        setAllBlogs(fetchedBlogs);
        setFilteredBlogs(fetchedBlogs);
        setDashboardBlogs(fetchedBlogs);
      } catch (err) {
        console.error("Error fetching dashboard feeds:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardFeeds();
  }, [user, isLoaded, dashboardBlogs, setDashboardBlogs]);

  // Filter blogs when searchTerm or filter changes
  useEffect(() => {
    const lowercaseSearchTerm = searchTerm.trim().toLowerCase();
    
    const filtered = allBlogs.filter(blog => {
      // 1. Text filter
      const matchesSearch = !lowercaseSearchTerm || 
        blog.title.toLowerCase().includes(lowercaseSearchTerm) ||
        blog.summary.toLowerCase().includes(lowercaseSearchTerm);
        
      // 2. Status filter
      let matchesStatus = true;
      if (filter === "drafts") matchesStatus = blog.isPublished === false;
      if (filter === "published") matchesStatus = blog.isPublished === true;
      
      return matchesSearch && matchesStatus;
    });

    setFilteredBlogs(filtered);
  }, [searchTerm, filter, allBlogs]);

  return (
    <div className="bg-surface font-body text-on-surface blueprint-grid min-h-screen flex flex-col">
      <Header />          
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto w-full flex-1">
        {/* Hero Header */}
        <header className="mb-16">
          <h1 className="text-6xl font-bold font-headline tracking-tighter text-primary mb-2">Dashboard</h1>
          <p className="text-on-surface-variant text-lg tracking-tight">Manage your technical drafts and published insights.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Content */}
          <div className="lg:col-span-8">
            {/* Search and Filter Bar */}
            <div className="mb-10 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-none outline outline-variant/15 focus:outline-primary transition-all rounded-md" 
                  placeholder="Search your articles..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-surface-container-high p-1 rounded-md w-full md:w-auto">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm transition-colors rounded-sm ${filter === 'all' ? 'font-bold bg-surface-container-lowest shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'}`}
                >
                  All Posts
                </button>
                <button 
                  onClick={() => setFilter('drafts')}
                  className={`px-4 py-2 text-sm transition-colors rounded-sm ${filter === 'drafts' ? 'font-bold bg-surface-container-lowest shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'}`}
                >
                  Drafts
                </button>
                <button 
                  onClick={() => setFilter('published')}
                  className={`px-4 py-2 text-sm transition-colors rounded-sm ${filter === 'published' ? 'font-bold bg-surface-container-lowest shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'}`}
                >
                  Published
                </button>
              </div>
            </div>

            {/* Blog Post List */}
            <div className="space-y-12">
              {loading ? (
                <div className="space-y-12">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <BlogSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <BlogList posts={filteredBlogs} />
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Draft Insights */}
            <section className="bg-surface-container-lowest p-6 rounded-xl outline outline-variant/15">
              <h3 className="text-sm font-bold uppercase tracking-widest font-headline mb-6">Draft Insights</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-medium text-on-surface-variant font-label mb-1">Total Views</p>
                    <p className="text-3xl font-bold font-headline tracking-tighter">42.8k</p>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-600/10 px-2 py-1 rounded-sm">+12%</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-medium text-on-surface-variant font-label mb-1">Avg. Read Time</p>
                    <p className="text-3xl font-bold font-headline tracking-tighter">4m 12s</p>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-medium text-on-surface-variant font-label mb-1">Subscribers</p>
                    <p className="text-3xl font-bold font-headline tracking-tighter">1,248</p>
                  </div>
                  <span className="material-symbols-outlined text-green-600">trending_up</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-surface-container-high">
                <button className="w-full text-center py-2 text-sm font-bold font-headline hover:bg-surface-container-low transition-colors rounded-md">View detailed analytics</button>
              </div>
            </section>

            {/* Support Section */}
            <section className="bg-secondary text-on-secondary p-8 rounded-xl shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold font-headline tracking-tight mb-2">Fuel the Writer</h3>
                <p className="text-on-secondary/80 text-sm mb-6 font-body leading-relaxed">Your support helps keep the technical deep-dives coming. No ads, just code.</p>
                <a href="https://buymeacoffee.com/abhash" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-secondary-fixed text-on-secondary-fixed py-3 rounded-md font-bold font-headline tracking-tight hover:opacity-90 transition-opacity">
                  Support the Dock
                </a>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl opacity-10 pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
            </section>

            {/* Quick Actions / Metadata */}
            <section className="bg-surface-container-high/50 p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest font-headline mb-4">Drafting Palette</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-md outline outline-variant/15">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  <span className="text-sm font-medium">Continue: 'The Future of WASM'</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-md outline outline-variant/15">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <span className="text-sm font-medium">Scheduled: 'API Security'</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blogs;