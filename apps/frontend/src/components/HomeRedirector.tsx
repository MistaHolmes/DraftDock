import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "../pages/Landing";

const HomeRedirector = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/blogs");
    }
  }, [isSignedIn, navigate]);

  // Show landing while deciding or for guests
  return <LandingPage />;
};

export default HomeRedirector;
