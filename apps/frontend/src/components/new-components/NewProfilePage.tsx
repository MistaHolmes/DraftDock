import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserButton, useAuth, useUser } from "@clerk/clerk-react";
import { Users, UserPlus, UserMinus, Edit, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageCache, PAGE_TTL } from "@/context/PageCacheContext";
import UserContentSection from "../UserContent";

const API_URL = import.meta.env.VITE_API_URL;

interface FollowUser {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  bio?: string;
}

const NewProfilePage = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"blogs" | "drafts">("blogs");
  const [networkTab, setNetworkTab] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loadingFollow, setLoadingFollow] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
  const cache = usePageCache();

  useEffect(() => {
    // Initialize tab from query param if present
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "drafts") setActiveTab("drafts");

    const cached = cache.get("profile:follows", PAGE_TTL.profile);
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
        cache.set("profile:follows", { followers: fData, following: gData });
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
      cache.invalidate("profile:follows");
      setFollowing((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Unfollow failed:", err);
    } finally {
      setUnfollowingId(null);
    }
  };

  // update active tab and push param so /profile?tab=drafts works
  const updateActiveTab = (s: "blogs" | "drafts") => {
    setActiveTab(s);
    const params = new URLSearchParams(location.search);
    params.set("tab", s);
    navigate({ pathname: "/profile", search: params.toString() }, { replace: true });
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ||
        user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "User";

  return (
    <div className="pb-24 max-w-6xl mx-auto px-6 md:px-12">
      {/* Profile Header - matches user_profile_desktop stitch */}
      <header className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-16 pt-12">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-36 h-36 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden ring-4 ring-white dark:ring-gray-900 shadow-sm">
            <img
              className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
              src={
                user?.imageUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
              }
              alt="Profile"
            />
          </div>
        </div>

        <div className="flex-1 space-y-5">
          {/* Name */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline mb-2 text-gray-900 dark:text-white">
              {displayName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl text-lg leading-relaxed">
              {user?.emailAddresses?.[0]?.emailAddress || ""}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 text-sm font-medium">
            <div className="flex flex-col">
              <span className="text-zinc-400 font-label uppercase tracking-widest text-[10px] mb-1">
                Followers
              </span>
              <span className="text-xl font-headline font-bold text-gray-900 dark:text-white">
                {followers.length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-400 font-label uppercase tracking-widest text-[10px] mb-1">
                Following
              </span>
              <span className="text-xl font-headline font-bold text-gray-900 dark:text-white">
                {following.length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-400 font-label uppercase tracking-widest text-[10px] mb-1">
                Member Since
              </span>
              <span className="text-xl font-headline font-bold text-gray-900 dark:text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => navigate("/settings")}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-md font-headline font-bold flex items-center gap-2 hover:opacity-90 transition-all text-sm"
            >
              <Edit size={14} />
              Edit Profile
            </button>
            <div className="flex items-center gap-2">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: { userButtonAvatarBox: "w-9 h-9" },
                }}
              />
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                Account
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area: Main + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex gap-12 border-b border-gray-200 dark:border-gray-800 mb-10">
            <button
              onClick={() => updateActiveTab("blogs")}
              className={`pb-4 text-lg font-headline font-bold transition-colors ${
                activeTab === "blogs"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              My Blogs
            </button>
            <button
              onClick={() => updateActiveTab("drafts")}
              className={`pb-4 text-lg font-headline font-bold transition-colors ${
                activeTab === "drafts"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              My Drafts
            </button>
          </div>

          {/* Blog/Draft Content — outer tabs drive the section */}
          <UserContentSection
            activeSection={activeTab}
            onSectionChange={updateActiveTab}
          />
        </div>

        {/* Network Sidebar */}
        <aside className="w-full lg:w-80 space-y-8">
          {/* Quick Insights */}
          <section className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest mb-6 text-gray-900 dark:text-white">
              Network
            </h4>

            {/* Tab toggles */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
              <button
                onClick={() => setNetworkTab("followers")}
                className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-widest rounded-lg transition-all ${
                  networkTab === "followers"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Followers ({followers.length})
              </button>
              <button
                onClick={() => setNetworkTab("following")}
                className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-widest rounded-lg transition-all ${
                  networkTab === "following"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Following ({following.length})
              </button>
            </div>

            {/* User list */}
            {loadingFollow ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {networkTab === "followers" ? (
                  <motion.div
                    key="followers"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 max-h-80 overflow-y-auto"
                  >
                    {followers.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <UserPlus className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-bold uppercase tracking-tighter">
                          No followers yet
                        </p>
                      </div>
                    ) : (
                      followers.map((u) => (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => navigate(`/author/${u.id}`)}
                        >
                          {u.profilePicture ? (
                            <img
                              src={u.profilePicture}
                              alt={u.name || u.email}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                              {(u.name || u.email).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {u.name || u.email.split("@")[0]}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="following"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 max-h-80 overflow-y-auto"
                  >
                    {following.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-bold uppercase tracking-tighter">
                          Not following anyone
                        </p>
                      </div>
                    ) : (
                      following.map((u) => (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => navigate(`/author/${u.id}`)}
                        >
                          {u.profilePicture ? (
                            <img
                              src={u.profilePicture}
                              alt={u.name || u.email}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                              {(u.name || u.email).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {u.name || u.email.split("@")[0]}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfollow(u.id);
                            }}
                            disabled={unfollowingId === u.id}
                            className="text-xs font-medium px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-500 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-40"
                          >
                            <UserMinus size={12} />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </section>

          {/* Support Card - matches stitch */}
          <section className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
            <h4 className="font-headline font-bold text-amber-800 dark:text-amber-300 text-sm mb-2">
              Support DraftDock
            </h4>
            <p className="text-amber-700 dark:text-amber-400 text-xs mb-4 leading-relaxed">
              Your contributions help fund technical research and open-source documentation.
            </p>
            <a
              href="https://coff.ee/abhastheain"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-md font-headline font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Coffee size={14} />
              Buy Me a Coffee
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default NewProfilePage;
