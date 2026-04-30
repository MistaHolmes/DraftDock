import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import {
  TrendingUp,
  Award,
  Timer,
  Star,
} from "lucide-react";
import { usePageCache } from "@/context/PageCacheContext";
import { PAGE_TTL } from "@/context/PageCacheContext";
import { AchievementGrid } from "@/components/social/AchievementGrid";

const API_URL = import.meta.env.VITE_API_URL;

// ── Dummy / placeholder data shown when API returns nothing ───────────────────
const DUMMY_VIEW_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  views: Math.round(12 + i * 3.5 + Math.sin(i * 0.7) * 8),
}));

const DUMMY_ENGAGEMENT = {
  totalViews: 0,
  engagementRate: 0,
  commentCount: 0,
  bookmarkCount: 0,
};

const DUMMY_GROWTH = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(Date.now() - (11 - i) * 30 * 86_400_000).toLocaleDateString("en-US", { month: "short" }),
  count: Math.round(i * 2 + Math.random() * 3),
}));

const DUMMY_COMPLETION = [
  { id: "demo-1", title: "Your first blog post will appear here", rate: 0 },
  { id: "demo-2", title: "Start writing to see retention analytics", rate: 0 },
  { id: "demo-3", title: "Publish three posts to unlock performance data", rate: 0 },
];

const DUMMY_BASIC_STATS = { publishedCount: 0, totalFollowers: 0 };
// ─────────────────────────────────────────────────────────────────────────────

const NewDashboardPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [basicStats, setBasicStats] = useState<any>(null);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [completion, setCompletion] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = usePageCache();

  useEffect(() => {
    const cached = cache.get("dashboard", PAGE_TTL.dashboard);
    if (cached) {
      setBasicStats(cached.basicStats);
      setViewHistory(cached.viewHistory);
      setEngagement(cached.engagement);
      setGrowth(cached.growth);
      setCompletion(cached.completion);
      setUserAchievements(cached.userAchievements);
      setAllAchievements(cached.allAchievements);
      setLoading(false);
      return;
    }
    const fetchAllData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [
          statsRes,
          viewsRes,
          engageRes,
          growthRes,
          completionRes,
          userAchRes,
          allAchRes,
        ] = await Promise.all([
          axios.get(`${API_URL}/api/user/stats`, { headers }),
          axios.get(`${API_URL}/api/analytics/views`, { headers }),
          axios.get(`${API_URL}/api/analytics/engagement`, { headers }),
          axios.get(`${API_URL}/api/analytics/follower-growth`, { headers }),
          axios.get(`${API_URL}/api/analytics/reading-completion`, { headers }),
          axios.get(`${API_URL}/api/achievements/user`, { headers }),
          axios.get(`${API_URL}/api/achievements/all`, { headers }),
        ]);
        const views = viewsRes.data.daily ?? [];
        const grw = growthRes.data.history ?? [];
        const comp = completionRes.data ?? [];
        setBasicStats(statsRes.data ?? DUMMY_BASIC_STATS);
        setViewHistory(views.length ? views : DUMMY_VIEW_HISTORY);
        setEngagement(engageRes.data ?? DUMMY_ENGAGEMENT);
        setGrowth(grw.length ? grw : DUMMY_GROWTH);
        setCompletion(comp.length ? comp : DUMMY_COMPLETION);
        setUserAchievements(userAchRes.data ?? []);
        setAllAchievements(allAchRes.data ?? []);
        cache.set("dashboard", {
          basicStats: statsRes.data ?? DUMMY_BASIC_STATS,
          viewHistory: views.length ? views : DUMMY_VIEW_HISTORY,
          engagement: engageRes.data ?? DUMMY_ENGAGEMENT,
          growth: grw.length ? grw : DUMMY_GROWTH,
          completion: comp.length ? comp : DUMMY_COMPLETION,
          userAchievements: userAchRes.data ?? [],
          allAchievements: allAchRes.data ?? [],
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        // Show dummy data so the UI is never completely empty
        setBasicStats(DUMMY_BASIC_STATS);
        setViewHistory(DUMMY_VIEW_HISTORY);
        setEngagement(DUMMY_ENGAGEMENT);
        setGrowth(DUMMY_GROWTH);
        setCompletion(DUMMY_COMPLETION);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const COLORS = ["#4c56af", "#006b5f", "#4d626c", "#737c7f", "#4049a2"];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard — DraftDock</title>
      </Helmet>

      <div className="px-8 md:px-12 py-8 max-w-6xl mx-auto">
        {/* Header - matching stitch dashboard */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 dark:text-white tracking-tight">
                Editorial Dashboard
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-body mt-2">
                Welcome back. Your technical insights are reaching new heights.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Timer size={16} />
                <span className="font-label font-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Insights Grid - Bento Style matching stitch */}
        <section className="grid grid-cols-12 gap-6 mb-12">
          {/* Main Metric: Total Views */}
          <div className="col-span-12 md:col-span-8 bg-white dark:bg-gray-900 rounded-xl p-8 flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200/80 dark:border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-gray-500 mb-1">
                  Total Audience Reach
                </p>
                <h3 className="text-5xl font-headline font-bold text-indigo-600 dark:text-indigo-400">
                  {engagement?.totalViews?.toLocaleString() || "0"}
                </h3>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingUp size={12} />+
                {engagement?.engagementRate || 0}%
              </div>
            </div>
            {/* Visual Chart */}
            <div className="mt-8">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={viewHistory}>
                  <defs>
                    <linearGradient
                      id="viewGradNew"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#4c56af"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#4c56af"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#4c56af"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#viewGradNew)"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e3e9ec",
                      boxShadow: "none",
                      fontSize: "12px",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary: Engagement Rate */}
          <div className="col-span-12 md:col-span-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-8 flex flex-col justify-between border-l-4 border-emerald-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-gray-500 mb-1">
                Engagement Rate
              </p>
              <h3 className="text-4xl font-headline font-bold text-gray-900 dark:text-white">
                {engagement?.engagementRate || 0}%
              </h3>
              <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1">
                <Star size={14} className="group-hover:rotate-12 transition-transform" />
                Above platform average
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
              <div className="flex justify-between text-xs font-label text-gray-500 mb-2">
                <span>Comments</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {engagement?.commentCount || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      ((engagement?.commentCount || 0) /
                        Math.max(engagement?.totalViews || 1, 1)) *
                        100 *
                        10,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-label text-gray-500 mt-4 mb-2">
                <span>Bookmarks</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {engagement?.bookmarkCount || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      ((engagement?.bookmarkCount || 0) /
                        Math.max(engagement?.totalViews || 1, 1)) *
                        100 *
                        10,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="col-span-12 md:col-span-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div>
              <Timer
                size={24}
                className="text-emerald-400 dark:text-emerald-600 mb-4"
              />
              <p className="font-label text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                Published Posts
              </p>
              <h3 className="text-4xl font-headline font-bold">
                {basicStats?.publishedCount || 0}
              </h3>
            </div>
            <div className="mt-6">
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 font-label">
                {basicStats?.totalFollowers || 0} followers trust your content
              </p>
            </div>
          </div>

          {/* Top Performing Posts */}
          <div className="col-span-12 md:col-span-8 bg-white dark:bg-gray-900 rounded-xl p-8 transition-all duration-300 hover:shadow-xl border border-gray-200/80 dark:border-gray-800">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-headline font-bold text-xl text-gray-900 dark:text-white">
                Top Performing Editorials
              </h4>
              <button
                onClick={() => navigate("/blogs")}
                className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-label text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-all"
              >
                View All
                <span className="ml-1">→</span>
              </button>
            </div>
            <div className="space-y-6">
              {completion.slice(0, 3).map((post: any, i: number) => (
                <div
                  key={post.id || i}
                  className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  <div className="flex gap-4 items-center">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold transition-transform group-hover:scale-110 duration-300 ${
                        i === 0
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h5 className="font-headline font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {post.title}
                      </h5>
                      <span className="text-xs text-gray-500 font-label">
                        {post.rate}% completion rate
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {completion.length === 0 && (
                <p className="text-center py-10 text-gray-400 italic">
                  Start writing to see performance data.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          {/* Retention */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200/80 dark:border-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-headline font-bold text-gray-900 dark:text-white">
                  Retention Analysis
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 font-label">
                  How many readers finish your stories
                </p>
              </div>
              <div className="space-y-5">
                {completion.map((blog: any, i: number) => (
                  <div key={blog.id || i} className="space-y-2">
                    <div className="flex justify-between text-sm items-end">
                      <span className="font-bold truncate max-w-[70%] font-headline tracking-tight text-gray-900 dark:text-white">
                        {blog.title}
                      </span>
                      <span className="text-gray-900 dark:text-gray-200 font-bold font-headline">
                        {blog.rate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${blog.rate}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
                {completion.length === 0 && (
                  <p className="text-center py-10 text-gray-400 italic">
                    Start writing to see retention data.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Follower Growth + Engagement Mix */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200/80 dark:border-gray-800">
              <h3 className="text-sm font-headline font-bold text-gray-900 dark:text-white mb-1">
                Community Growth
              </h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 font-label">
                Followers trend
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={growth}>
                  <Line
                    type="stepAfter"
                    dataKey="count"
                    stroke="#4c56af"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e3e9ec",
                      boxShadow: "none",
                      fontSize: "12px",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200/80 dark:border-gray-800">
              <h3 className="text-sm font-headline font-bold text-gray-900 dark:text-white mb-1">
                Engagement Mix
              </h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 font-label">
                Action breakdown
              </p>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Comments",
                          value: engagement?.commentCount || 0,
                        },
                        {
                          name: "Bookmarks",
                          value: engagement?.bookmarkCount || 0,
                        },
                      ]}
                      innerRadius={50}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(engagement ? [1, 2] : []).map((_: any, i: number) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-6 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-medium text-gray-500 font-label">
                      Comments
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="text-[10px] font-medium text-gray-500 font-label">
                      Bookmarks
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
              <Award size={18} />
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-gray-900 dark:text-white">
                Milestones
              </h2>
              <p className="text-xs text-gray-500 font-label">
                Your path to becoming a DraftDock elite
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200/80 dark:border-gray-800">
            <AchievementGrid
              achievements={userAchievements}
              allAchievements={allAchievements}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default NewDashboardPage;
