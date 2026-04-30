import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Moon, Sun, User, Save } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useTheme } from "@/lib/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL;

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { getToken } = useAuth();

  const [profile, setProfile] = useState({ name: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const token = await getToken();
      await axios.patch(`${API_URL}/api/user/profile`, profile, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        withCredentials: true,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings — DraftDock</title>
      </Helmet>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl">
             <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">Account Settings</h1>
            <p className="text-sm text-gray-500">Manage your profile, appearance, and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm"
            >
              <h2 className="text-xl font-headline font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <User size={20} className="text-violet-500" /> Public Profile
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your display name"
                    className="w-full px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-body"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell the world a little about yourself..."
                    rows={4}
                    className="w-full px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none font-body leading-relaxed"
                  />
                </div>

                {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : saved ? "Changes Saved!" : "Save Profile"}
                </button>
              </form>
            </motion.div>

            {/* Appearance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm"
            >
              <h2 className="text-xl font-headline font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                {theme === "dark" ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-500" />}
                Appearance
              </h2>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Switch between light and dark themes
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none ${
                    theme === "dark" ? "bg-violet-600" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    animate={{ x: theme === "dark" ? 24 : 4 }}
                    className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                  >
                    {theme === "dark" ? <Moon size={12} className="text-violet-600" /> : <Sun size={12} className="text-amber-500" />}
                  </motion.div>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            {/* Quick Navigation */}
            <div className="bg-violet-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                  <SettingsIcon size={120} />
               </div>
               <div className="relative z-10 font-headline">
                  <h3 className="text-xl font-bold mb-6 italic underline underline-offset-8 decoration-white/20">System Links</h3>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: "My Profile", href: "/profile" },
                      { label: "Dashboard", href: "/dashboard" },
                      { label: "My Drafts", href: "/blogs" },
                      { label: "Explore Hub", href: "/explore" },
                    ].map((link) => (
                      <button
                        key={link.href}
                        onClick={() => navigate(link.href)}
                        className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/5"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
