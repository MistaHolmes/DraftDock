import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, Tag, FileText, BookOpen, Loader2, ChevronRight, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface AISuggestionPanelProps {
  content: string;
  onTitleSelect?: (title: string) => void;
  onTagsSelect?: (tags: string[]) => void;
  onSummaryGenerated?: (summary: string) => void;
}

type ResultView = "titles" | "tags" | "summary" | "grammar" | null;

const AISuggestionPanel = ({ content, onTitleSelect, onTagsSelect, onSummaryGenerated }: AISuggestionPanelProps) => {
  const { getToken } = useAuth();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ResultView>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [grammar, setGrammar] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const target = e.target;
      if (target instanceof Node && !wrapperRef.current.contains(target)) {
        setOpen(false);
        setActiveView(null);
        setError("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const callAI = async (endpoint: string, body: any) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/ai/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("AI request failed");
    return res.json();
  };

  const handleSuggestTitles = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("titles"); setError("");
    try {
      const data = await callAI("suggest-titles", { content });
      setTitles(data.titles || []);
      setActiveView("titles");
    } catch { setError("Failed to get suggestions"); }
    finally { setLoading(null); }
  };

  const handleSuggestTags = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("tags"); setError("");
    try {
      const data = await callAI("suggest-tags", { content });
      setTags(data.tags || []);
      setActiveView("tags");
    } catch { setError("Failed to get suggestions"); }
    finally { setLoading(null); }
  };

  const handleGenerateSummary = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("summary"); setError("");
    try {
      const data = await callAI("generate-summary", { content });
      setSummary(data.summary || "");
      onSummaryGenerated?.(data.summary);
      setActiveView("summary");
    } catch { setError("Failed to generate summary"); }
    finally { setLoading(null); }
  };

  const handleCheckGrammar = async () => {
    if (!content.trim()) return setError("Write some content first");
    setLoading("grammar"); setError("");
    try {
      const data = await callAI("grammar-check", { text: content });
      setGrammar(data.suggestions || []);
      setActiveView("grammar");
    } catch { setError("Failed to check grammar"); }
    finally { setLoading(null); }
  };

  const actions: {
    label: string;
    subLabel: string;
    key: string;
    icon: React.ReactNode;
    handler: () => void;
  }[] = [
    {
      label: "Suggest stronger title",
      subLabel: "AI-powered headline ideas",
      key: "titles",
      icon: <Sparkles size={14} />,
      handler: handleSuggestTitles,
    },
    {
      label: "Suggest topic tags",
      subLabel: "Relevant tags for discovery",
      key: "tags",
      icon: <Tag size={14} />,
      handler: handleSuggestTags,
    },
    {
      label: "Generate meta description",
      subLabel: "SEO-ready summary",
      key: "summary",
      icon: <FileText size={14} />,
      handler: handleGenerateSummary,
    },
    {
      label: "Check grammar & style",
      subLabel: "Proofread your prose",
      key: "grammar",
      icon: <BookOpen size={14} />,
      handler: handleCheckGrammar,
    },
  ];

  return (
    <div ref={wrapperRef} className="fixed right-6 bottom-6 flex flex-col items-end gap-3 z-50 select-none">
      {/* ── Expandable panel ─────────────────────────────────── */}
      {open && (
        <div className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-2xl w-80 p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Sparkles size={15} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-headline text-gray-900 dark:text-white leading-none">
                  Editorial Assistant
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Ready to polish your prose</p>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); setActiveView(null); setError(""); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={14} />
            </button>
          </div>

          {error && (
            <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">{error}</p>
          )}

          {/* Action buttons */}
          <div className="space-y-1.5">
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={action.handler}
                disabled={!!loading}
                className="w-full text-left px-3 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800 transition-all group flex items-center justify-between disabled:opacity-50"
              >
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-400 font-medium">
                  <span className="text-violet-400 group-hover:text-violet-600 transition-colors">
                    {loading === action.key ? <Loader2 size={13} className="animate-spin" /> : action.icon}
                  </span>
                  {action.label}
                </span>
                <ChevronRight
                  size={13}
                  className="text-gray-300 group-hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all"
                />
              </button>
            ))}
          </div>

          {/* ── Results panel ───────────────────────────────── */}
          {activeView === "titles" && titles.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Suggested Titles</p>
              {titles.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { onTitleSelect?.(t); setActiveView(null); }}
                  className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-400 border border-transparent hover:border-violet-200 transition"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {activeView === "tags" && tags.length > 0 && (
            <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Suggested Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => onTagsSelect?.(tags)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-100 dark:border-violet-900 transition"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeView === "summary" && summary && (
            <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Generated Summary</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          {activeView === "grammar" && grammar.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Grammar Suggestions</p>
              {grammar.map((g, i) => (
                <div
                  key={i}
                  className="text-xs bg-amber-50 dark:bg-amber-900/10 rounded-xl p-2.5 border border-amber-200 dark:border-amber-800"
                >
                  <span className="line-through text-red-500">{g.original}</span>
                  <span className="text-green-600 dark:text-green-400 ml-1.5">→ {g.suggestion}</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 leading-snug">{g.reason}</p>
                </div>
              ))}
            </div>
          )}

          {activeView === "grammar" && grammar.length === 0 && !loading && (
            <p className="text-[10px] text-gray-400 text-center italic py-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              No grammar issues found ✓
            </p>
          )}
        </div>
      )}

      {/* ── Floating toggle button ────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        title="Editorial Assistant"
      >
        <Sparkles size={22} className={open ? "rotate-12" : ""} style={{ transition: "transform 0.2s" }} />
      </button>
    </div>
  );
};

export default AISuggestionPanel;
