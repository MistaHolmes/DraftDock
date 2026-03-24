import React from "react";
import RequireAuth from "./components/RequireAuth"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import UserBlogs from "./pages/Blogs";
import {BlogForm} from "./pages/BlogForm";
import BlogView from "./pages/BlogView";
import HomeRedirector from "./components/HomeRedirector";
import { MyStory } from "./components/MyStory";
import { Contact } from "./components/Contact";
import ProfileComponent from "./pages/Profile";
import { BlogCacheProvider } from "./context/BlogCacheContext";

const App: React.FC = () => {
  return (
    <BlogCacheProvider>
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirector />} />
        <Route path="/landing" element={<RequireAuth><LandingPage /></RequireAuth>}/>
        <Route path="/blogs" element={<RequireAuth><UserBlogs /></RequireAuth>}/>
        <Route path="/create-blog" element={<RequireAuth><BlogForm /></RequireAuth>}/>
        <Route path="/blog/:blogId" element={<RequireAuth><BlogView /></RequireAuth>}/>
        <Route path="/my-story" element={<MyStory />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<ProfileComponent />} />
      </Routes>
    </Router>
    </BlogCacheProvider>
  );
};

export default App;
