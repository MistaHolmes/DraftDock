import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import React from "react";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) return null; // Optionally add a loading spinner here

  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
