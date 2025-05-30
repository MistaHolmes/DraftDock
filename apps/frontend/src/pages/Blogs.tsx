import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import BlogList from "@/components/BlogList";
import BlogSkeleton from "@/components/BlogSkeleton";
import { Footer } from "@/components/Footer";
import Header from "@/components/ui/header";
import { NotificationTest } from "@/components/ui/NotificationTest";

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

const Blogs: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  
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
    <div className="flex h-screen overflow-hidden bg-gray-100/30 ">
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />          
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
            {/* <NotificationTest/> */}
            <div className="max-w-6xl mx-auto">                    
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <BlogSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <BlogList posts={filteredBlogs} />
              )}
            </div>
            <div>
              
            </div>
            <div className="mt-8">
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Blogs;