import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useAuth, useUser } from "@clerk/clerk-react";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageCache } from "@/context/PageCacheContext";
import UserContentSection from "../components/UserContent";

const API_URL = import.meta.env.VITE_API_URL;

interface FollowUser {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  bio?: string;
}

const ProfileComponent = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loadingFollow, setLoadingFollow] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
  const cache = usePageCache();

  useEffect(() => {
    const cached = cache.get('profile:follows', 180000);
    if (cached) {
      setFollowers(cached.followers);
      setFollowing(cached.following);
      setLoadingFollow(false);
      return;
    }
    const fetchFollowData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [followersRes, followingRes] = await Promise.all([
          fetch(`${API_URL}/api/user/followers`, { headers }),
          fetch(`${API_URL}/api/user/following`, { headers }),
        ]);
        const fData = followersRes.ok ? await followersRes.json() : [];
        const gData = followingRes.ok ? await followingRes.json() : [];
        setFollowers(fData);
        setFollowing(gData);
        cache.set('profile:follows', { followers: fData, following: gData });
      } catch (err) {
        console.error("Failed to fetch follow data:", err);
      } finally {
        setLoadingFollow(false);
      }
    };
    fetchFollowData();
  }, []);

  const handleUnfollow = async (userId: string) => {
    setUnfollowingId(userId);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/user/unfollow/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      cache.invalidate('profile:follows');
      setFollowing((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Unfollow failed:", err);
    } finally {
      setUnfollowingId(null);
    }
  };

  const renderUserCard = (user: FollowUser, showUnfollow = false) => {
    const displayName = user.name || user.email.split("@")[0];
    const initials = displayName.slice(0, 2).toUpperCase();
    return (
      <motion.div
        key={user.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
        onClick={() => navigate(`/author/${user.id}`)}
      >
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={displayName} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {displayName}
          </p>
          {user.bio && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.bio}</p>
          )}
        </div>
        {showUnfollow && (
          <button
            onClick={(e) => { e.stopPropagation(); handleUnfollow(user.id); }}
            disabled={unfollowingId === user.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:border-red-800 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all disabled:opacity-40"
          >
            <UserMinus size={12} />
            {unfollowingId === user.id ? "..." : "Unfollow"}
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">

        {/* Profile Header */}
        <header className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <div className="flex flex-col sm:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-gray-100 dark:ring-gray-800 shadow-sm">
                <img
                  src={user?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {user?.emailAddresses?.[0]?.emailAddress || ""}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Followers</span>
                  <span className="text-2xl font-headline font-bold text-gray-900 dark:text-white">{followers.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Following</span>
                  <span className="text-2xl font-headline font-bold text-gray-900 dark:text-white">{following.length}</span>
                </div>
              </div>

              {/* Clerk Account Management Button */}
              <div className="flex items-center gap-3 pt-1">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }}
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">Manage account settings</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content: Blogs + Network sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Blogs / Drafts */}
          <div className="lg:col-span-2">
            <UserContentSection />
          </div>

          {/* Network Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-base font-headline font-bold text-gray-900 dark:text-white">Network</h2>
              </div>

              {/* Tab toggles */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setActiveTab("followers")}
                  className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-widest rounded-lg transition-all ${
                    activeTab === "followers"
                      ? "bg-white dark:bg-gray-700 text-violet-600 shadow"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Followers ({followers.length})
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-widest rounded-lg transition-all ${
                    activeTab === "following"
                      ? "bg-white dark:bg-gray-700 text-violet-600 shadow"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Following ({following.length})
                </button>
              </div>

              {/* Content */}
              {loadingFollow ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activeTab === "followers" ? (
                    <motion.div key="followers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 max-h-96 overflow-y-auto">
                      {followers.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                          <UserPlus className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          <p className="text-xs font-bold uppercase tracking-tighter">No followers yet</p>
                        </div>
                      ) : (
                        followers.map((u) => renderUserCard(u, false))
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 max-h-96 overflow-y-auto">
                      {following.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                          <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          <p className="text-xs font-bold uppercase tracking-tighter">No follows yet</p>
                        </div>
                      ) : (
                        following.map((u) => renderUserCard(u, true))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </aside>

        </div>
      </div>
    </>
  );
};

export default ProfileComponent;
