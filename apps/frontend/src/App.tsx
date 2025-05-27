import React from "react";
import RequireAuth from "./components/RequireAuth"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import UserBlogs from "./pages/Blogs";
import {BlogForm} from "./pages/BlogForm";
import HomeRedirector from "./components/HomeRedirector";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirector />} />
        <Route path="/landing" element={<RequireAuth><LandingPage /></RequireAuth>}/>
        <Route path="/blogs" element={<RequireAuth><UserBlogs /></RequireAuth>}/>
        <Route path="/create-blog" element={<RequireAuth><BlogForm /></RequireAuth>}/>
      </Routes>
    </Router>
  );
};

export default App;
