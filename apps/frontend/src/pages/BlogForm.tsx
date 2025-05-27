import { useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import SubmitSkeleton from "@/components/ui/SubmitSkeleton";
import { Ship } from "lucide-react";
import { Footer } from "@/components/Footer";

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

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setErrors({});

    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }
    if (!formData.content.trim()) {
      setErrors({ content: "Content is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await axios.post(
        "http://localhost:3000/api/create-blog",
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {isSubmitting ? (
          // Loading UI
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-3xl space-y-4">
              <SubmitSkeleton />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white shadow sticky top-0 z-10">
              <Button
                onClick={() => navigate("/landing")}
                className="flex items-center gap-2 px-2 pl-1 text-lg font-bold hover:bg-transparent bg-white border-0"
              >
                <Ship className="h-6 w-6 text-gray-800" />
                <span className="hidden md:inline font-bold font-playfair hover:text-black ">DraftDock</span>
              </Button>
              <UserButton />
            </header>

            {/* Form container */}
            <main className="flex flex-col items-center py-6 px-4 md:py-10 md:px-8 bg-white/80">
              <div className="w-full max-w-4xl bg-muted/20 rounded-lg p-8">
                {/* Error message */}
                {errors.server && (
                  <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
                    {errors.server}
                  </div>
                )}

                {/* Title */}
                <div className="border-b border-gray-300 mb-6">
                  <Textarea
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Blog Title"
                    className="text-3xl font-extrabold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none leading-tight h-[70px] sm:h-[90px] md:h-[110px] p-0"
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Content */}
                <div className="mb-6">
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your blog..."
                    className="min-h-[280px] sm:min-h-[320px] md:min-h-[420px] w-full p-6 text-gray-800 text-lg sm:text-xl md:text-2xl leading-relaxed resize-none bg-white/20 rounded-md border-0"
                    aria-invalid={!!errors.content}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600 mt-1 ml-1">{errors.content}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button
                    type="button"
                    onClick={() => navigate("/blogs")}
                    className="w-full sm:w-auto order-3 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDraftSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto order-2"
                  >
                    {isSubmitting ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    type="submit"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={isSubmitting}
                    className="bg-black text-white w-full sm:w-auto order-1 sm:order-3 sm:ml-auto hover:bg-gray-900"
                  >
                    {isSubmitting ? "Publishing..." : "Publish"}
                  </Button>
                </div>
              </div>
            </main>
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}