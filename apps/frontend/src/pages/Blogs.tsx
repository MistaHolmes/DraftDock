import React, { useState, useEffect, useRef } from "react";
import { Bell, Plus, Search , LayoutGrid, FileDiff, Eraser } from "lucide-react";
import axios from "axios";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import BlogList from "@/components/BlogList";

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

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

interface FolderItemProps {
  href: string;
  children: React.ReactNode;
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

interface Blog8Props {
  posts: Blog[];
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, active }) => {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg ${active ? "bg-gray-100" : ""}`}
    >
      {icon}
      <span>{children}</span>
    </a>
  );
};

const FolderItem: React.FC<FolderItemProps> = ({ href, children }) => {
  return (
    <a href={href} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      <span>{children}</span>
    </a>
  );
};

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

const FileManager: React.FC = () => {
  const { isLoaded } = useUser(); // Clerk user
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);  
  const hasFetched = useRef(false); // prevents multiple fetches


  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/create-blog');
  };

  useEffect(() => {
  if (!isLoaded || hasFetched.current) return;

  hasFetched.current = true;

  axios
    .get("http://localhost:3000/api/blogs", { withCredentials: true })
    .then((res) => {
      const fetchedBlogs = res.data
        .filter((b:any)=> b.published === true)
        .map((b: any) => ({
          id: b.id,
          title: b.title,
          summary: b.content.slice(0, 150) + "...",
          author: b.author?.email 
            ? b.author.email.split("@")[0].replace(/^./, (c:any) => c.toUpperCase()) 
            : "Anonymous",
          authorId: b.authorId,
          updatedAt: new Date(b.updatedAt),
          published: new Date(b.updatedAt).toLocaleDateString(), 
          tags: b.tags || [],
        }))
        .sort((a:any, b:any) => b.updatedAt.getTime() - a.updatedAt.getTime());

      setBlogs(fetchedBlogs);
      setFilteredBlogs(fetchedBlogs);
    })
    .catch((err) => {
      console.error("Error fetching blogs:", err);
    })
    .finally(() => {
      setLoading(false);
    });

  axios
    .get("http://localhost:3000/api/user/blogs", { withCredentials: true })
    .then((res) => {
      const fetchedUserBlogs = res.data.blogs.map((b: any) => ({
        id: b.id,
        title: b.title,
        summary: b.content.slice(0, 150) + "...",
        authorId: b.authorId,
        updatedAt: new Date(b.updatedAt),
        published: new Date(b.updatedAt).toLocaleDateString(),
        tags: b.tags || [],
      }));
      setUserBlogs(fetchedUserBlogs);
    })
    .catch((err) => {
      console.error("Error fetching user blogs:", err);
    });

}, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r bg-white fixed top-0 left-0 bottom-0 z-10">
        <div className="p-4">
          <button className="text-xl font-bold bg-transparent"
          onClick={() => navigate("/landing")}
          >DraftDock</button>
        </div>
        <nav className="space-y-1 px-2">
          <NavItem href="#" icon={<LayoutGrid />} active>
            Dock
          </NavItem>
          <NavItem
            href="#"
            icon={<Eraser/>}
          >
            Canvas
          </NavItem>
          <NavItem href="#" icon={<FileDiff/> }
          >
            Drafts
          </NavItem>
          
          {/*  show user blogs section  */}

          <div className="mt-4 px-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Your Blogs</h4>
            {userBlogs.length > 0 ? (
              userBlogs.map((blog) => (
                <FolderItem key={blog.id} href={`/blog/${blog.id}`}>
                  {blog.title.length > 20 ? blog.title.slice(0, 20) + "..." : blog.title}
                </FolderItem>
              ))
            ) : (
              <p className="text-gray-400 italic py-2 px-4 max-w-xs mx-auto text-center">
                Draft and Dock a Blog.
              </p>
            )}
          </div>
        </nav>
      </div>

      {/* Main content */}
        <div className="ml-64 flex-1 flex flex-col h-full">
        <header className="fixed top-0 left-64 right-0 z-10 border-b bg-white px-6 py-4 flex items-center justify-between">
          <div className="w-96">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                  type="search"
                  placeholder="Search titles..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e:any) => setSearchTerm(e.target.value)}
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
              <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
                <Spinner size="xl"/>
                <p className="mt-4 text-m text-gray-600">
                  Docking Your Blog Posts ...
                </p>
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

export default FileManager;