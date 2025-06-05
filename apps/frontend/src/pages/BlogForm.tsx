import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import axios from "axios";
import BlogSkeleton from "@/components/BlogSkeleton";
import { Footer } from "@/components/Footer";
import Header2 from "@/components/ui/header2";
const titleRef = useRef<HTMLTextAreaElement>(null);

export function BlogForm() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 👈 Add this line
    return;
  }

  setIsSubmitting(true);
  try {
    const token = await getToken();
    if (!token) throw new Error("Authentication required");

    const API_URL = import.meta.env.VITE_API_BASE_URL;
    
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
      navigate("/blogs");
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

  const handleDraftSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(e as unknown as React.FormEvent, true);
  };

  // Animation styles
  const getAnimationStyle = (delay: number) => ({
    opacity: isLoaded ? 1 : 0,
    transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
    transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {isSubmitting ? (
          // Loading UI
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-3xl space-y-4">
              <BlogSkeleton variant="medium" />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <Header2 />
            {/* Form container */}
            <main 
              className="flex flex-col items-center py-6 px-4 md:py-10 md:px-8 bg-white/80">
              <div 
                className="w-full max-w-4xl bg-muted/20 rounded-lg p-8"
                style={getAnimationStyle(200)}
              >
                {/* Error message */}
                {errors.server && (
                  <div 
                    className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md"
                    style={getAnimationStyle(250)}
                  >
                    {errors.server}
                  </div>
                )}

                {/* Title */}
                <div 
                  className="border-b border-gray-300 mb-6"
                  style={getAnimationStyle(300)}
                >
                  <Textarea
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Blog Title"
                    className="font-serif text-4xl sm:text-5xl md:text-4xl font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none leading-tight h-[70px] sm:h-[90px] md:h-[110px] p-0"
                    aria-invalid={!!errors.title}
                    ref={titleRef}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Rich Text Content Editor */}
                <div 
                  className="mb-6"
                  style={getAnimationStyle(400)}
                >
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write your blog..."
                    error={!!errors.content}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600 mt-1 ml-1">{errors.content}</p>
                  )}
                </div>

                {/* Buttons */}
                <div 
                  className="flex flex-col sm:flex-row gap-4 mt-6"
                  style={getAnimationStyle(500)}
                >
                  <Button
                    type="button"
                    onClick={() => navigate("/blogs")}
                    className="w-full sm:w-auto order-3 sm:order-1 transform transition-all duration-200 hover:scale-105"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDraftSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto order-2 transform transition-all duration-200 hover:scale-105"
                  >
                    {isSubmitting ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    type="submit"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={isSubmitting}
                    className="bg-black text-white w-full sm:w-auto order-1 sm:order-3 sm:ml-auto hover:bg-gray-900 transform transition-all duration-200 hover:scale-105"
                  >
                    {isSubmitting ? "Publishing..." : "Publish"}
                  </Button>
                </div>
              </div>
            </main>
            
            {/* Footer */}
            <div className="bg-gray-50">
              <Footer />
            </div>
          </>
        )}
      </div>
    </div>
  );
}