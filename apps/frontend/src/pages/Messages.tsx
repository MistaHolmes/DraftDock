import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  Search,
  Paperclip,
  Smile,
  Info,
  CheckCheck,
  X,
  Image as ImageIcon,
  FileText,
  User,
  Mail,
  Calendar,
  ExternalLink,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// ── Emoji data (curated grid — no external dependency) ───────────────────────
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀","😂","🥹","😍","🤩","😎","🥳","😇","🤔","🫡","😏","😅","🤣","😊","😋","😜","🤗","🫣","😶","🙄","😮‍💨","😤","😢","🥺","😭","😱","🤯","🥶","🥵","😈"],
  },
  {
    label: "Gestures",
    emojis: ["👍","👎","👏","🙌","🤝","✌️","🤞","🫶","❤️","🔥","⭐","✨","💯","🎉","🎊","💪","👀","🧠","💀","👋","🫡","🤙","👊","✊","🤌","☝️","👆","👇","👈","👉"],
  },
  {
    label: "Objects",
    emojis: ["📝","📚","💻","📱","🎧","🎵","📸","🎬","🏆","⚡","💡","🔗","📌","🗓️","☕","🍕","🌮","🍩","🍷","🥂","🚀","✈️","🌍","🌙","☀️","🌈","🎯","🏠","💰","🎁"],
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  otherUser: { id: string; name?: string; email: string; profilePicture?: string };
  lastMessage?: { content: string; createdAt: string };
  lastMessageAt: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name?: string; email: string; profilePicture?: string };
}

// ── Component ─────────────────────────────────────────────────────────────────
const Messages = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Core state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Feature state
  const [showEmoji, setShowEmoji] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);

  // Refs
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Close emoji picker on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    const convId = searchParams.get("conv");
    if (convId && !activeConv && conversations.length > 0) setActiveConv(convId);
  }, [searchParams, conversations]);

  useEffect(() => {
    if (activeConv) {
      setMessages([]);
      setMessagesLoading(true);
      fetchMessages(activeConv);
      setShowInfo(false);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(() => fetchMessages(activeConv), 5000);
    return () => clearInterval(interval);
  }, [activeConv]);

  const authFetch = useCallback(async (url: string, opts: any = {}) => {
    const token = await getToken();
    return fetch(`${API_URL}${url}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
    });
  }, [getToken]);

  const fetchConversations = async () => {
    try {
      const res = await authFetch("/api/messaging/conversations");
      if (res.ok) setConversations(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await authFetch(`/api/messaging/conversations/${convId}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error(err); }
    finally { setMessagesLoading(false); }
  };

  // ── Send message (text + optional file mention) ────────────────────────────
  const sendMessage = async () => {
    let content = newMessage.trim();
    // If file is attached, append file info to message
    if (attachedFile) {
      const fileLabel = `📎 ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(1)} KB)`;
      content = content ? `${content}\n${fileLabel}` : fileLabel;
    }
    if (!content || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/messaging/conversations/${activeConv}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        clearAttachment();
        fetchConversations();
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  // ── Emoji insert ───────────────────────────────────────────────────────────
  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // ── File attach ────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachPreview(null);
    }
    inputRef.current?.focus();
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    setAttachPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const activeConversation = conversations.find((c) => c.id === activeConv);
  const getDisplayName = (user: { name?: string; email: string }) => user.name || user.email.split("@")[0];
  const getAvatar = (user: { name?: string; email: string; profilePicture?: string }) =>
    user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getDateLabel = (d: string) => {
    const dt = new Date(d);
    return dt.toDateString() === new Date().toDateString() ? formatTime(d) : formatDate(d);
  };

  const groupedMessages = messages.reduce(
    (g: { date: string; msgs: Message[] }[], msg) => {
      const date = formatDate(msg.createdAt);
      const last = g[g.length - 1];
      if (last && last.date === date) last.msgs.push(msg);
      else g.push({ date, msgs: [msg] });
      return g;
    }, []
  );

  const filteredConversations = conversations.filter((c) =>
    !searchQuery.trim() || getDisplayName(c.otherUser).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showList = !isMobile || !activeConv;
  const showChat = !isMobile || !!activeConv;

  /* ═══════════════════════════════════════════════════════════════════════════
   *  CONVERSATION LIST
   * ═══════════════════════════════════════════════════════════════════════════ */
  const ConversationList = () => (
    <aside
      className="bg-gray-50/80 dark:bg-gray-900/80 border-r border-gray-200/60 dark:border-gray-800/60 flex flex-col overflow-hidden"
      style={{ width: isMobile ? "100%" : 340, flexShrink: 0 }}
    >
      <div className="p-5 pb-3 space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-violet-600" />
            Messages
          </h2>
          {conversations.length > 0 && (
            <span className="bg-violet-600 text-white text-[10px] font-bold min-w-[20px] text-center px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          )}
        </div>
        <div className="relative group">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-2.5 w-36 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle size={36} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {searchQuery ? "No matches" : "No conversations yet"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Visit an author profile to start chatting</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 group ${
                  activeConv === conv.id
                    ? "bg-violet-50 dark:bg-violet-500/10 shadow-sm"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={getAvatar(conv.otherUser)}
                    alt=""
                    className={`w-11 h-11 rounded-full object-cover transition-all ${
                      activeConv === conv.id ? "ring-2 ring-violet-500" : "ring-1 ring-gray-200 dark:ring-gray-700"
                    }`}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-50 dark:border-gray-900 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className={`text-sm truncate ${activeConv === conv.id ? "font-bold text-violet-700 dark:text-violet-400" : "font-semibold text-gray-900 dark:text-white"}`}>
                      {getDisplayName(conv.otherUser)}
                    </h3>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 font-medium tabular-nums">
                      {conv.lastMessageAt ? getDateLabel(conv.lastMessageAt) : ""}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{conv.lastMessage.content}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
   *  EMOJI PICKER POPUP
   * ═══════════════════════════════════════════════════════════════════════════ */
  const EmojiPicker = () => (
    <div
      ref={emojiRef}
      className="absolute bottom-14 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 w-[320px] overflow-hidden"
      style={{ animation: "fadeInUp 0.15s ease-out" }}
    >
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Emoji</span>
        <button onClick={() => setShowEmoji(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-[260px] overflow-y-auto p-2 space-y-3">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-1.5">{cat.label}</p>
            <div className="grid grid-cols-10 gap-0.5">
              {cat.emojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => insertEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
   *  INFO PANEL (User details sidebar)
   * ═══════════════════════════════════════════════════════════════════════════ */
  const InfoPanel = () => {
    if (!activeConversation) return null;
    const user = activeConversation.otherUser;
    return (
      <div
        className="flex flex-col border-l border-gray-200/60 dark:border-gray-800/60 bg-gray-50/80 dark:bg-gray-900/80 overflow-y-auto"
        style={{ width: isMobile ? "100%" : 300, flexShrink: 0, animation: "fadeInUp 0.2s ease-out" }}
      >
        {/* Close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-bold text-gray-900 dark:text-white">Contact Info</span>
          <button onClick={() => setShowInfo(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center p-6 pb-4">
          <img
            src={getAvatar(user)}
            alt=""
            className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-100 dark:ring-violet-500/20 mb-3 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate(`/author/${user.id}`)}
          />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{getDisplayName(user)}</h3>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Online</span>
          </div>
        </div>

        {/* Details */}
        <div className="px-5 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Mail size={14} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Email</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Username</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{getDisplayName(user)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={14} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Messages</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{messages.length} total</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 mt-3 space-y-2">
          <button
            onClick={() => navigate(`/author/${user.id}`)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-all active:scale-[0.98]"
          >
            <ExternalLink size={13} />
            View Profile
          </button>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   *  CHAT PANEL
   * ═══════════════════════════════════════════════════════════════════════════ */
  const ChatPanel = () => (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
      {activeConv && activeConversation ? (
        <>
          {/* ── Header ── */}
          <header className="flex-shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setActiveConv(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <button className="relative group" onClick={() => navigate(`/author/${activeConversation.otherUser.id}`)}>
                <img
                  src={getAvatar(activeConversation.otherUser)}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover transition-all duration-200 group-hover:scale-110 group-hover:ring-2 group-hover:ring-violet-500"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
              </button>
              <div>
                <h2
                  className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors leading-tight"
                  onClick={() => navigate(`/author/${activeConversation.otherUser.id}`)}
                >
                  {getDisplayName(activeConversation.otherUser)}
                </h2>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Online</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-0.5">
              {/* Info — toggles panel */
              <button
                title="Contact info"
                onClick={() => setShowInfo((v) => !v)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  showInfo
                    ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600"
                    : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <Info size={16} />
              </button>
              }
            </div>
          </header>

          {/* ── Messages area ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 bg-gray-50/50 dark:bg-gray-950">
            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-violet-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={24} className="text-violet-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No messages yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Say hello to {getDisplayName(activeConversation.otherUser)}!
                  </p>
                </div>
              </div>
            ) : (
              groupedMessages.map((group, gIdx) => (
                <div key={gIdx} className="space-y-2.5">
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px flex-1 bg-gray-200/70 dark:bg-gray-800/70" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 font-semibold px-1">{group.date}</span>
                    <div className="h-px flex-1 bg-gray-200/70 dark:bg-gray-800/70" />
                  </div>
                  {group.msgs.map((msg) => {
                    const isSent = msg.senderId !== activeConversation.otherUser.id;
                    return isSent ? (
                      <div key={msg.id} className="flex flex-col items-end gap-0.5 ml-auto max-w-[80%] md:max-w-[65%]" style={{ animation: "fadeInUp 0.2s ease-out" }}>
                        <div className="bg-violet-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 pr-1">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(msg.createdAt)}</span>
                          <CheckCheck size={12} className="text-violet-400" />
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id} className="flex items-end gap-2 max-w-[80%] md:max-w-[65%]" style={{ animation: "fadeInUp 0.2s ease-out" }}>
                        <img
                          src={getAvatar(msg.sender)}
                          alt=""
                          className="w-7 h-7 rounded-full flex-shrink-0 cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-200 dark:ring-gray-700"
                          onClick={() => navigate(`/author/${msg.sender.id}`)}
                        />
                        <div>
                          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed border border-gray-100 dark:border-gray-700/50 shadow-sm whitespace-pre-wrap">
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-1 mt-0.5 block">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEnd} />
          </div>

          {/* ── Attachment preview bar ── */}
          {attachedFile && (
            <div className="flex-shrink-0 px-4 py-2 bg-violet-50 dark:bg-violet-500/5 border-t border-violet-200/60 dark:border-violet-500/10 flex items-center gap-3">
              {attachPreview ? (
                <img src={attachPreview} alt="" className="w-10 h-10 rounded-lg object-cover border border-violet-200 dark:border-violet-500/20" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                  <FileText size={16} className="text-violet-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{attachedFile.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{(attachedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={clearAttachment} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Input bar ── */}
          <footer className="flex-shrink-0 p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="relative">
              {/* Emoji picker popup */}
              {showEmoji && <EmojiPicker />}

              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5 py-1">
                {/* Emoji button */}
                <button
                  onClick={() => setShowEmoji((v) => !v)}
                  title="Emoji"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    showEmoji
                      ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Smile size={16} />
                </button>

                {/* File attach button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    attachedFile
                      ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {attachedFile ? <ImageIcon size={16} /> : <Paperclip size={16} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={attachedFile ? "Add a caption..." : "Type a message..."}
                  className="flex-1 bg-transparent border-none py-2 px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none min-w-0"
                />

                {/* Send */}
                <button
                  onClick={sendMessage}
                  disabled={sending || (!newMessage.trim() && !attachedFile)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-violet-600 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </footer>
        </>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mb-4">
            <MessageCircle size={30} className="text-violet-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">Your Messages</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-5 text-sm">
            Select a conversation to start chatting, or visit an author's profile to send them a message.
          </p>
          <button
            onClick={() => navigate("/explore")}
            className="text-white px-5 py-2 rounded-full font-semibold bg-violet-600 hover:bg-violet-700 transition-all active:scale-95 text-sm"
          >
            Explore Authors
          </button>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
   *  RENDER
   * ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="flex h-full" style={{ overflow: "hidden" }}>
        {showList && <ConversationList />}
        {showChat && <ChatPanel />}
        {showInfo && !isMobile && <InfoPanel />}
        {/* Mobile info overlay */}
        {showInfo && isMobile && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end" onClick={() => setShowInfo(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "85%" }}>
              <InfoPanel />
            </div>
          </div>
        )}
      </div>

    </>
  );
};

export default Messages;
