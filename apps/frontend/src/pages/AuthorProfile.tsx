import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, UserPlus, UserMinus, Users } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { usePageCache } from "@/context/PageCacheContext";
import Header2 from "@/components/ui/header2";

const API_URL = import.meta.env.VITE_API_URL;

interface Blog {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  updatedAt: string;
  tags: { id: string; name: string }[];
}

interface Author {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  createdAt: string;
  blogs: Blog[];
}

const AuthorProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const cache = usePageCache();

  useEffect(() => {
    if (!userId) return;
    const cacheKey = `author:${userId}:${isSignedIn}`;
    const cached = cache.get(cacheKey, 180000);
    if (cached) {
      setAuthor(cached.author);
      setFollowerCount(cached.followerCount);
      setFollowingCount(cached.followingCount);
      setIsFollowing(cached.isFollowing);
      setLoading(false);
      return;
    }
    const fetchAuthor = async () => {
      let authorData: any = null;
      let fCount = 0, gCount = 0, following = false;
      try {
        const res = await fetch(`${API_URL}/api/authors/${userId}`);
        if (!res.ok) { setNotFound(true); return; }
        authorData = await res.json();
        setAuthor(authorData);

        // Fetch follow counts
        const countsRes = await fetch(`${API_URL}/api/authors/${userId}/follow-counts`);
        if (countsRes.ok) {
          const counts = await countsRes.json();
          fCount = counts.followerCount;
          gCount = counts.followingCount;
          setFollowerCount(fCount);
          setFollowingCount(gCount);
        }

        // Check if current user follows this author
        if (isSignedIn) {
          const token = await getToken();
          const followRes = await fetch(`${API_URL}/api/user/is-following/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (followRes.ok) {
            const followData = await followRes.json();
            following = followData.isFollowing;
            setIsFollowing(following);
          }
        }

        cache.set(cacheKey, { author: authorData, followerCount: fCount, followingCount: gCount, isFollowing: following });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthor();
  }, [userId, isSignedIn]);

  const handleFollowToggle = async () => {
    if (!isSignedIn || !userId) return;
    setFollowLoading(true);
    try {
      const token = await getToken();
      if (isFollowing) {
        await fetch(`${API_URL}/api/user/unfollow/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await fetch(`${API_URL}/api/user/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId }),
        });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const displayName = author?.name || author?.email?.split("@")[0] || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !author) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <p className="text-xl mb-4">Author not found.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Helmet>
        <title>{displayName} — DraftDock</title>
        <meta name="description" content={author.bio || `${displayName}'s blogs on DraftDock`} />
      </Helmet>
      <Header2 />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Author Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-2xl font-bold flex-shrink-0">
              {initials}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{displayName}</h1>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-3 flex items-center justify-center sm:justify-start gap-1">
                <Calendar size={12} />
                Joined {new Date(author.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </p>
              {author.bio && (
                <p className="text-gray-600 dark:text-gray-300 text-base mb-4 leading-relaxed">{author.bio}</p>
              )}

              {/* Follow Button */}
              {isSignedIn && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isFollowing
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-gray-300 dark:border-gray-600"
                      : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  } disabled:opacity-50`}
                >
                  {isFollowing ? (
                    <><UserMinus size={14} /> Unfollow</>
                  ) : (
                    <><UserPlus size={14} /> Follow</>
                  )}
                </button>
              )}
            </div>

            {/* Stats badges */}
            <div className="flex gap-6 text-center flex-shrink-0">
              <div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{author.blogs.length}</span>
                <p className="text-xs text-gray-400 dark:text-gray-500">blogs</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{followerCount}</span>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1"><Users size={10} />followers</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{followingCount}</span>
                <p className="text-xs text-gray-400 dark:text-gray-500">following</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Blogs */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Published Blogs</h2>
        {author.blogs.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-10">No published blogs yet.</p>
        ) : (
          <div className="space-y-4">
            {author.blogs.map((blog, i) => {
              const excerpt = blog.content.replace(/[#*`>\[\]]/g, "").slice(0, 140) + "...";
              const wordCount = blog.content.split(/\s+/).filter(Boolean).length;
              const readingTime = Math.max(1, Math.ceil(wordCount / 200));
              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4">
                    {blog.coverImage && (
                      <img src={blog.coverImage} alt={blog.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">{blog.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">{excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-3">
                          <span>{new Date(blog.updatedAt).toLocaleDateString()}</span>
                          <span>{readingTime} min read</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AuthorProfile;
