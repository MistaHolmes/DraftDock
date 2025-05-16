import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import UserBlogs from "./pages/Blogs";
import { BlogForm } from "./pages/BlogForm";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blogs" element={<UserBlogs />} />
        <Route path="/create-blog" element={<BlogForm />} />
      </Routes>
    </Router>
  );
};

export default App;
