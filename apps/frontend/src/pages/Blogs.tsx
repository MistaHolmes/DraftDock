import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { usePageCache } from "@/context/PageCacheContext";
import { NewAppShell } from "@/components/new-components";
import BlogList from "@/components/BlogList";
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
  tags?: { id: string, name: string }[];
  coverImage?: string;
}

const Blogs: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);

  const hasFetchedAllBlogs = useRef(false);
  const cache = usePageCache();

  useEffect(() => {
    if (!isLoaded || !user || hasFetchedAllBlogs.current) return;
    hasFetchedAllBlogs.current = true;

    const cached = cache.get('blogs:all');
    if (cached) {
      setAllBlogs(cached);
      setFilteredBlogs(cached);
      setLoading(false);
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

    axios
      .get(`${API_URL}/api/blogs`, { withCredentials: true })
      .then((res) => {
        const fetchedBlogs = res.data
          .filter((b: any) => b.published === true)
          .map((b: any) => {
            const summary = b.summary || b.title || '';

            return {
              id: b.id,
              title: b.title,
              summary: summary.slice(0, 150) + (summary.length > 150 ? "..." : ""),
              coverImage: b.coverImage || "",
              author: b.author?.name
                || (b.author?.email
                  ? b.author.email.split("@")[0].replace(/^./, (c: any) => c.toUpperCase())
                  : "Anonymous"),
              authorId: b.authorId,
              updatedAt: new Date(b.updatedAt),
              published: new Date(b.updatedAt).toLocaleDateString(),
              tags: b.tags || [],
            };
          })
          .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());

        cache.set('blogs:all', fetchedBlogs);
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
    <NewAppShell
      activePage="dock"
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
    >
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlogSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
               <h1 className="text-4xl font-headline font-bold text-gray-900 dark:text-white">Community Dock</h1>
               <p className="text-gray-500 dark:text-gray-400">Discover the latest drafts and stories from the community.</p>
            </div>
            <BlogList posts={filteredBlogs} />
          </div>
        )}
      </div>
    </NewAppShell>
  );
};

export default Blogs;