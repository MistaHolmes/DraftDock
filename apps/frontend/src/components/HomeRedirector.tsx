import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LandingPage from "../pages/Landing";

const HomeRedirector = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isSignedIn) {
      // If RequireAuth bounced an unauthenticated user here, send them back
      // to their original destination (e.g. a collab invite link) after sign-in.
      const returnTo = (location.state as any)?.from?.pathname;
      const returnSearch = (location.state as any)?.from?.search ?? "";
      navigate(returnTo ? `${returnTo}${returnSearch}` : "/explore", { replace: true });
    }
  }, [isSignedIn, navigate, location.state]);

  // Show landing while deciding or for guests
  return <LandingPage />;
};

export default HomeRedirector;
