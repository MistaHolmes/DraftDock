import React from "react";
import RequireAuth from "./components/RequireAuth"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import UserBlogs from "./pages/Blogs";
import {BlogForm} from "./pages/BlogForm";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blogs" element={<RequireAuth><UserBlogs /></RequireAuth>}/>
      <Route path="/create-blog" element={<RequireAuth><BlogForm /></RequireAuth>}/>
      </Routes>
    </Router>
  );
};

export default App;
