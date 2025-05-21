import React, { useState, useEffect, useRef } from "react";
import { Bell, Plus, Search } from "lucide-react";
import axios from "axios";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import BlogList from "@/components/BlogList";
import Sidebar from "@/components/SideBar";
import BlogSkeleton from "@/components/BlogSkeleton";

// Define the Blog type
interface Blog {
  id: string;
  title: string;
  summary: string;
  label?: string;
  author: string;
  authorId: string;
  published: string;
  image?: string;
  tags?: string[];
}

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
  size?: "default" | "icon";
  onClick?: () => void;
}

interface InputProps {
  type: string;
  placeholder: string;
  value?: string;            
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

const Input: React.FC<InputProps> = ({ type, placeholder, className, value, onChange }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors ${className || ""}`}
      value={value}
      onChange={onChange}
    />
  );
};

const Blogs: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const navigate = useNavigate();
  
  
  const handleClick = () => {
    navigate('/create-blog');
  };

  const hasFetchedAllBlogs = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || hasFetchedAllBlogs.current) return;
    hasFetchedAllBlogs.current = true;

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    axios
      .get(`${API_URL}/api/blogs`, { withCredentials: true })
      .then((res) => {
        const fetchedBlogs = res.data
          .filter((b: any) => b.published === true)
          .map((b: any) => ({
            id: b.id,
            title: b.title,
            summary: b.content.slice(0, 150) + "...",
            author: b.author?.email
              ? b.author.email.split("@")[0].replace(/^./, (c: any) => c.toUpperCase())
              : "Anonymous",
            authorId: b.authorId,
            updatedAt: new Date(b.updatedAt),
            published: new Date(b.updatedAt).toLocaleDateString(),
            tags: b.tags || [],
          }))
          .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        setAllBlogs(fetchedBlogs);
        setFilteredBlogs(fetchedBlogs);
      })
      .catch((err) => {
        console.error("Error fetching blogs:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, isLoaded]);

  // Filter blogs when searchTerm changes
useEffect(() => {
  if (!searchTerm.trim()) {
    setFilteredBlogs(allBlogs);
    return;
  }
  const lowercaseSearchTerm = searchTerm.toLowerCase();
  const filtered = allBlogs.filter(blog =>
    blog.title.toLowerCase().includes(lowercaseSearchTerm) ||
    blog.summary.toLowerCase().includes(lowercaseSearchTerm)
  );

  setFilteredBlogs(filtered);
}, [searchTerm, allBlogs]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Component */}
        <div className="w-64 flex-shrink-0">
          <Sidebar activePage="dock" />
        </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full">
        <header className="fixed top-0 left-64 right-0 z-10 border-b bg-white px-6 py-3 flex items-center justify-between">
          <div className="w-96">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search titles..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button className="gap-2" onClick={handleClick}>
              <Plus className="h-4 w-4" />
              Create
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <SignedIn>           
              <UserButton />
            </SignedIn>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto pt-[4.5rem] px-6 pb-6 bg-gray-50">
          <div className="p-6">                    
           {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <BlogSkeleton key={i} />
                ))}
              </div>
            ) : (
              <BlogList posts={filteredBlogs} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Blogs;