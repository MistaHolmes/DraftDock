import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/main(.*)", "/project(.*)"]);
const isProjectRoute = createRouteMatcher(["/project(.*)"]);
// Also protect sign-in/sign-up pages from already authed users
const isAuthPage = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Redirect unauthenticated users trying to access protected routes → landing page
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect already signed-in users away from auth pages → main dashboard
  if (isAuthPage(req) && userId) {
    return NextResponse.redirect(new URL("/main", req.url));
  }

  // Add COOP/COEP headers for WebContainer pages (SharedArrayBuffer)
  if (isProjectRoute(req)) {
    const res = NextResponse.next();
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    res.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    return res;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
