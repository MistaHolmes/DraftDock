import { useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import Sidebar from "@/components/SideBar";

export function BlogForm() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    published: true
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

    // Client-side validation
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
      console.log(token);
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
          : "An unexpected error occurred"
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
      {/* Sidebar */}
      <Sidebar activePage="create" />
      
      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
          <h1 className="text-xl font-semibold text-gray-900">Create New Post</h1>
          <UserButton />
        </header>
        
        {/* Form container */}
        <main className="container mx-auto py-10 px-6">
          <div className="max-w-3xl mx-auto">
            <form className="space-y-6 bg-white p-6 rounded-lg shadow">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter post title"
                  aria-invalid={!!errors.title}
                  className="w-full"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Write your content here..."
                  className="min-h-[300px] w-full"
                  aria-invalid={!!errors.content}
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content}</p>
                )}
              </div>

              {errors.server && (
                <p className="text-sm text-red-500">{errors.server}</p>
              )}

              <div className="flex flex-row gap-4">
                <Button
                  type="button"
                  onClick={() => navigate("/blogs")}
                  className="w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDraftSubmit}
                  disabled={isSubmitting}
                  className="w-auto"
                >
                  {isSubmitting ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  type="submit"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isSubmitting}
                  className="bg-primary text-white w-auto"
                >
                  {isSubmitting ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}