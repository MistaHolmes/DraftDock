import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Admin checks removed — allow access for signed-in users
  return <>{children}</>;
};

export default RequireAdmin;
