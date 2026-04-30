import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewHeader } from "./NewHeader";
import { NewSidebar } from "./NewSidebar";
import { Footer } from "../Footer";
import { Zap } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface TrendingBlog {
  id: string;
  title: string;
  summary?: string;
  author: { name?: string; email: string };
  likes: number;
  createdAt: string;
}

const RightPanel: React.FC = () => {
  const navigate = useNavigate();
  const [trendingBlogs, setTrendingBlogs] = useState<TrendingBlog[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/blogs/trending`)
      .then((r) => r.json())
      .then((data) => {
        // show only top 3 trending items in the right panel
        setTrendingBlogs(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(() => setTrendingBlogs([]))
      .finally(() => setLoadingTrending(false));
  }, []);

  // Push AdSense ad after first render
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (_) {}
  }, []);

  return (
    <div className="space-y-8">
      {/* Upgrade to Dock Elite */}
      <div className="p-6 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl text-white shadow-xl shadow-violet-200/30 dark:shadow-none">
        <h4 className="font-headline text-xl font-bold mb-2">Upgrade to Dock Elite</h4>
        <p className="font-body text-xs opacity-90 mb-6 leading-relaxed">
          Early access to premium drafts, and help build the future of the Dock.
        </p>
        <button
          onClick={() => navigate("/pricing")}
          className="w-full py-3 bg-white text-violet-600 font-label font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <Zap size={13} />
          View Plans
        </button>
      </div>

      {/* Trending on DraftDock */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">
          Trending on DraftDock
        </h5>
        {loadingTrending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-6 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : trendingBlogs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No trending posts yet.</p>
        ) : (
          <div className="space-y-4">
            {trendingBlogs.map((blog, i) => (
              <button
                key={blog.id}
                onClick={() => navigate(`/blog/${blog.id}`)}
                className="flex gap-3 w-full text-left group hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl p-2 -mx-2 transition-colors"
              >
                <span className="text-2xl font-bold text-gray-200 dark:text-gray-700 leading-none select-none flex-shrink-0">
                  0{i + 1}
                </span>
                <div className="min-w-0">
                  <h6 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {blog.title}
                  </h6>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                    {blog.author?.name || blog.author?.email?.split("@")[0] || "Anonymous"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Google AdSense */}
      <div className="rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <p className="text-[9px] font-label uppercase tracking-widest text-gray-300 dark:text-gray-700 text-center pt-3 pb-1 select-none">
          Advertisement
        </p>
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client="ca-pub-1708287984162194"
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

interface NewAppShellProps {
  children: React.ReactNode;
  activePage?: string;
  hideSidebar?: boolean;
  hideRightPanel?: boolean;
  hideFooter?: boolean;
  rightPanelContent?: React.ReactNode;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  showSearch?: boolean;
}

export const NewAppShell: React.FC<NewAppShellProps> = ({
  children,
  activePage,
  hideSidebar = false,
  hideRightPanel = false,
  hideFooter = false,
  rightPanelContent,
  searchTerm,
  setSearchTerm,
  showSearch = true,
}) => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex flex-col font-body">
      {/* Fixed Header */}
      <NewHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearch}
      />

      {/* Body: Sidebar + Main + Right Panel */}
      <div className="flex flex-1 pt-[4.5rem]">
        {/* Left Sidebar */}
        {!hideSidebar && (
          <div className="hidden md:block flex-shrink-0">
            <NewSidebar activePage={activePage} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-4.5rem)]">
          <div className="flex-1">{children}</div>
        </main>

        {/* Right Sidebar / Panel */}
        {!hideRightPanel && (
          <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-[4.5rem] h-[calc(100vh-4.5rem)] overflow-y-auto border-l border-gray-200/80 dark:border-gray-800/80 p-6 bg-white/50 dark:bg-gray-950/50">
            {rightPanelContent || <RightPanel />}
          </aside>
        )}
      </div>

      {/* Mobile Sidebar */}
      {!hideSidebar && (
        <div className="md:hidden">
          <NewSidebar activePage={activePage} />
        </div>
      )}

      {/* Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
};

export default NewAppShell;
