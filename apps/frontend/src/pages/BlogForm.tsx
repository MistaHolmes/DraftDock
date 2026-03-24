import { useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "@/components/RichTextEditor";
import axios from "axios";
import BlogSkeleton from "@/components/BlogSkeleton";
import { Footer } from "@/components/Footer";
import Header from "@/components/ui/header";
import { useBlogCache } from "@/context/BlogCacheContext";

export function BlogForm() {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { invalidate } = useBlogCache();

  const authorName = isUserLoaded && user ? (user.firstName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || "Creator") : "Author";
  const authorImage = isUserLoaded && user ? user.imageUrl : "";

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    published: true,
  });
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    server?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const uploadData = new FormData();
      uploadData.append('file', file);

      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Cover upload failed');
      }
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        content: `![Hero Cover Image](${data.url})\n\n${prev.content}`
      }));
    } catch (error: any) {
      console.error('Cover image upload failed:', error);
      setErrors(prev => ({ ...prev, server: error.message }));
    } finally {
      setIsUploadingCover(false);
      // Reset input value so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const coverImageMatch = formData.content.match(/!\[Hero Cover Image\]\((.*?)\)/);
  const coverImageUrl = coverImageMatch ? coverImageMatch[1] : null;

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setErrors({});

    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // For rich text content, we need to check if there's actual content (not just HTML tags)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formData.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (!textContent.trim()) {
      setErrors({ content: "Content is required" });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const API_URL = import.meta.env.VITE_API_URL;
      console.log("API_URL", import.meta.env.VITE_API_URL);

      const response = await axios.post(
        `${API_URL}/api/create-blog`,
        { ...formData, published: !isDraft },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        invalidate(); // Clear cache to guarantee new posts appear
        navigate("/blogs");
      }
    }
    catch (error) {
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

  const handleDraftSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(e as unknown as React.FormEvent, true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface font-body selection:bg-secondary-container">
      {/* TopAppBar */}
      <div className="fixed top-0 w-full z-50">
        <Header />
      </div>

      <main className="pt-24 pb-12 flex max-w-[1440px] mx-auto min-h-screen w-full">
        {/* Left SideNavBar */}
        <aside className="sticky top-0 h-screen w-64 hidden lg:flex flex-col p-4 space-y-4 bg-surface-container pt-24 pb-8 overflow-y-auto">
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/30">
              {authorImage ? (
                <img src={authorImage} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-outline">person</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate capitalize">{authorName}</p>
              <p className="text-xs text-on-surface-variant truncate">Standard Plan</p>
            </div>
          </div>
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 bg-surface-container-lowest text-on-surface rounded-lg shadow-sm hover:translate-x-1 transition-transform cursor-default">
              <span className="material-symbols-outlined">edit_note</span>
              <span className="font-medium text-sm">Editor</span>
            </button>
            <button
              onClick={() => navigate('/blogs?tab=published')}
              className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg hover:translate-x-1 transition-transform"
            >
              <span className="material-symbols-outlined">auto_stories</span>
              <span className="font-medium text-sm">Library</span>
            </button>
          </nav>
          <div className="mt-auto p-4 bg-secondary-container rounded-xl">
            <p className="text-xs font-bold text-on-secondary-container mb-2 uppercase tracking-widest">Upgrade to Pro</p>
            <p className="text-xs text-on-secondary-container mb-3">Unlock AI-powered SEO and unlimited drafts.</p>
            <button className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary-container transition-all">Get Access</button>
          </div>
        </aside>

        {/* Main Writing Canvas */}
        <div className="flex-1 px-4 md:px-16 transition-all duration-500 w-full">
          {isSubmitting ? (
            <div className="max-w-3xl mx-auto py-12">
              <BlogSkeleton variant="medium" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto bg-surface-container-lowest editorial-shadow min-h-[819px] p-8 md:p-12 relative rounded-xl border border-outline-variant/20 mt-4 md:mt-8">

              {errors.server && (
                <div className="mb-6 p-3 bg-error-container text-on-error-container border border-error-container/50 rounded-md text-sm font-medium">
                  {errors.server}
                </div>
              )}

              {/* Editor Content */}
              <div className="space-y-8">
                <div>
                  <input
                    ref={titleRef as any}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-transparent border-none p-0 text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface focus:ring-0 placeholder:text-outline-variant disabled:opacity-50"
                    placeholder="Article Title..."
                    type="text"
                  />
                  {errors.title && <p className="text-xs text-error mt-2 ml-1 font-bold">{errors.title}</p>}
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-outline uppercase tracking-widest border-b border-surface-container-low pb-4">
                  <span>Drafting</span>
                  <span>•</span>
                  <span>{formData.content.trim().split(/\s+/).filter(Boolean).length} Words</span>
                  <span>•</span>
                  <span>Reading Time: {Math.max(1, Math.ceil(formData.content.trim().split(/\s+/).filter(Boolean).length / 200))}m</span>
                </div>

                <div>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Start writing your next breakthrough... (Markdown supported)"
                    error={!!errors.content}
                    className="writing-area border-none !bg-transparent min-h-[614px] shadow-none !rounded-none"
                  />
                  {errors.content && <p className="text-xs text-error mt-2 ml-1 font-bold">{errors.content}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Editor Settings Sidebar */}
        <aside className="sticky top-0 h-screen w-80 bg-surface-container-low border-l border-outline-variant/20 hidden xl:flex flex-col p-8 pt-24 pb-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-surface-container-highest">
            <h2 className="font-headline font-bold text-lg tracking-tight">Post Actions</h2>
          </div>

          <div className="flex flex-col gap-3 mb-10">
            <button
              onClick={handleDraftSubmit}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-surface-container-highest text-on-surface font-bold rounded-lg border border-outline-variant/30 hover:bg-surface-container-highest/80 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? "Processing..." : "Save Draft"}
            </button>
            <button
              onClick={(e) => handleSubmit(e, false)}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-all active:scale-[0.98]"
            >
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2 text-outline font-bold hover:text-on-surface transition-colors text-sm mt-2"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-8">
            {/* Cover Image Upload */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">Cover Image Mode</label>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCoverUpload}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCover}
                className="relative aspect-video w-full bg-surface-container-lowest rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer group overflow-hidden"
              >
                {isUploadingCover ? (
                   <span className="material-symbols-outlined animate-spin text-primary text-3xl">hourglass_empty</span>
                ) : coverImageUrl ? (
                   <>
                     <img src={coverImageUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                       <span className="material-symbols-outlined text-white mb-2">swap_horiz</span>
                       <span className="text-xs text-white font-medium">Replace Cover</span>
                     </div>
                   </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-outline-variant mb-2 group-hover:text-primary transition-colors">cloud_upload</span>
                    <span className="text-xs text-outline-variant text-center px-4 font-medium group-hover:text-on-surface transition-colors">Click to inject Hero Cover markdown</span>
                  </>
                )}
              </button>
            </div>

            {/* Tags Stub */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">Tags</label>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-container-highest text-on-surface text-xs font-medium rounded-full flex items-center gap-2">
                  Development
                </span>
                <button className="px-3 py-1 border border-outline-variant text-outline text-xs font-medium rounded-full hover:bg-surface-container-lowest transition-colors pointer-events-none opacity-50">
                  + Add Tag
                </button>
              </div>
            </div>

            {/* Support CTA */}
            <div className="mt-8 pt-8 border-t border-surface-container-highest">
              <a href="https://buymeacoffee.com/abhash" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-secondary text-on-secondary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-sm">coffee</span>
                Support Platform
              </a>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <div className="bg-surface mt-auto border-t border-outline-variant/20 hidden lg:block">
        <Footer />
      </div>

    </div>
  );
}