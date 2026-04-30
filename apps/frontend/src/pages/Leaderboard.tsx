import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageCache } from "@/context/PageCacheContext";
import { Trophy, Medal, Star, TrendingUp, Crown, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  profilePicture?: string;
  isVerified: boolean;
  writerLevel: number;
  writerXP: number;
  blogCount: number;
  followerCount: number;
}

const levelNames = ["", "Newcomer", "Contributor", "Rising Star", "Expert Writer", "Thought Leader"];
const levelColors = ["", "text-gray-500", "text-blue-500", "text-purple-500", "text-amber-500", "text-red-500"];

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const cache = usePageCache();

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    const cacheKey = `leaderboard:${period}`;
    const cached = cache.get(cacheKey);
    if (cached) { setLeaders(cached); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analytics/leaderboard?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        cache.set(cacheKey, data);
        setLeaders(data);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={20} className="text-gray-400" />;
    if (rank === 3) return <Medal size={20} className="text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400 w-5 text-center">#{rank}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy size={28} className="text-amber-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Top writers ranked by experience and community engagement</p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "monthly", "weekly"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              period === p
                ? "bg-amber-500 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {p === "all" ? "All Time" : p === "monthly" ? "This Month" : "This Week"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No writers found yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((writer) => (
            <div
              key={writer.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                writer.rank <= 3
                  ? "bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-800 shadow-sm"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">{getRankIcon(writer.rank)}</div>

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
                onClick={() => navigate(`/author/${writer.id}`)}
              >
                {writer.profilePicture ? (
                  <img src={writer.profilePicture} alt={writer.name} className="w-full h-full object-cover" />
                ) : (
                  writer.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200" onClick={() => navigate(`/author/${writer.id}`)}>{writer.name}</span>
                  {writer.isVerified && <span className="text-blue-500 text-sm">✓</span>}
                  <span className={`text-xs font-medium ${levelColors[writer.writerLevel] || "text-gray-400"}`}>
                    {levelNames[writer.writerLevel] || "Newcomer"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Star size={12} /> {writer.writerXP} XP</span>
                  <span className="flex items-center gap-1"><TrendingUp size={12} /> {writer.blogCount} posts</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {writer.followerCount} followers</span>
                </div>
              </div>

              {/* XP Bar */}
              <div className="hidden sm:block w-32">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (writer.writerXP / 5000) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 text-right">Lv.{writer.writerLevel}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
