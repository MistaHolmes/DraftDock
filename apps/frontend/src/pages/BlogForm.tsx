import { useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

export function BlogForm() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    published: true // Default to published
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <button
          className="text-xl font-semibold text-gray-900"
          onClick={() => navigate("/blogs")}
        >
          DraftDock
        </button>
        <div>
          <UserButton />
        </div>
      </header>
      <main className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Post</h1>
          
          <form className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter post title"
                aria-invalid={!!errors.title}
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
                className="min-h-[300px]"
                aria-invalid={!!errors.content}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            {errors.server && (
              <p className="text-sm text-red-500">{errors.server}</p>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => navigate("/blogs")}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                type="submit"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
                className="bg-primary text-white"
              >
                {isSubmitting ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}