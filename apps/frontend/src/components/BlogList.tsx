import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  
  // Calculate total number of pages
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  // Get current posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  
  const handleClick = (id: string) => {
    navigate(`/blog/${id}`);
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };

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
          
          {/* Pagination Controls */}
          {posts.length > 0 && (
            <div className="flex items-center justify-between mt-6 gap-4">
              {currentPage > 1 && (
                <Button 
                  onClick={goToPreviousPage} 
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              
              {currentPage < totalPages && (
                <Button 
                  onClick={goToNextPage} 
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          {/* Message when no more pages are available */}
          {currentPage === totalPages && posts.length > 0 && (
            <p className="mt-2 text-gray-500 italic">No more drafts — dock a new one!</p>
          )}
        </>
      )}
    </div>
  );
};

export default BlogList;