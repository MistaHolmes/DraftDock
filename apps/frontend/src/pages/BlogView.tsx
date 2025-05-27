import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Ship, Plus, Bell } from "lucide-react";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import BlogSkeleton from "@/components/BlogSkeleton";
import Header2 from "@/components/ui/header2";

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    email: string;
  };
}

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
  size?: "default" | "icon";
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = "default", size = "default", onClick }) => {
  const baseClass = "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variantClasses = {
    default: "bg-black text-white hover:bg-black/70",
    ghost: "bg-transparent hover:bg-gray-100"
  };
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    icon: "h-9 w-9"
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`}
    >
      {children}
    </button>
  );
};

const BlogView = () => {
    const { blogId } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState<Blog | null>(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs/${blogId}`);
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error("Failed to fetch blog", err);
      }
    };

    fetchBlog();
    }, [blogId]);

    if (!blog) return (
        <main className="max-w-3xl mx-auto p-6">
            <BlogSkeleton variant="large" />
        </main>
    );

  const formattedDate = new Date(blog.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header2/>

      {/* Blog Content */}
      <main className="max-w-3xl mx-auto p-6 prose prose-neutral prose-lg">
        {/* Metadata */}
        <h1 className="font-serif text-5xl font-bold leading-tight mb-6">
        {blog.title}
        </h1>
        <div className="text-base text-gray-600 mb-2">
          By <span className="font-medium">{blog.author.email}</span> • {formattedDate}
        </div>

        <hr className="border-t border-gray-300 mb-10" />

        {/* Content */}
        <article className="font-serif leading-relaxed text-gray-900 whitespace-pre-wrap">
          {blog.content}
        </article>
      </main>
    </div>
  );
};

export default BlogView;
