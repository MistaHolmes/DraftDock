/**
 * CollaboratePage — landing page for the "Collaborate" header tab.
 *
 * New mechanism: start a brand-new live writing session (draft blog) with
 * real-time co-authoring.  Not for editing already-published blogs.
 *
 * Shows:
 *  - CTA to start a new collaborative session (creates a draft)
 *  - Active sessions the user owns (unpublished draft blogs)
 *  - Sessions the user has been invited to co-author
 *  - Join via invite link
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NewAppShell } from '@/components/new-components';
import { usePageCache } from '@/context/PageCacheContext';
import {
  ArrowRight,
  Link2,
  Loader2,
  PenTool,
  UserPlus,
  Users,
  Plus,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function CollaboratePage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const cache = usePageCache();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  // Only unpublished (draft) blogs are shown as active sessions
  const [ownedDrafts, setOwnedDrafts] = useState<any[]>([]);
  const [coAuthored, setCoAuthored] = useState<any[]>([]);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [joiningInvite, setJoiningInvite] = useState(false);

  const CACHE_KEY = 'collab:sessions';
  const CACHE_TTL = 60_000; // 60 seconds — sessions change infrequently

  const fetchSessions = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cache.get(CACHE_KEY, CACHE_TTL);
      if (cached) {
        setOwnedDrafts(cached.owned);
        setCoAuthored(cached.coAuthored);
        setLoading(false);
        return;
      }
    }
    try {
      const token = await getToken();
      const { data } = await axios.get(`${API_URL}/api/collab/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      // Show only draft / unpublished blogs as active sessions
      const owned = (data.owned || []).filter((b: any) => !b.published);
      const coAuth = data.coAuthored || [];
      cache.set(CACHE_KEY, { owned, coAuthored: coAuth });
      setOwnedDrafts(owned);
      setCoAuthored(coAuth);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  /** Create a blank draft blog and jump straight into the collaborative editor */
  const startNewSession = async () => {
    setStarting(true);
    try {
      const token = await getToken();
      // 1. Create an empty draft
      const { data: blogData } = await axios.post(
        `${API_URL}/api/blogs`,
        { title: 'Untitled Session', content: '<p></p>', published: false },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, withCredentials: true },
      );
      const blogId = blogData.blog.id;

      // 2. Start the collab session
      await axios.post(
        `${API_URL}/api/collab/${blogId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true },
      );

      // 3. Navigate — invalidate cache so the sessions list is fresh on return
      cache.invalidate(CACHE_KEY);
      navigate(`/collab/${blogId}`);
    } catch (err) {
      console.error('Failed to start session:', err);
      setStarting(false);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this draft session? This cannot be undone.')) return;
    setDeletingIds((s) => [...s, id]);
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      cache.invalidate(CACHE_KEY);
      setOwnedDrafts((s) => s.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('Failed to delete session');
    } finally {
      setDeletingIds((s) => s.filter((x) => x !== id));
    }
  };

  const handleJoinInvite = async () => {
    setInviteError('');
    const trimmed = inviteInput.trim();
    if (!trimmed) return;
    let token = trimmed;
    const match = trimmed.match(/\/collab\/join\/([a-f0-9-]+)/);
    if (match) token = match[1];
    setJoiningInvite(true);
    try {
      await axios.get(`${API_URL}/api/collab/token/${token}`);
      navigate(`/collab/join/${token}`);
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'Invalid invite link');
    } finally {
      setJoiningInvite(false);
    }
  };

  return (
    <NewAppShell activePage="collaborate" hideRightPanel>
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black dark:bg-white mb-4">
            <Users size={26} className="text-white dark:text-black" />
          </div>
          <h1 className="text-4xl font-bold font-headline text-black dark:text-white mb-2">
            Write Together, Live
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-lg mx-auto">
            Start a new collaborative session, generate an invite link, and write a blog post together in real time.
          </p>
          <button
            onClick={startNewSession}
            disabled={starting}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-80 active:scale-95 transition-all disabled:opacity-60"
          >
            {starting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {starting ? 'Creating session…' : 'Start New Session'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* ── Your active draft sessions ─────────────────────── */}
            {ownedDrafts.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <PenTool size={16} className="text-gray-400" />
                  <h2 className="text-base font-bold text-black dark:text-white">Your Active Sessions</h2>
                  <span className="ml-auto text-xs text-gray-400">{ownedDrafts.length} session{ownedDrafts.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid gap-3">
                  {ownedDrafts.map((blog) => (
                    <div
                      key={blog.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <h3 className="font-semibold text-black dark:text-white truncate">
                          {blog.title || 'Untitled Session'}
                        </h3>
                        {(blog.coAuthors?.length || 0) > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex -space-x-1.5">
                              {blog.coAuthors.slice(0, 5).map((ca: any) => (
                                <img
                                  key={ca.user.id}
                                  src={ca.user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ca.user.id}`}
                                  alt={ca.user.name}
                                  title={ca.user.name}
                                  className="w-5 h-5 rounded-full border border-white dark:border-gray-900"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              {blog.coAuthors.length} co-author{blog.coAuthors.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/collab/${blog.id}`)}
                          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-80 transition-all active:scale-95"
                        >
                          Rejoin
                          <ArrowRight size={13} />
                        </button>

                        <button
                          onClick={() => deleteSession(blog.id)}
                          disabled={deletingIds.includes(blog.id)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-medium hover:opacity-90 transition-all disabled:opacity-60"
                          title="Delete session"
                        >
                          {deletingIds.includes(blog.id) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Sessions I'm co-authoring ──────────────────────── */}
            {coAuthored.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus size={16} className="text-gray-400" />
                  <h2 className="text-base font-bold text-black dark:text-white">Invited Sessions</h2>
                </div>
                <div className="grid gap-3">
                  {coAuthored.map((blog) => (
                    <div
                      key={blog.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <h3 className="font-semibold text-black dark:text-white truncate">
                          {blog.title || 'Untitled Session'}
                        </h3>
                        {blog.author && (
                          <span className="text-xs text-gray-400">by {blog.author.name || 'Unknown'}</span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/collab/${blog.id}`)}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors active:scale-95"
                      >
                        Join
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Join via invite link ───────────────────────────────── */}
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-black dark:text-white">Join via Invite Link</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinInvite()}
              placeholder="Paste invite link or token…"
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            <button
              onClick={handleJoinInvite}
              disabled={joiningInvite || !inviteInput.trim()}
              className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:opacity-80 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {joiningInvite ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
              Join
            </button>
          </div>
          {inviteError && <p className="mt-2 text-xs text-red-500">{inviteError}</p>}
        </div>

      </div>
    </NewAppShell>
  );
}
