import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Share } from "lucide-react";
import { ShareButton } from "./ui/shareButton";

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
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  const scrollRef = useRef<HTMLDivElement>(null); // ✅ Ref for scrolling

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const stripHtmlTags = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const handleClick = (id: string) => {
    navigate(`/blog/${id}`);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      scrollToTop(); // ✅ Scroll to top on next
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      scrollToTop(); // ✅ Scroll to top on back
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={scrollRef}></div> {/* 👈 Scroll Target */}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No blogs available</p>
          <Button className="gap-2" onClick={() => navigate('/create-blog')}>
            Create your first blog
          </Button>
        </div>
      ) : (
        <>
          {currentPosts.map((post) => (
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
              className="w-full max-w-3xl border rounded-lg px-6 py-4 shadow-sm bg-white/70 cursor-pointer hover:shadow-md transition-shadow hover:text-gray-500"
            >
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{post.published}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{stripHtmlTags(post.title)}</h3>
              <p className="text-gray-700 text-sm">{stripHtmlTags(post.summary)}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600 font-medium">
                <span>By {post.author}</span>
                <ShareButton
                  variant="link"
                  className="flex items-center gap-1 text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    const postUrl = `${window.location.origin}/blog/${post.id}`;
                    navigator.clipboard.writeText(postUrl)
                      .then(() => {
                        setCopiedId(post.id);
                        setTimeout(() => setCopiedId(null), 1000);
                      });
                  }}
                >
                  <Share className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                  <span className="text-gray-700">{copiedId === post.id ? "Copied!" : "Share"}</span>
                </ShareButton>
              </div>
            </motion.div>
          ))}

          {/* Pagination Controls */}
          {posts.length > 0 && (
            <div className="flex items-center justify-between mt-6 gap-4">
              {currentPage > 1 && (
                <Button onClick={goToPreviousPage} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>

              {currentPage < totalPages && (
                <Button onClick={goToNextPage} className="flex items-center gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {currentPage === totalPages && posts.length > 0 && (
            <p className="mt-2 text-gray-500 italic">No more drafts — dock a new one!</p>
          )}
        </>
      )}
    </div>
  );
};

export default BlogList;
