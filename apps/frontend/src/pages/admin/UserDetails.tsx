import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  role: string;
  profilePicture: string | null;
  createdAt: string;
  isVerified: boolean;
  writerLevel: number;
  writerXP: number;
  readingStreak: number;
  longestStreak: number;
  totalViews: number;
  _count: {
    blogs: number;
    comments: number;
    followers: number;
    following: number;
    bookmarks: number;
    achievements: number;
  };
  blogs: {
    id: string;
    title: string;
    published: boolean;
    views: number;
    createdAt: string;
    _count: { comments: number };
  }[];
  achievements: {
    id: string;
    awardedAt: string;
    achievement: { name: string; icon: string; description: string };
  }[];
}

const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users/${id}`, { withCredentials: true });
      setUser(res.data);
      setSelectedRole(res.data.role);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleRoleChange = async (newRole: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/users/${id}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      setSelectedRole(newRole);
      fetchUser();
    } catch (err) {
      alert("Failed to update role.");
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e131f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e131f]">
        <p className="text-lg text-gray-400">User not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e131f] text-[#dee2f3]" style={{ fontFamily: "Manrope, sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .premium-gradient { background: linear-gradient(135deg, #7c3aed 0%, #d2bbff 100%); }
      `}</style>

      {/* Nav */}
      <header className="bg-slate-900/70 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(124,58,237,0.08)] sticky top-0 z-50 flex items-center gap-6 w-full px-8 h-20">
        <button
          onClick={() => navigate("/admin")}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2 text-sm text-[#ccc3d8]">
          <span className="hover:text-violet-400 cursor-pointer" onClick={() => navigate("/admin")}>
            Admin
          </span>
          <span>›</span>
          <span className="hover:text-violet-400 cursor-pointer" onClick={() => navigate("/admin")}>
            Users
          </span>
          <span>›</span>
          <span className="text-[#dee2f3] font-semibold">{user.name || user.email}</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-12 space-y-10">
        {/* Profile Header */}
        <div className="bg-[#1a1f2c] rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img
              src={user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
              alt={user.name || user.email}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-violet-500/20"
            />
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: "Newsreader, serif" }}>
                {user.name || "Unnamed User"}
              </h1>
              <p className="text-sm text-[#ccc3d8] mt-1">{user.email}</p>
              <div className="flex items-center gap-3 mt-3">
                <span
                  className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                    user.role === "ADMIN"
                      ? "bg-violet-500/20 text-violet-400"
                      : user.role === "AUTHOR"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {user.role}
                </span>
                <span className="text-xs text-[#ccc3d8]">
                  Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/author/${user.id}`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#252a37] text-sm text-[#dee2f3] hover:bg-[#303542] transition-colors font-semibold"
            >
              <span className="material-symbols-outlined text-lg">open_in_new</span>
              View Public Profile
            </button>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-[#252a37] px-4 py-2.5 rounded-xl border-none text-sm text-[#dee2f3] focus:ring-1 focus:ring-violet-500/40"
            >
              <option value="ADMIN">Admin</option>
              <option value="AUTHOR">Author</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Posts Published", value: user._count.blogs, icon: "edit_note" },
            { label: "Total Views", value: formatNumber(user.totalViews), icon: "visibility" },
            { label: "Comments Written", value: user._count.comments, icon: "forum" },
            {
              label: "Reading Streak",
              value: `${user.readingStreak} days 🔥`,
              icon: "local_fire_department",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-[#1a1f2c] p-6 rounded-3xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-transparent opacity-50" />
              <span className="text-[11px] uppercase tracking-widest text-[#ccc3d8] block mb-3">
                {card.label}
              </span>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "Newsreader, serif" }}>
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </h2>
            </div>
          ))}
        </section>

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Recent Blogs */}
          <div className="lg:col-span-3">
            <div className="bg-[#1a1f2c] rounded-3xl p-8">
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-widest text-violet-400 mb-1">Content</p>
                <h3 className="text-xl italic" style={{ fontFamily: "Newsreader, serif" }}>
                  Recent Blog Posts
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-widest text-[#ccc3d8] border-b border-[#4a4455]/20">
                    <tr>
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Views</th>
                      <th className="pb-3 px-4">Comments</th>
                      <th className="pb-3 pl-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.blogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#ccc3d8]">
                          No blog posts yet.
                        </td>
                      </tr>
                    )}
                    {user.blogs.map((blog) => (
                      <tr
                        key={blog.id}
                        onClick={() => navigate(`/blog/${blog.id}`)}
                        className="hover:bg-[#252a37] transition-colors cursor-pointer"
                      >
                        <td className="py-3 pr-4 font-semibold text-slate-100 truncate max-w-[200px]">
                          {blog.title}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${
                              blog.published
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {blog.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#ccc3d8]">{formatNumber(blog.views)}</td>
                        <td className="py-3 px-4 text-[#ccc3d8]">{blog._count.comments}</td>
                        <td className="py-3 pl-4 text-[#ccc3d8]">
                          {new Date(blog.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Account Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1a1f2c] rounded-3xl p-8">
              <h3 className="text-xl italic mb-6" style={{ fontFamily: "Newsreader, serif" }}>
                Account Information
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Status",
                    value: "Active",
                    badge: true,
                    color: "bg-emerald-500/10 text-emerald-400",
                  },
                  {
                    label: "Role",
                    value: user.role,
                    badge: true,
                    color:
                      user.role === "ADMIN"
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-blue-500/10 text-blue-400",
                  },
                  {
                    label: "Email Verified",
                    value: user.isVerified ? "Yes ✓" : "No",
                    badge: false,
                  },
                  { label: "Writer Level", value: `Level ${user.writerLevel}`, badge: false },
                  { label: "Total XP", value: `${user.writerXP} XP`, badge: false },
                  {
                    label: "Followers",
                    value: formatNumber(user._count.followers),
                    badge: false,
                  },
                  {
                    label: "Following",
                    value: formatNumber(user._count.following),
                    badge: false,
                  },
                  {
                    label: "Longest Streak",
                    value: `${user.longestStreak} days`,
                    badge: false,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <span className="text-xs text-[#ccc3d8] uppercase tracking-wider">{item.label}</span>
                    {item.badge ? (
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${item.color}`}>
                        {item.value}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-200">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            {user.achievements.length > 0 && (
              <div className="bg-[#1a1f2c] rounded-3xl p-8">
                <h3 className="text-xl italic mb-6" style={{ fontFamily: "Newsreader, serif" }}>
                  Achievements
                </h3>
                <div className="flex flex-wrap gap-4">
                  {user.achievements.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#252a37] hover:bg-violet-500/10 transition-colors"
                      title={a.achievement.description}
                    >
                      <span className="text-2xl">{a.achievement.icon}</span>
                      <span className="text-[10px] text-[#ccc3d8] uppercase tracking-wider text-center">
                        {a.achievement.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDetails;
