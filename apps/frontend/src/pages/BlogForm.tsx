import { useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import Sidebar from "@/components/SideBar";
import SubmitSkeleton from "@/components/ui/SubmitSkeleton";
import { Menu } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex min-h-screen">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-opacity-50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <Sidebar activePage="dock" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {isSubmitting ? (
          // 🔄 Show loading UI
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-3xl space-y-4">
              <SubmitSkeleton />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white shadow sticky top-0 z-10">
              {/* Mobile menu button */}
              <button 
                className="md:hidden mr-2 p-2 rounded-md hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">Create New Draft</h1>
              <UserButton />
            </header>

            {/* Form container */}
            <main className="flex flex-col items-center py-6 px-4 md:py-10 md:px-8 bg-gray-50">
              <div className="w-full max-w-4xl">
                {/* Error message */}
                {errors.server && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
                    {errors.server}
                  </div>
                )}
                
                {/* Title */}
                <div className="border-b border-gray-200 mb-4">
                  <Textarea
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Blog Title"
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 bg-gray-50 border-none shadow-none focus:outline-none focus:ring-0 resize-none leading-tight h-[60px] sm:h-[80px] md:h-[100px] p-0"
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Content */}
                <div className="border-b border-gray-200 mb-6">
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your blog..."
                    className="min-h-[250px] sm:min-h-[300px] md:min-h-[400px] w-full p-4 text-gray-700 text-lg sm:text-xl md:text-2xl border-0 focus:outline-none focus:ring-0 bg-gray-50 resize-none"
                    aria-invalid={!!errors.content}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
                    className="bg-black text-white w-full sm:w-auto order-1 sm:order-3 sm:ml-auto hover:bg-gray-800"
                  >
                    {isSubmitting ? "Publishing..." : "Publish"}
                  </Button>
                </div>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}