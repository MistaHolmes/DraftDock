import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL;

interface PlatformStats {
  totalUsers: number;
  totalBlogs: number;
  totalComments: number;
  totalViews: number;
  newUsersThisWeek: number;
  newBlogsThisWeek: number;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  profilePicture: string | null;
  createdAt: string;
  isVerified: boolean;
  _count: { blogs: number; comments: number };
}

interface TopBlog {
  id: string;
  title: string;
  views: number;
  author: { name: string | null; email: string };
}

interface ActivityItem {
  type: string;
  message: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [topBlogs, setTopBlogs] = useState<TopBlog[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, blogsRes, activityRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/users`, {
          withCredentials: true,
          params: { page, search, role: roleFilter, limit: 10 },
        }),
        axios.get(`${API_URL}/api/admin/top-blogs`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/recent-activity`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setTotalUsers(usersRes.data.pagination.total);
      setTotalPages(usersRes.data.pagination.totalPages);
      setTopBlogs(blogsRes.data.blogs);
      setActivity(activityRes.data.activity);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, roleFilter]);

  const handleAddAdmin = async () => {
    if (!addAdminEmail.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true,
        params: { search: addAdminEmail, limit: 1 },
      });
      const found = res.data.users[0];
      if (!found) {
        alert("User not found with that email.");
        return;
      }
      await axios.patch(
        `${API_URL}/api/admin/users/${found.id}/role`,
        { role: "ADMIN" },
        { withCredentials: true }
      );
      alert(`${found.email} has been promoted to Admin!`);
      setAddAdminEmail("");
      setShowAddAdmin(false);
      fetchData();
    } catch (err) {
      alert("Failed to add admin. Please try again.");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      fetchData();
    } catch (err) {
      alert("Failed to change role.");
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0e131f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: "Manrope, sans-serif" }}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  const maxViews = topBlogs.length > 0 ? topBlogs[0].views : 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e131f] text-gray-800 dark:text-[#dee2f3]" style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* Import fonts */}
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
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #4a4455; border-radius: 10px; }
      `}</style>

      {/* Top Nav */}
      <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-sm dark:shadow-[0_8px_32px_0_rgba(124,58,237,0.08)] border-b border-gray-200 dark:border-transparent sticky top-0 z-50 flex items-center justify-between w-full px-8 h-20">
        <div className="flex items-center gap-8">
          <h1
            className="text-2xl font-bold italic text-gray-900 dark:text-slate-100"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            DraftDock Admin
          </h1>
          <nav className="hidden md:flex gap-6 items-center">
            <span className="text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-500 pb-1 font-semibold cursor-pointer">
              Dashboard
            </span>
            <span
              onClick={() => navigate("/blogs")}
              className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Back to App
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0]}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
          </div>
          <img
            src={user?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
            alt="Admin"
            className="w-10 h-10 rounded-full object-cover border-2 border-violet-200 dark:border-violet-500/20"
          />
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-12 space-y-12">
        {/* Platform Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Users",
              value: stats?.totalUsers || 0,
              icon: "group",
              trend: `+${stats?.newUsersThisWeek || 0} this week`,
              trendPositive: true,
            },
            {
              label: "Blogs Published",
              value: stats?.totalBlogs || 0,
              icon: "edit_note",
              trend: `+${stats?.newBlogsThisWeek || 0} this week`,
              trendPositive: true,
            },
            { label: "Total Comments", value: formatNumber(stats?.totalComments || 0), icon: "forum" },
            { label: "Total Views", value: formatNumber(stats?.totalViews || 0), icon: "monitoring" },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1a1f2c] border border-gray-200 dark:border-transparent p-8 rounded-3xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-transparent opacity-50" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-[#ccc3d8]">
                  {card.label}
                </span>
                <span className="material-symbols-outlined text-[#7c3aed]">{card.icon}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <h2
                  className="text-4xl font-bold text-gray-900 dark:text-[#dee2f3]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                </h2>
                {card.trend && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">trending_up</span>
                    {card.trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Main Content: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-8">
            {/* Top Viewed Content */}
            <div className="bg-white dark:bg-[#1a1f2c] border border-gray-200 dark:border-transparent rounded-3xl p-8">
              <div className="mb-8">
                <p className="text-[11px] uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">
                  Performance
                </p>
                <h3
                  className="text-xl italic text-gray-900 dark:text-[#dee2f3]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  Top Viewed Content
                </h3>
              </div>
              <div className="space-y-6">
                {topBlogs.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-[#ccc3d8]">No published blogs yet.</p>
                )}
                {topBlogs.map((blog) => (
                  <div key={blog.id} className="group cursor-pointer" onClick={() => navigate(`/blog/${blog.id}`)}>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-[#ccc3d8] mb-2">
                      <span className="truncate mr-4">{blog.title}</span>
                      <span className="group-hover:text-violet-600 dark:group-hover:text-[#d2bbff] transition-colors italic whitespace-nowrap">
                        {formatNumber(blog.views)} views
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-[#252a37] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full premium-gradient"
                        style={{ width: `${Math.max(5, (blog.views / maxViews) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#1a1f2c] border border-gray-200 dark:border-transparent rounded-3xl p-8 max-h-[480px] flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                <h3
                  className="text-xl italic text-gray-900 dark:text-[#dee2f3]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  Recent Activity
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {activity.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-[#ccc3d8]">No recent activity.</p>
                )}
                {activity.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.type === "user_joined"
                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {item.type === "user_joined" ? "person_add" : "publish"}
                        </span>
                      </div>
                      {i < activity.length - 1 && (
                        <div className="absolute top-8 left-1/2 w-[1px] h-full bg-gray-200 dark:bg-[#4a4455]/20 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm text-gray-800 dark:text-slate-200">{item.message}</p>
                      <p className="text-[10px] text-gray-500 dark:text-[#ccc3d8] uppercase mt-1">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <section className="bg-white dark:bg-[#1a1f2c] border border-gray-200 dark:border-transparent rounded-3xl p-8 space-y-8 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3
                className="text-2xl italic mb-1 text-gray-900 dark:text-[#dee2f3]"
                style={{ fontFamily: "Newsreader, serif" }}
              >
                User Management
              </h3>
              <p className="text-sm text-gray-500 dark:text-[#ccc3d8]">Oversee and manage platform access control.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <input
                className="bg-gray-100 dark:bg-[#252a37] px-4 py-2 rounded-xl border border-gray-200 dark:border-transparent text-sm w-full md:w-64 focus:ring-1 focus:ring-violet-500/40 text-gray-800 dark:text-[#dee2f3] placeholder:text-gray-400 dark:placeholder:text-[#ccc3d8]/50"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-100 dark:bg-[#252a37] px-3 py-2 rounded-xl border border-gray-200 dark:border-transparent text-sm text-gray-800 dark:text-[#dee2f3] focus:ring-1 focus:ring-violet-500/40"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="AUTHOR">Author</option>
                <option value="CONTRIBUTOR">Contributor</option>
              </select>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="flex items-center gap-2 premium-gradient text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Add Admin
              </button>
            </div>
          </div>

          {/* Add Admin Modal */}
          {showAddAdmin && (
            <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
              <div className="bg-white dark:bg-[#1a1f2c] border border-gray-200 dark:border-transparent rounded-3xl p-8 w-full max-w-md mx-4 space-y-6 shadow-2xl">
                <h3
                  className="text-xl italic text-gray-900 dark:text-[#dee2f3]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  Add New Admin
                </h3>
                <p className="text-sm text-gray-500 dark:text-[#ccc3d8]">
                  Enter the email of the user you want to promote to Admin.
                </p>
                <input
                  type="email"
                  value={addAdminEmail}
                  onChange={(e) => setAddAdminEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-gray-50 dark:bg-[#090e1a] px-4 py-3 rounded-xl border border-gray-200 dark:border-transparent text-sm text-gray-800 dark:text-[#dee2f3] placeholder:text-gray-400 dark:placeholder:text-[#ccc3d8]/50 focus:ring-1 focus:ring-violet-500/40"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddAdmin}
                    className="flex-1 premium-gradient text-white py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
                  >
                    Promote to Admin
                  </button>
                  <button
                    onClick={() => {
                      setShowAddAdmin(false);
                      setAddAdminEmail("");
                    }}
                    className="flex-1 bg-gray-100 dark:bg-[#252a37] text-gray-700 dark:text-[#dee2f3] py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-[#303542] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate" style={{ borderSpacing: "0 0.75rem" }}>
              <thead className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#ccc3d8]">
                <tr>
                  <th className="px-4 pb-4">User</th>
                  <th className="px-4 pb-4">Role</th>
                  <th className="px-4 pb-4">Blogs</th>
                  <th className="px-4 pb-4">Joined</th>
                  <th className="px-4 pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-gray-50 dark:hover:bg-[#252a37] transition-colors">
                    <td className="bg-gray-50/50 dark:bg-[#161b28] px-4 py-4 rounded-l-2xl">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.profilePicture ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`
                          }
                          alt={u.name || u.email}
                          className="w-10 h-10 rounded-xl object-cover cursor-pointer transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
                          onClick={() => navigate(`/author/${u.id}`)}
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-slate-100 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200" onClick={() => navigate(`/author/${u.id}`)}>
                            {u.name || "—"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[#ccc3d8]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="bg-gray-50/50 dark:bg-[#161b28] px-4 py-4">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-tighter ${
                          u.role === "ADMIN"
                            ? "bg-violet-500/20 text-violet-700 dark:text-violet-400"
                            : u.role === "AUTHOR"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="bg-gray-50/50 dark:bg-[#161b28] px-4 py-4 text-gray-700 dark:text-slate-200">
                      {u._count.blogs}
                    </td>
                    <td className="bg-gray-50/50 dark:bg-[#161b28] px-4 py-4 text-gray-500 dark:text-[#ccc3d8]">
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="bg-gray-50/50 dark:bg-[#161b28] px-4 py-4 rounded-r-2xl text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors"
                        >
                          View
                        </button>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-gray-100 dark:bg-[#252a37] text-[10px] px-2 py-1 rounded-lg border border-gray-200 dark:border-transparent text-gray-800 dark:text-[#dee2f3] focus:ring-1 focus:ring-violet-500/40"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="AUTHOR">Author</option>
                          <option value="CONTRIBUTOR">Contributor</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-[#ccc3d8]">
              Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, totalUsers)} of {totalUsers} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#252a37] flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-500/20 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center transition-colors ${
                    p === page
                      ? "premium-gradient text-white"
                      : "bg-gray-100 dark:bg-[#252a37] hover:bg-gray-200 dark:hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#252a37] flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-500/20 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 dark:border-[#4a4455]/10 bg-gray-50/50 dark:bg-[#090e1a]/50 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setShowAddAdmin(true)}
              className="flex items-center gap-2 premium-gradient text-white px-8 py-3 rounded-full text-sm font-bold shadow-xl shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">person_add</span>
              Add New Admin
            </button>
          </div>
          <div className="flex items-center gap-10">
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2 text-gray-500 dark:text-[#ccc3d8] hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm font-semibold group"
            >
              <span className="material-symbols-outlined text-lg group-hover:rotate-45 transition-transform">
                settings
              </span>
              Platform Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
