import { Coffee, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-transparent text-gray-700 px-6 py-8 text-sm z-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-6">
          
          {/* About Me */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-900">Resources</h3>
            <div className="flex flex-col gap-2">
              <a href="/my-story" className="hover:underline hover:text-black transition-colors">My Story</a>
              <a href="/contact" className="hover:underline hover:text-black transition-colors">Contact</a>
              <a
                href="https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-black transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-900">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <a href="/create-blog" className="hover:underline hover:text-black transition-colors">Draft a Blog</a>
              <a href="/blogs" className="hover:underline hover:text-black transition-colors">Explore Drafts</a>
              <a
                href="https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-black transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>

          {/* Buy Me a Coffee */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-900">Support</h3>
            <a
              href="https://coff.ee/abhastheain"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-md transition-colors font-medium"
            >
              <Coffee className="w-4 h-4" />
              Buy Me a Coffee
            </a>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-gray-900">Connect</h3>
            <div className="flex gap-4">
              <a
                href="https://github.com/MistaHolmes/DraftDock"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/AbhasBehera1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/abhash-behera-70b77528b/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} DraftDock.app. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
