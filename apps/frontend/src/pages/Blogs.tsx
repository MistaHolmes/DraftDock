import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { Blog8 } from "@/components/Blog8";
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { useNavigate } from "react-router-dom";
import Loading from "@/components/ui/loading";

interface Blog {
  id: string;
  title: string;
  content: string;
  summary: string;
  label: string;
  author: string;
  published: string;
  image: string;
  tags?: string[];
}

export default function UserBlogs() {
  const { user } = useUser();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useNavigate();

  useEffect(() => {
    if (!user) return;

    axios
      .get("http://localhost:3000/api/blogs", {
        withCredentials: true,
      })
      .then((res) => {
        const fetchedBlogs = res.data.map((b: any) => ({
          id: b.id,
          title: b.title,
          summary: b.content.slice(0, 150) + "...",
          label: "User Blog",
          author: user.fullName || "Anonymous",
          published: new Date(b.createdAt).toLocaleDateString(),
          image: "/images/block/placeholder-dark-1.svg",
          tags: [],
        }));
        setBlogs(fetchedBlogs);
      })
      .catch((err) => {
        console.error("Error fetching blogs:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loading />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray">
      {/* Top bar */}
      <div className="flex justify-between items-center px-5 py-2 border-b border-gray-300">
        {/* Left: DraftDock button */}
        <button
          onClick={() => router("/")}
          className="text-black text-xl font-extrabold tracking-wide"
        >
          DraftDock
        </button>

        {/* Right: Write button + UserButton */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router("/create-blog")}
            className="flex items-center gap-x-2 border px-3 py-2 text-gray-700 font-medium rounded hover:bg-gray-100 transition"
          >Draft
            <img
              src="/write.svg"
              alt="Write"
              className="w-5 h-5"
            />
          </button>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      {/* Blogs list */}
      <Blog8 posts={blogs} />
    </div>
  );
}
