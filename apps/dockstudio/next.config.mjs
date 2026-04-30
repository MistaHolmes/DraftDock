import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix monorepo module resolution — Clerk is hoisted to repo root
  outputFileTracingRoot: path.join(__dirname, "../../"),
  async headers() {
    return [
      // COOP/COEP only on the WebContainer project editor (needed for SharedArrayBuffer)
      // DO NOT apply to sign-in/sign-up — breaks Clerk's external scripts
      {
        source: "/project/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
