import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Blog {
  id: string;
  title: string;
  summary: string;
  author: string;
  published: string;
}

interface BlogListProps {
  posts: Blog[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  const navigate = useNavigate();
  const [isAtEnd, setIsAtEnd] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleClick = (id: string) => {
    navigate(`/blog/${id}`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtEnd(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1.0, // Trigger when sentinel is fully visible
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [posts]);

  return (
    <div className="flex flex-col items-center gap-4">
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No blogs available</p>
          <Button className="gap-2" onClick={() => navigate('/create-blog')}>
            Create your first blog
          </Button>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => handleClick(post.id)}
              onKeyDown={(e) => e.key === "Enter" && handleClick(post.id)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-3xl border rounded-lg px-6 py-4 shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{post.published}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
              <p className="text-gray-700 text-sm">{post.summary}</p>
              <div className="mt-4 text-sm text-gray-600 font-medium">By {post.author}</div>
            </motion.div>
          ))}
          {/* Sentinel div to detect scroll end */}
          <div ref={sentinelRef} className="h-1 w-full" />

          {/* Show message only when user reaches end */}
          {isAtEnd && (
            <p className="mt-6 text-gray-500 italic">No more drafts — dock a new one!</p>
          )}
        </>
      )}
    </div>
  );
};

export default BlogList;
