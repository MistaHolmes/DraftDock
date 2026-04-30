import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import axios from "axios";
import { NewAppShell } from "@/components/new-components";
import { Upload, X as CloseIcon, Plus, Sparkles, Bot } from "lucide-react";
import AIAssistantPanel from "@/components/editor/AIAssistantPanel";

export function BlogForm() {
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { blogId } = useParams<{ blogId?: string }>();
  const isEditMode = !!blogId;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    published: true,
    coverImage: "",
    summary: "",
    tags: [] as string[],
    scheduledAt: ""
  });
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<{ title?: string; content?: string; server?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [autoSaved, setAutoSaved] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const AUTO_SAVE_KEY = "draftdock_autosave";

  // If edit mode, fetch existing blog data
  useEffect(() => {
    if (!isEditMode || !blogId) {
      try {
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed }));
        }
      } catch { /* ignore */ }
      setLoadingExisting(false);
      return;
    }

    const loadBlog = async () => {
      try {
        const token = await getToken();
        if (blogId) {
          const { data } = await axios.get(`${API_URL}/api/blogs/${blogId}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          setFormData({
            title: data.title || "",
            content: data.content || "",
            published: data.published ?? true,
            coverImage: data.coverImage || "",
            summary: data.summary || "",
            tags: data.tags?.map((t: any) => t.name) || [],
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : ""
          });
        }
      } catch (err) {
        console.error("Failed to load blog for editing:", err);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadBlog();
  }, [blogId]);

  // Auto-save
  useEffect(() => {
    if (isEditMode) return;
    const interval = setInterval(() => {
      if (formData.title || formData.content) {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, isEditMode]);

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !formData.tags.includes(t)) {
      setFormData({ ...formData, tags: [...formData.tags, t] });
    }
    setNewTag("");
  };

  // Start collaboration session. If creating a new blog, create it first then start.
  const startCollaboration = async () => {
    setStartLoading(true);
    setErrors({});
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      let id = blogId;

      if (!isEditMode) {
        // create a new blog as unpublished draft first
        const payload = { ...formData, published: false };
        const res = await axios.post(`${API_URL}/api/blogs`, payload, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        id = res.data.blog.id;
        // attach tags
        await axios.put(`${API_URL}/api/blogs/${id}/tags`, { tags: formData.tags }, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
      }

      if (!id) throw new Error('Blog id not available');

      // Call backend to start collab session
      await axios.post(`${API_URL}/api/collab/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Navigate into the collaborative editor
      navigate(`/collab/${id}`);
    } catch (err) {
      console.error('Failed to start collaboration:', err);
      setErrors({ server: axios.isAxiosError(err) ? err.response?.data?.error || 'Failed to start collaboration' : 'Failed to start collaboration' });
    } finally {
      setStartLoading(false);
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleDraftSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(e as unknown as React.FormEvent, true);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setErrors({});

    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = formData.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    if (!textContent.trim()) {
      setErrors({ content: "Content is required" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const payload = { ...formData, published: !isDraft };

      let response;
      if (isEditMode) {
        response = await axios.put(`${API_URL}/api/blogs/${blogId}`, payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        // Update tags separately if needed or as part of payload
        await axios.put(`${API_URL}/api/blogs/${blogId}/tags`, { tags: formData.tags }, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });

        if (response.status === 200) {
          localStorage.removeItem(AUTO_SAVE_KEY);
          navigate(`/blog/${blogId}`);
        }
      } else {
        response = await axios.post(`${API_URL}/api/blogs`, payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        const newId = response.data.blog.id;
        // Associate tags
        await axios.put(`${API_URL}/api/blogs/${newId}/tags`, { tags: formData.tags }, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });

        if (response.status === 201) {
          localStorage.removeItem(AUTO_SAVE_KEY);
          navigate("/blogs");
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrors({
        server: axios.isAxiosError(error)
          ? error.response?.data?.message || "Submission failed"
          : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = formData.content.trim().split(/\s+/).filter(Boolean).length;

  const insertMd = useCallback(
    (prefix: string, suffix: string, blockMode: boolean) => {
      const el = contentRef.current;
      if (!el) return;
      const start = el.selectionStart ?? 0;
      const end   = el.selectionEnd   ?? 0;
      const selected = formData.content.slice(start, end);
      let snippet: string;
      if (blockMode) {
        const lineStart = formData.content.lastIndexOf("\n", start - 1) + 1;
        const before = formData.content.slice(0, lineStart);
        const after  = formData.content.slice(lineStart);
        snippet = before + prefix + after;
      } else {
        snippet =
          formData.content.slice(0, start) +
          prefix +
          (selected || "text") +
          suffix +
          formData.content.slice(end);
      }
      setFormData(fd => ({ ...fd, content: snippet }));
      setTimeout(() => {
        el.focus();
        const pos = blockMode ? start + prefix.length : start + prefix.length + (selected || "text").length + suffix.length;
        el.setSelectionRange(pos, pos);
      }, 0);
    },
    [formData.content]
  );

  if (loadingExisting) {
    return (
      <div className="flex min-h-screen bg-[#f5f7f9] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#702ae1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* ── AI Assistant Panel ─────────────────────────── */}
      <AIAssistantPanel
        content={formData.content}
        title={formData.title}
        currentTags={formData.tags}
        open={showAIPanel}
        onToggle={() => setShowAIPanel(v => !v)}
        onTitleSelect={(title) => setFormData(fd => ({ ...fd, title }))}
        onTagsSelect={(tags) => setFormData(fd => ({ ...fd, tags: [...new Set([...fd.tags, ...tags])] }))}
        onSummaryGenerated={(summary) => setFormData(fd => ({ ...fd, summary }))}
        onContentGenerated={(content) => setFormData(fd => ({ ...fd, content: fd.content ? fd.content + '\n\n' + content : content }))}
      />

      <NewAppShell hideRightPanel hideFooter>
        {/* ── Main Editorial Canvas ─────────────────────────────── */}
        <main className="pt-6 flex flex-col h-[calc(100vh-4.5rem)] px-4 md:px-8">

          {/* ── Toolbar Container ────────────────────────────────── */}
          <div className="px-0 md:px-8 mb-4 md:mb-6 flex-shrink-0">
            <div className="bg-white rounded-xl p-2 flex items-center justify-between shadow-sm border border-gray-100/50">

              {/* ── Format buttons ── */}
              <div className="flex items-center gap-0.5 flex-nowrap overflow-x-auto no-scrollbar px-2 -mx-2">
                {([
                  { icon: "format_bold",          label: "Bold",            md: { p: "**",           s: "**",       block: false } },
                  { icon: "format_italic",         label: "Italic",          md: { p: "*",            s: "*",        block: false } },
                  { icon: "strikethrough_s",       label: "Strikethrough",   md: { p: "~~",           s: "~~",       block: false } },
                  { icon: "DIV" },
                  { icon: "looks_one",             label: "Heading 1",       md: { p: "# ",           s: "",         block: true  } },
                  { icon: "looks_two",             label: "Heading 2",       md: { p: "## ",          s: "",         block: true  } },
                  { icon: "looks_3",               label: "Heading 3",       md: { p: "### ",         s: "",         block: true  } },
                  { icon: "DIV" },
                  { icon: "format_list_bulleted",  label: "Bullet List",     md: { p: "- ",           s: "",         block: true  } },
                  { icon: "format_list_numbered",  label: "Numbered List",   md: { p: "1. ",          s: "",         block: true  } },
                  { icon: "checklist",             label: "Task List",       md: { p: "- [ ] ",       s: "",         block: true  } },
                  { icon: "DIV" },
                  { icon: "format_quote",          label: "Blockquote",      md: { p: "> ",           s: "",         block: true  } },
                  { icon: "horizontal_rule",       label: "Divider",         md: { p: "\n\n---\n\n",  s: "",         block: false } },
                  { icon: "table_chart",           label: "Table",           md: { p: "| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| Cell  | Cell  | Cell  |\n", s: "", block: false } },
                  { icon: "DIV" },
                  { icon: "code",                  label: "Code Block",      md: { p: "```\n",        s: "\n```",    block: false } },
                  { icon: "data_object",           label: "Inline Code",     md: { p: "`",            s: "`",        block: false } },
                  { icon: "link",                  label: "Link",            md: { p: "[",            s: "](url)",   block: false } },
                  { icon: "image",                 label: "Image",           md: { p: "![alt](",      s: ")",        block: false } },
                ] as Array<{ icon: string; label?: string; md?: { p: string; s: string; block: boolean } }>
                ).map((item, idx) =>
                  item.icon === "DIV" ? (
                    <span key={idx} className="inline-block mx-1 h-4 w-px bg-slate-100 self-center" />
                  ) : (
                    <button
                      key={idx}
                      type="button"
                      title={item.label}
                      onClick={() => item.md && insertMd(item.md.p, item.md.s, item.md.block)}
                      className="relative p-1.5 hover:bg-purple-100/40 rounded-lg text-slate-500 hover:text-[#702ae1] transition-colors group/tb"
                    >
                      <span className="material-symbols-outlined select-none" style={{ fontSize: 19, display: "block", lineHeight: 1 }}>
                        {item.icon}
                      </span>
                      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tb:opacity-100 transition-opacity z-20">
                        {item.label}
                      </span>
                    </button>
                  )
                )}
              </div>

              {/* ── Right side: help + publish settings + word count + status + actions ── */}
              <div className="flex items-center gap-2 px-2 flex-shrink-0">
                {/* AI Assistant button */}
                <button
                  type="button"
                  onClick={() => setShowAIPanel(v => !v)}
                  title="AI Writing Assistant"
                  className="p-1.5 hover:bg-purple-100/40 rounded-lg text-slate-400 hover:text-[#702ae1] transition-colors flex items-center gap-1.5 group"
                >
                  <Bot size={17} className="group-hover:text-[#702ae1] transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">AI</span>
                </button>

                {/* Help button */}
                <button
                  type="button"
                  onClick={() => setShowHelpDialog(true)}
                  title="Formatting help"
                  className="p-1.5 hover:bg-purple-100/40 rounded-lg text-slate-400 hover:text-[#702ae1] transition-colors"
                >
                  <span className="material-symbols-outlined select-none" style={{ fontSize: 19, display: "block", lineHeight: 1 }}>help_outline</span>
                </button>

                {/* Publish Settings quick access (moved from left panel) */}
                <button
                  type="button"
                  onClick={() => setShowPublishDialog(true)}
                  title="Publish Settings"
                  className="p-1.5 ml-1 hover:bg-purple-100/40 rounded-lg text-slate-400 hover:text-[#702ae1] transition-colors"
                >
                  <span className="material-symbols-outlined select-none" style={{ fontSize: 19, display: "block", lineHeight: 1 }}>tune</span>
                </button>

                <div className="h-4 w-px bg-slate-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {wordCount} words
                </span>
                <div className="h-4 w-px bg-slate-200" />
                <span className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${autoSaved ? "text-[#702ae1]" : "text-slate-400"}`}>
                  {autoSaved ? "Saved to cloud" : "Editing\u2026"}
                </span>
                <div className="h-4 w-px bg-slate-200" />
                {isSubmitting ? (
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Publishing…</span>
                ) : (
                  <>
                    {!isEditMode && (
                      <button
                        onClick={handleDraftSubmit}
                        className="hidden md:inline-block px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-[#702ae1] transition-colors whitespace-nowrap"
                      >
                        Save Draft
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleSubmit(e, !!formData.scheduledAt)}
                        className="px-4 py-1.5 bg-[#702ae1] text-white rounded-xl text-[11px] font-bold shadow-sm hover:bg-[#6411d5] transition-all active:scale-95 whitespace-nowrap"
                      >
                        {isEditMode ? "Update" : formData.scheduledAt ? "Schedule" : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={startCollaboration}
                        disabled={startLoading || isSubmitting}
                        className={`ml-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${startLoading || isSubmitting ? 'opacity-60' : 'bg-white text-[#702ae1] border border-[#702ae1] hover:bg-[#f8f6ff]'}`}
                      >
                        {startLoading ? 'Starting…' : 'Start Collaboration'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Server error banner */}
            {errors.server && (
              <div className="mt-3 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium">
                {errors.server}
              </div>
            )}
          </div>

          {/* ── Split Editor Layout ───────────────────────────────── */}
          <div className="flex-1 px-0 md:px-8 pb-8 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0">

            {/* Left – Markdown Input */}
            <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100/30 flex flex-col overflow-hidden">
              <div className="p-6 md:p-10 flex-1 overflow-y-auto no-scrollbar flex flex-col">

                {/* Title */}
                <input
                  ref={titleRef}
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title..."
                  className={`w-full text-3xl md:text-4xl font-extrabold text-gray-900 border-none focus:ring-0 focus:outline-none p-0 mb-8 bg-transparent leading-tight placeholder:text-slate-300 ${errors.title ? "placeholder:text-red-300" : ""}`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 font-semibold -mt-6 mb-6 uppercase tracking-widest">{errors.title}</p>
                )}

                {/* Markdown Content */}
                <textarea
                  ref={contentRef}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={"Start your masterpiece here using markdown...\n\n# Heading\n**bold**, *italic*\n> blockquote\n- list item\n```code```"}
                  spellCheck
                  className="flex-1 w-full border-none focus:ring-0 focus:outline-none p-0 text-base md:text-lg leading-relaxed text-slate-600 font-mono resize-none min-h-[260px] md:min-h-[400px] bg-transparent placeholder:text-slate-300"
                />
                {errors.content && (
                  <p className="text-xs text-red-500 font-semibold mt-2 uppercase tracking-widest">{errors.content}</p>
                )}

                {/* Publish settings moved to toolbar */}
              </div>
            </section>

            {/* Right – Live Preview */}
            <section className="flex-1 bg-[#eef1f3] rounded-2xl flex flex-col overflow-hidden mt-6 lg:mt-0">
              <div className="px-6 py-3 border-b border-white/20 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Preview</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white shadow-inner m-2 md:m-4 rounded-xl no-scrollbar">
                <div data-color-mode="light">
                  {formData.title.trim() && (
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {formData.title}
                    </h1>
                  )}
                  {formData.coverImage && (
                    <div className="w-full aspect-video rounded-xl mb-8 overflow-hidden">
                      <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <MDEditor.Markdown
                    source={formData.content.trim() ? formData.content : "*Start typing on the left to see the preview here…*"}
                    style={{ background: "transparent", fontSize: 16, lineHeight: 1.8 }}
                  />
                </div>
              </div>
            </section>

          </div>
        </main>
      </NewAppShell>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* Hidden file input — always mounted so ref is valid */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setFormData((fd) => {
                const updated = { ...fd, coverImage: dataUrl };
                localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(updated));
                return updated;
              });
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {/* ──────────────── Publish Settings Dialog ──────────────── */}
      {showPublishDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPublishDialog(false)} />

          {/* Dialog card */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden dlg-zoom">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Publish Settings</h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.16em] mt-0.5">Tags · Cover · SEO · Schedule</p>
              </div>
              <button onClick={() => setShowPublishDialog(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition">
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto no-scrollbar">

              {/* ─ Tags */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="text-slate-300 hover:text-red-400 transition">
                        <CloseIcon size={11} />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1.5 border border-dashed border-slate-200 rounded-lg px-3 py-1 focus-within:border-[#702ae1] transition">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))}
                      placeholder="Add tag…"
                      className="w-20 bg-transparent border-0 focus:ring-0 text-xs font-semibold p-0 text-slate-600 placeholder:text-slate-300"
                    />
                    <button onClick={() => addTag(newTag)}><Plus size={13} className="text-[#702ae1]" /></button>
                  </div>
                </div>
              </div>

              {/* ─ Cover Image */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Cover Image</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!formData.title && !formData.content) return alert("Write something first!");
                        setIsSubmitting(true);
                        try {
                          const token = await getToken();
                          const res = await axios.post(`${API_URL}/api/ai/generate-image`,
                            { prompt: formData.title || formData.content.slice(0, 100) },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          const aiUrl = res.data.imageUrl as string;
                          setFormData((fd) => {
                            const updated = { ...fd, coverImage: aiUrl };
                            localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(updated));
                            return updated;
                          });
                        } finally { setIsSubmitting(false); }
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#702ae1] hover:bg-purple-50 px-2 py-1 rounded-lg transition"
                    >
                      <Sparkles size={11} /> AI Generate
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
                    >
                      <Upload size={11} /> Upload
                    </button>
                  </div>
                </div>
                {formData.coverImage ? (
                  <div className="relative rounded-xl overflow-hidden group">
                    <img src={formData.coverImage} alt="Cover" className="w-full h-36 object-cover" />
                    <button
                      onClick={() => setFormData((fd) => {
                        const updated = { ...fd, coverImage: "" };
                        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(updated));
                        return updated;
                      })}
                      className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#702ae1] hover:bg-purple-50/30 transition-all group"
                  >
                    <Upload size={18} className="text-slate-300 group-hover:text-[#702ae1] transition-colors" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#702ae1] transition-colors">Drop or click to upload</p>
                  </div>
                )}
              </div>

              {/* ─ SEO Summary */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">SEO Summary</p>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief summary for social sharing & SEO…"
                  rows={3}
                  className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 resize-none focus:ring-1 focus:ring-[#702ae1] focus:outline-none text-slate-600 placeholder:text-slate-300"
                />
              </div>

              {/* ─ Schedule */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={!!formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.checked ? new Date(Date.now() + 86400000).toISOString().slice(0, 16) : "" })}
                    className="w-4 h-4 rounded border-slate-200 text-[#702ae1] focus:ring-[#702ae1]"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Schedule Launch</span>
                </label>
                {formData.scheduledAt && (
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-600 focus:ring-1 focus:ring-[#702ae1] focus:outline-none"
                  />
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400">{formData.tags.length} tag{formData.tags.length !== 1 ? "s" : ""} · {formData.coverImage ? "Cover set" : "No cover"}{formData.scheduledAt ? " · Scheduled" : ""}</p>
              <button
                onClick={() => setShowPublishDialog(false)}
                className="px-5 py-2 bg-[#702ae1] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#6411d5] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── Help Dialog ──────────────────── */}
      {showHelpDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelpDialog(false)} />

          <div className="relative w-full max-w-2xl bg-[#0d1117] rounded-2xl shadow-2xl border border-white/10 overflow-hidden dlg-zoom">

            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="ml-3 text-[11px] font-mono text-white/30">markdown-cheatsheet.md</span>
              </div>
              <button onClick={() => setShowHelpDialog(false)} className="p-1 hover:bg-white/10 rounded-lg text-white/30 hover:text-white/60 transition">
                <CloseIcon size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[72vh] no-scrollbar font-mono text-[12.5px] leading-6 space-y-5">

              {/* ── Headings */}
              <div>
                <p className="text-[#8b949e] text-[9px] font-sans font-black uppercase tracking-[0.2em] pb-1.5 border-b border-white/5 mb-3">Headings</p>
                <div className="space-y-1">
                  <p><span className="text-[#79c0ff]"># </span><span className="text-[#c9d1d9]">Heading 1</span><span className="text-[#8b949e] ml-4 text-[11px]">// &lt;h1&gt; large title</span></p>
                  <p><span className="text-[#79c0ff]">## </span><span className="text-[#c9d1d9]">Heading 2</span><span className="text-[#8b949e] ml-4 text-[11px]">// &lt;h2&gt; section header</span></p>
                  <p><span className="text-[#79c0ff]">### </span><span className="text-[#c9d1d9]">Heading 3</span><span className="text-[#8b949e] ml-4 text-[11px]">// &lt;h3&gt; subsection</span></p>
                </div>
              </div>

              {/* ── Emphasis */}
              <div>
                <p className="text-[#8b949e] text-[9px] font-sans font-black uppercase tracking-[0.2em] pb-1.5 border-b border-white/5 mb-3">Emphasis</p>
                <div className="space-y-1">
                  <p><span className="text-[#d2a8ff]">**</span><span className="text-[#7ee787]">bold text</span><span className="text-[#d2a8ff]">**</span><span className="text-[#8b949e] ml-4 text-[11px]">// strong</span></p>
                  <p><span className="text-[#d2a8ff]">*</span><span className="text-[#ffa657]">italic text</span><span className="text-[#d2a8ff]">*</span><span className="text-[#8b949e] ml-4 text-[11px]">// or use _italic_</span></p>
                  <p><span className="text-[#d2a8ff]">~~</span><span className="text-[#8b949e] line-through">strikethrough</span><span className="text-[#d2a8ff]">~~</span><span className="text-[#8b949e] ml-4 text-[11px]">// crossed out</span></p>
                  <p><span className="text-[#d2a8ff]">**</span><span className="text-[#7ee787]">bold</span><span className="text-[#d2a8ff]">** and *</span><span className="text-[#ffa657]">italic</span><span className="text-[#d2a8ff]">*</span><span className="text-[#8b949e] ml-4 text-[11px]">// combined</span></p>
                </div>
              </div>

              {/* ── Lists */}
              <div>
                <p className="text-[#8b949e] text-[9px] font-sans font-black uppercase tracking-[0.2em] pb-1.5 border-b border-white/5 mb-3">Lists</p>
                <div className="space-y-1">
                  <p><span className="text-[#56d364]">- </span><span className="text-[#c9d1d9]">Unordered item</span><span className="text-[#8b949e] ml-4 text-[11px]">// also * or +</span></p>
                  <p><span className="text-[#56d364]">1. </span><span className="text-[#c9d1d9]">Ordered item</span><span className="text-[#8b949e] ml-4 text-[11px]">// numbered list</span></p>
                  <p><span className="text-[#56d364]">- [ ] </span><span className="text-[#c9d1d9]">Task to do</span><span className="text-[#8b949e] ml-4 text-[11px]">// checkbox</span></p>
                  <p><span className="text-[#56d364]">- [x] </span><span className="text-[#c9d1d9]">Completed task</span><span className="text-[#8b949e] ml-4 text-[11px]">// checked</span></p>
                </div>
              </div>

              {/* ── Links & Images */}
              <div>
                <p className="text-[#8b949e] text-[9px] font-sans font-black uppercase tracking-[0.2em] pb-1.5 border-b border-white/5 mb-3">Links &amp; Images</p>
                <div className="space-y-1">
                  <p><span className="text-[#c9d1d9]">[</span><span className="text-[#58a6ff]">link text</span><span className="text-[#c9d1d9]">](</span><span className="text-[#a5d6ff]">https://url.com</span><span className="text-[#c9d1d9]">)</span><span className="text-[#8b949e] ml-4 text-[11px]">// hyperlink</span></p>
                  <p><span className="text-[#c9d1d9]">![</span><span className="text-[#ffa657]">alt text</span><span className="text-[#c9d1d9]">](</span><span className="text-[#a5d6ff]">image.png</span><span className="text-[#c9d1d9]">)</span><span className="text-[#8b949e] ml-4 text-[11px]">// image embed</span></p>
                </div>
              </div>

              {/* ── Code */}
              <div>
                <p className="text-[#8b949e] text-[9px] font-sans font-black uppercase tracking-[0.2em] pb-1.5 border-b border-white/5 mb-3">Code</p>
                <div className="space-y-1">
                  <p><span className="text-[#f47067]">`</span><span className="text-[#f47067]">inline code</span><span className="text-[#f47067]">`</span><span className="text-[#8b949e] ml-4 text-[11px]">// monospace span</span></p>
                  <p><span className="text-[#f47067]">```</span><span className="text-[#c9d1d9]">javascript</span><span className="text-[#8b949e] ml-4 text-[11px]">// fenced code block</span></p>
                  <p className="pl-4"><span className="text-[#7ee787]">const</span> <span className="text-[#c9d1d9]">x</span> <span className="text-[#d2a8ff]">=</span> <span className="text-[#ffa657]">42</span><span className="text-[#c9d1d9]">;</span></p>
                  <p><span className="text-[#f47067]">```</span><span className="text-[#8b949e] ml-4 text-[11px]">// closing fence</span></p>
                </div>
              </div>

              {/* ── Blockquote & Divider */}
              <div>
                <p className="text-[#8b949e] text-[9px] font-sans font-black uppercase tracking-[0.2em] pb-1.5 border-b border-white/5 mb-3">Blockquotes &amp; Dividers</p>
                <div className="space-y-1">
                  <p><span className="text-[#e3b341]">&gt; </span><span className="text-[#c9d1d9]">Quoted text</span><span className="text-[#8b949e] ml-4 text-[11px]">// blockquote</span></p>
                  <p><span className="text-[#e3b341]">&gt;&gt; </span><span className="text-[#c9d1d9]">Nested quote</span><span className="text-[#8b949e] ml-4 text-[11px]">// nested</span></p>
                  <p><span className="text-[#c9d1d9]">---</span><span className="text-[#8b949e] ml-4 text-[11px]">// horizontal rule / &lt;hr&gt;</span></p>
                </div>
              </div>

              {/* ── Tables */}
              <div>
                <p className="text-[#8b949e] text-[9px] font-sans font-black uppercase tracking-[0.2em] pb-1.5 border-b border-white/5 mb-3">Tables</p>
                <div className="space-y-1">
                  <p><span className="text-[#a5d6ff]">| Col 1 </span><span className="text-[#8b949e]">|</span><span className="text-[#a5d6ff]"> Col 2 </span><span className="text-[#8b949e]">|</span></p>
                  <p><span className="text-[#8b949e]">|-------|-------|</span><span className="text-[#8b949e] ml-4 text-[11px]">// separator row</span></p>
                  <p><span className="text-[#a5d6ff]">| Cell  </span><span className="text-[#8b949e]">|</span><span className="text-[#a5d6ff]"> Cell  </span><span className="text-[#8b949e]">|</span><span className="text-[#8b949e] ml-4 text-[11px]">// data row</span></p>
                </div>
              </div>

              {/* ── Keyboard tip */}
              <div className="mt-4 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[#8b949e] text-[10px] font-sans">
                  <span className="text-[#7ee787] font-bold">Tip:</span> Select text in the editor, then click a toolbar button to wrap it.
                  Use <span className="bg-white/10 px-1.5 py-0.5 rounded text-[#c9d1d9]">Enter</span> after a list item to continue the list,
                  or press <span className="bg-white/10 px-1.5 py-0.5 rounded text-[#c9d1d9]">Backspace</span> on an empty item to exit.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes dlg-zoom { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .dlg-zoom { animation: dlg-zoom 0.18s cubic-bezier(0.22,1,0.36,1); }

        [data-color-mode="light"] .wmde-markdown { background: transparent !important; }
        [data-color-mode="light"] .wmde-markdown h1 { font-size: 1.9rem; font-weight: 800; color: #111827; margin-bottom: .75rem; }
        [data-color-mode="light"] .wmde-markdown h2 { font-size: 1.5rem; font-weight: 700; color: #702ae1; margin-bottom: .5rem; }
        [data-color-mode="light"] .wmde-markdown h3 { font-size: 1.2rem; font-weight: 700; color: #1f2937; margin-bottom: .4rem; }
        [data-color-mode="light"] .wmde-markdown p  { color: #4b5563; line-height: 1.8; margin-bottom: 1rem; font-size: 1rem; }
        [data-color-mode="light"] .wmde-markdown blockquote {
          border-left: 4px solid #702ae1;
          background: rgba(112,42,225,.05);
          padding: .5rem 1.5rem;
          border-radius: 0 .5rem .5rem 0;
          color: #6b7280;
          margin-bottom: 1rem;
          font-style: italic;
        }
        [data-color-mode="light"] .wmde-markdown ul { list-style: none; padding-left: 0; margin-bottom: 1rem; }
        [data-color-mode="light"] .wmde-markdown ul li { display: flex; align-items: center; gap: .75rem; color: #4b5563; margin-bottom: .4rem; }
        [data-color-mode="light"] .wmde-markdown ul li::before {
          content: ""; display: inline-block;
          width: .375rem; height: .375rem;
          background: #702ae1; border-radius: 9999px; flex-shrink: 0;
        }
        [data-color-mode="light"] .wmde-markdown ol { padding-left: 1.5rem; list-style: decimal; margin-bottom: 1rem; }
        [data-color-mode="light"] .wmde-markdown ol li { color: #4b5563; margin-bottom: .4rem; padding-left: .25rem; }
        [data-color-mode="light"] .wmde-markdown ol li::marker { color: #702ae1; font-weight: 700; }
        [data-color-mode="light"] .wmde-markdown input[type=checkbox] { accent-color: #702ae1; margin-right: .5rem; }
        [data-color-mode="light"] .wmde-markdown table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: .95rem; }
        [data-color-mode="light"] .wmde-markdown th { background: #f5f3ff; color: #702ae1; font-weight: 700; padding: .5rem 1rem; border: 1px solid #ede9fe; text-align: left; }
        [data-color-mode="light"] .wmde-markdown td { padding: .5rem 1rem; border: 1px solid #f1f5f9; color: #4b5563; }
        [data-color-mode="light"] .wmde-markdown tr:nth-child(even) td { background: #f8fafc; }
        [data-color-mode="light"] .wmde-markdown hr { border: none; border-top: 2px solid #f1f5f9; margin: 2rem 0; }
        [data-color-mode="light"] .wmde-markdown pre { background: #1e1e1e !important; border-radius: .5rem !important; margin-bottom: 1rem; }
        [data-color-mode="light"] .wmde-markdown pre > code { font-family: monospace !important; background: transparent !important; color: #d4d4d4 !important; font-size: .9rem !important; }
        [data-color-mode="light"] .wmde-markdown code:not(pre > code) { background: #f3f4f6; color: #702ae1; padding: .1em .4em; border-radius: .25rem; font-size: .9em; }
        [data-color-mode="light"] .wmde-markdown a { color: #702ae1; text-decoration: underline; }
      `}</style>
    </>
  );
}
