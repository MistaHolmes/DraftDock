import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  Sparkles,
  X,
  Type,
  FileText,
  Tags,
  Search,
  Loader2,
  ChevronRight,
  Copy,
  Check,
  Wand2,
  ArrowRight,
  Bot,
  Zap,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

/* ── Types ───────────────────────────────────────────────── */

type ActiveTab = "title" | "content" | "tags" | "seo" | null;

interface AIAssistantPanelProps {
  /** Current blog content (markdown) */
  content: string;
  /** Current blog title */
  title: string;
  /** Current tags */
  currentTags: string[];
  /** Called when user selects a generated title */
  onTitleSelect: (title: string) => void;
  /** Called when user selects generated tags */
  onTagsSelect: (tags: string[]) => void;
  /** Called when SEO summary is generated */
  onSummaryGenerated: (summary: string) => void;
  /** Called when content is generated */
  onContentGenerated: (content: string) => void;
  /** Whether the panel is open */
  open: boolean;
  /** Toggle the panel */
  onToggle: () => void;
}

/* ── Component ───────────────────────────────────────────── */

const AIAssistantPanel = ({
  content,
  title,
  currentTags,
  onTitleSelect,
  onTagsSelect,
  onSummaryGenerated,
  onContentGenerated,
  open,
  onToggle,
}: AIAssistantPanelProps) => {
  const { getToken } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [loading, setLoading] = useState(false);

  // Title state
  const [titleDescription, setTitleDescription] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);

  // Content state
  const [contentTopic, setContentTopic] = useState("");
  const [contentTone, setContentTone] = useState<string>("professional");
  const [contentLength, setContentLength] = useState<string>("medium");
  const [generatedContent, setGeneratedContent] = useState("");

  // Tags state
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);

  // SEO state
  const [generatedSummary, setGeneratedSummary] = useState("");

  // UI state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onToggle();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onToggle]);

  /* ── API helper ────────────────────────────────────────── */

  const callAI = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/ai/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "AI request failed");
      }
      return res.json();
    },
    [getToken]
  );

  /* ── Handlers ──────────────────────────────────────────── */

  const handleGenerateTitle = async () => {
    const input = titleDescription.trim() || content.trim();
    if (!input) {
      setError("Please enter a description or write some content first.");
      return;
    }
    setLoading(true);
    setError("");
    setGeneratedTitles([]);
    try {
      const data = await callAI("suggest-titles", { content: input });
      setGeneratedTitles(data.titles || []);
    } catch {
      setError("Failed to generate titles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!contentTopic.trim()) {
      setError("Please enter a topic for your blog post.");
      return;
    }
    setLoading(true);
    setError("");
    setGeneratedContent("");
    try {
      const data = await callAI("generate-content", {
        topic: contentTopic.trim(),
        tone: contentTone,
        length: contentLength,
      });
      setGeneratedContent(data.content || "");
    } catch {
      setError("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTags = async () => {
    setLoading(true);
    setError("");
    setGeneratedTags([]);
    try {
      if (content.trim()) {
        const data = await callAI("suggest-tags", { content });
        setGeneratedTags(data.tags || []);
      } else {
        // Default tags when no content
        setGeneratedTags([
          "blog",
          "article",
          "technology",
          "tutorial",
          "guide",
        ]);
      }
    } catch {
      setError("Failed to generate tags. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSEO = async () => {
    if (!content.trim()) {
      setError(
        "Please write your blog content first before generating an SEO summary."
      );
      return;
    }
    setLoading(true);
    setError("");
    setGeneratedSummary("");
    try {
      const data = await callAI("generate-summary", { content });
      setGeneratedSummary(data.summary || "");
    } catch {
      setError("Failed to generate SEO summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setError("");
  };

  /* ── Tab config ────────────────────────────────────────── */

  const tabs: {
    key: ActiveTab;
    label: string;
    desc: string;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
  }[] = [
    {
      key: "title",
      label: "Generate Title",
      desc: "AI-crafted headlines from your description",
      icon: <Type size={16} />,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
    },
    {
      key: "content",
      label: "Generate Content",
      desc: "Full blog post from a topic",
      icon: <FileText size={16} />,
      gradient: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    },
    {
      key: "tags",
      label: "Generate Tags",
      desc: "Smart tags based on your content",
      icon: <Tags size={16} />,
      gradient: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "seo",
      label: "SEO Summary",
      desc: "Meta description for search engines",
      icon: <Search size={16} />,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    },
  ];

  /* ── Render ────────────────────────────────────────────── */

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onToggle}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col border-l border-gray-100 dark:border-gray-800 ai-panel-slide"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  AI Writing Assistant
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md uppercase tracking-wider">
                    Claude
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Powered by Claude · Ready to help
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Error Banner */}
          {error && (
            <div className="mx-5 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-2">
              <span className="text-red-500 text-xs mt-0.5">●</span>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-300 hover:text-red-500 transition flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Tab Selector (when no tab active) ──────── */}
          {!activeTab && (
            <div className="p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                <Zap size={12} />
                Choose an action
              </p>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => selectTab(tab.key)}
                  className="w-full text-left group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg hover:shadow-gray-100/50 dark:hover:shadow-gray-900/50 transition-all duration-200"
                >
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${tab.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                    >
                      {tab.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {tab.label}
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {tab.desc}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 dark:text-gray-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    />
                  </div>
                  {/* Hover gradient bar */}
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${tab.gradient} transition-all duration-300`}
                  />
                </button>
              ))}

              {/* Status hint */}
              <div className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles
                    size={13}
                    className="text-violet-500 dark:text-violet-400"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                    Quick tip
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Write your blog first for the best AI suggestions. Tags and
                  SEO summaries work best with existing content.
                </p>
              </div>
            </div>
          )}

          {/* ── Generate Title Tab ─────────────────────── */}
          {activeTab === "title" && (
            <div className="p-5 space-y-4">
              <button
                onClick={() => {
                  setActiveTab(null);
                  setError("");
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-violet-500 transition-colors mb-2"
              >
                <ChevronRight size={14} className="rotate-180" />
                Back to actions
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Type size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Generate Title
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Describe your blog and get catchy titles
                  </p>
                </div>
              </div>

              {/* Description input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                  What is your blog about?
                </label>
                <textarea
                  value={titleDescription}
                  onChange={(e) => setTitleDescription(e.target.value)}
                  placeholder="e.g., A beginner's guide to building REST APIs with Node.js and Express..."
                  rows={3}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {content.trim()
                    ? "Or leave empty to use your blog content"
                    : "Describe what you plan to write about"}
                </p>
              </div>

              <button
                onClick={handleGenerateTitle}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating titles...
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate Titles
                  </>
                )}
              </button>

              {/* Results */}
              {generatedTitles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 flex items-center gap-2">
                    <Sparkles size={11} />
                    Suggested titles — click to use
                  </p>
                  {generatedTitles.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onTitleSelect(t);
                        setActiveTab(null);
                      }}
                      className="w-full text-left group relative px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-400 font-medium leading-snug">
                          {t}
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-gray-300 group-hover:text-violet-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Generate Content Tab ───────────────────── */}
          {activeTab === "content" && (
            <div className="p-5 space-y-4">
              <button
                onClick={() => {
                  setActiveTab(null);
                  setError("");
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-blue-500 transition-colors mb-2"
              >
                <ChevronRight size={14} className="rotate-180" />
                Back to actions
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Generate Content
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Get a full blog post from your topic
                  </p>
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                  Topic
                </label>
                <input
                  type="text"
                  value={contentTopic}
                  onChange={(e) => setContentTopic(e.target.value)}
                  placeholder="e.g., Building a REST API with Node.js"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "professional", label: "Professional", emoji: "💼" },
                    { value: "casual", label: "Casual", emoji: "😊" },
                    { value: "educational", label: "Educational", emoji: "📚" },
                    { value: "humorous", label: "Humorous", emoji: "😄" },
                    { value: "inspirational", label: "Inspiring", emoji: "✨" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setContentTone(t.value)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                        contentTone === t.value
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 shadow-sm"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
                      }`}
                    >
                      <span className="mr-1">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                  Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "short",
                      label: "Short",
                      desc: "300-400 words",
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      desc: "500-700 words",
                    },
                    {
                      value: "long",
                      label: "Long",
                      desc: "900-1200 words",
                    },
                  ].map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setContentLength(l.value)}
                      className={`px-3 py-2.5 rounded-xl text-center border transition-all ${
                        contentLength === l.value
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold block ${
                          contentLength === l.value
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {l.label}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500">
                        {l.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateContent}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Writing your post...
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate Blog Post
                  </>
                )}
              </button>

              {/* Generated Content Preview */}
              {generatedContent && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 flex items-center gap-2">
                      <Sparkles size={11} />
                      Generated content
                    </p>
                    <button
                      onClick={() => handleCopy(generatedContent, -1)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-blue-500 transition"
                    >
                      {copiedIndex === -1 ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedIndex === -1 ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 max-h-60 overflow-y-auto no-scrollbar">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {generatedContent}
                    </pre>
                  </div>
                  <button
                    onClick={() => {
                      onContentGenerated(generatedContent);
                      setActiveTab(null);
                    }}
                    className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <ArrowRight size={14} />
                    Insert into Editor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Generate Tags Tab ──────────────────────── */}
          {activeTab === "tags" && (
            <div className="p-5 space-y-4">
              <button
                onClick={() => {
                  setActiveTab(null);
                  setError("");
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-emerald-500 transition-colors mb-2"
              >
                <ChevronRight size={14} className="rotate-180" />
                Back to actions
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Tags size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Generate Tags
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    {content.trim()
                      ? "Tags based on your blog content"
                      : "Default tags (write content for better results)"}
                  </p>
                </div>
              </div>

              {/* Current Tags */}
              {currentTags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                    Current tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!content.trim() && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    No blog content detected. We'll suggest some default tags.
                    Write your blog first for personalized suggestions.
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerateTags}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Finding best tags...
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate Tags
                  </>
                )}
              </button>

              {/* Generated Tags */}
              {generatedTags.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 flex items-center gap-2">
                    <Sparkles size={11} />
                    Suggested tags — click to add all
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generatedTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 cursor-default"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      onTagsSelect(generatedTags);
                      setActiveTab(null);
                    }}
                    className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Tags size={14} />
                    Add All Tags
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SEO Summary Tab ────────────────────────── */}
          {activeTab === "seo" && (
            <div className="p-5 space-y-4">
              <button
                onClick={() => {
                  setActiveTab(null);
                  setError("");
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-amber-500 transition-colors mb-2"
              >
                <ChevronRight size={14} className="rotate-180" />
                Back to actions
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Search size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    SEO Summary
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Generate a meta description for search engines
                  </p>
                </div>
              </div>

              {!content.trim() ? (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                    <FileText size={20} className="text-amber-500" />
                  </div>
                  <h5 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
                    Content needed
                  </h5>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                    Please write your blog content first. The AI needs
                    your article to craft an accurate SEO summary.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-1">
                      Content detected
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {content.split(/\s+/).filter(Boolean).length} words ·{" "}
                      {title || "No title set"}
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateSEO}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Crafting summary...
                      </>
                    ) : (
                      <>
                        <Wand2 size={14} />
                        Generate SEO Summary
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Generated Summary */}
              {generatedSummary && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 flex items-center gap-2">
                      <Sparkles size={11} />
                      Generated summary
                    </p>
                    <button
                      onClick={() => handleCopy(generatedSummary, -2)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-amber-500 transition"
                    >
                      {copiedIndex === -2 ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedIndex === -2 ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {generatedSummary}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {generatedSummary.length} characters
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onSummaryGenerated(generatedSummary);
                      setActiveTab(null);
                    }}
                    className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <ArrowRight size={14} />
                    Use This Summary
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                Claude AI · Anthropic
              </span>
            </div>
            <span className="text-[9px] text-gray-300 dark:text-gray-600 font-mono">
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* ── Animations ───────────────────────────────────── */}
      <style>{`
        @keyframes ai-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .ai-panel-slide {
          animation: ai-slide-in 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </>
  );
};

export default AIAssistantPanel;
