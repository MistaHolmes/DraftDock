
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie } from "recharts";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { BarChart2, FileText, Trophy, Users, TrendingUp, CheckCircle, Zap, Award } from "lucide-react";
import { usePageCache } from "@/context/PageCacheContext";
import { AchievementGrid } from "@/components/social/AchievementGrid";

const API_URL = import.meta.env.VITE_API_URL;





const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // States for different analytics modules
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
    const cached = cache.get('dashboard');
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

        const [statsRes, viewsRes, engageRes, growthRes, completionRes, userAchRes, allAchRes] = await Promise.all([
          axios.get(`${API_URL}/api/user/stats`, { headers }),
          axios.get(`${API_URL}/api/analytics/views`, { headers }),
          axios.get(`${API_URL}/api/analytics/engagement`, { headers }),
          axios.get(`${API_URL}/api/analytics/follower-growth`, { headers }),
          axios.get(`${API_URL}/api/analytics/reading-completion`, { headers }),
          axios.get(`${API_URL}/api/achievements/user`, { headers }),
          axios.get(`${API_URL}/api/achievements/all`, { headers }),
        ]);

        setBasicStats(statsRes.data);
        setViewHistory(viewsRes.data.daily);
        setEngagement(engageRes.data);
        setGrowth(growthRes.data.history);
        setCompletion(completionRes.data);
        setUserAchievements(userAchRes.data);
        setAllAchievements(allAchRes.data);

        cache.set('dashboard', {
          basicStats: statsRes.data,
          viewHistory: viewsRes.data.daily,
          engagement: engageRes.data,
          growth: growthRes.data.history,
          completion: completionRes.data,
          userAchievements: userAchRes.data,
          allAchievements: allAchRes.data,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const COLORS = ['#000000', '#785900', '#3b3b3b', '#777777', '#474747'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard — DraftDock</title>
      </Helmet>

      <div className="max-w-7xl mx-auto py-8 px-4 relative z-[1]">
        {/* Hero Header — DraftDock style */}
        <header className="mb-16">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold tracking-tight mb-3">
            <TrendingUp size={16} />
            <span className="uppercase text-[10px] tracking-widest font-label">Analytics Overview</span>
          </motion.div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-6xl font-bold font-headline tracking-tighter text-gray-900 dark:text-white">Dashboard</h1>
            <button onClick={() => navigate('/create-blog')} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-md font-headline font-bold transition-all hover:opacity-90 active:scale-95 flex items-center gap-2 w-fit">
              <Zap size={16} /> New Story
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg tracking-tight mt-2">Manage your technical drafts and published insights.</p>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           <MetricCard title="Total Views" value={engagement?.totalViews || 0} icon={<BarChart2 size={18} />} index={0} />
           <MetricCard title="Engagement" value={`${engagement?.engagementRate || 0}%`} icon={<TrendingUp size={18} />} index={1} />
           <MetricCard title="Followers" value={basicStats?.totalFollowers || 0} icon={<Users size={18} />} index={2} />
           <MetricCard title="Published" value={basicStats?.publishedCount || 0} icon={<FileText size={18} />} index={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Charts */}
          <div className="lg:col-span-8 space-y-12">
            {/* Views Chart */}
            <SectionCard title="Audience Reach" subtitle="Daily views — last 30 days">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={viewHistory}>
                  <defs>
                    <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#777777' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e1e3e4', boxShadow: 'none', fontFamily: 'Inter', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="views" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#viewGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* Retention */}
            <SectionCard title="Retention Analysis" subtitle="How many readers finish your stories">
               <div className="space-y-5 text-gray-900 dark:text-white">
                  {completion.map((blog, i) => (
                    <div key={blog.id} className="space-y-2">
                       <div className="flex justify-between text-sm items-end">
                          <span className="font-bold truncate max-w-[70%] font-headline tracking-tight">{blog.title}</span>
                          <span className="text-gray-900 dark:text-gray-200 font-bold font-headline">{blog.rate}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${blog.rate}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-gray-900 dark:bg-gray-200 rounded-full"
                          />
                       </div>
                    </div>
                  ))}
                  {completion.length === 0 && <p className="text-center py-10 text-gray-400 dark:text-gray-500 italic font-body">Start writing to see retention data.</p>}
               </div>
            </SectionCard>

            {/* Achievements */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                    <Award size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-bold text-gray-900 dark:text-white">Milestones</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-label">Your path to becoming a DraftDock elite</p>
                  </div>
               </div>
               <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200/80 dark:border-gray-800">
                  <AchievementGrid achievements={userAchievements} allAchievements={allAchievements} />
               </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-10">
             {/* Follower Growth */}
             <SectionCard title="Community Growth" subtitle="Followers trend">
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={growth}>
                    <Line type="stepAfter" dataKey="count" stroke="#000000" strokeWidth={2} dot={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e1e3e4', boxShadow: 'none', fontSize: '12px' }} />
                  </LineChart>
                </ResponsiveContainer>
             </SectionCard>

             {/* Engagement Mix */}
             <SectionCard title="Engagement Mix" subtitle="Action breakdown">
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Comments', value: engagement?.commentCount || 0 },
                          { name: 'Bookmarks', value: engagement?.bookmarkCount || 0 },
                        ]}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                      {(engagement ? [1,2] : []).map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-6 mt-2">
                      <LegendItem label="Comments" color="bg-primary" />
                      <LegendItem label="Saves" color="bg-secondary" />
                  </div>
                </div>
             </SectionCard>

             {/* Top Story */}
             {basicStats?.topBlog && (
                <div
                  className="bg-primary rounded-xl p-8 text-on-primary relative overflow-hidden group cursor-pointer transition-all hover:opacity-95 active:scale-[0.99]"
                  onClick={() => navigate(`/blog/${basicStats.topBlog.id}`)}
                >
                   <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Trophy size={120} />
                   </div>
                   <div className="relative z-10">
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-on-primary/20 backdrop-blur-md w-fit px-3 py-1 rounded-sm mb-6 inline-block">Star Story</span>
                      <h3 className="text-2xl font-headline font-bold mb-4 line-clamp-2 leading-tight">{basicStats.topBlog.title}</h3>
                      <div className="flex items-center gap-6 text-on-primary/80 text-sm font-bold">
                         <span className="flex items-center gap-2"><BarChart2 size={14} /> {basicStats.topBlog.views || 0} views</span>
                         <span className="flex items-center gap-2"><CheckCircle size={14} /> 94% finished</span>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
};


function MetricCard({ title, value, icon, index = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200/80 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-transform group-hover:scale-105">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 font-label">{title}</span>
      </div>
      <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight font-headline">{value}</h3>
    </motion.div>
  );
}

export default Dashboard;


function SectionCard({ title, subtitle, children }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl border border-gray-200/80 dark:border-gray-800">
      <div className="mb-6">
        <h3 className="text-lg font-headline font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1 font-label">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}


function LegendItem({ label, color }: any) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-label">{label}</span>
    </div>
  );
}
