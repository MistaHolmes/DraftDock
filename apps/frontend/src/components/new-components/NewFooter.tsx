import React from "react";

export const NewFooter: React.FC = () => {
  return (
    <footer className="w-full py-6 mt-auto bg-slate-800 dark:bg-slate-950 flex flex-col md:flex-row justify-between items-center px-8 md:px-12 gap-4 border-t border-slate-700">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-label text-xs font-medium uppercase tracking-widest text-slate-200">
            System Operational
          </span>
        </div>
        <span className="text-slate-400 hidden md:inline">|</span>
        <span className="font-label text-xs font-medium uppercase tracking-widest text-slate-200">
          © {new Date().getFullYear()} DraftDock.
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        <a
          href="/my-story"
          className="font-label text-xs font-medium uppercase tracking-widest text-slate-200 hover:text-indigo-300 transition-colors"
        >
          Resources
        </a>
        <a
          href="https://x.com/AbhasBehera1"
          target="_blank"
          rel="noopener noreferrer"
          className="font-label text-xs font-medium uppercase tracking-widest text-slate-200 hover:text-indigo-300 transition-colors"
        >
          Twitter
        </a>
        <a
          href="https://github.com/MistaHolmes/DraftDock"
          target="_blank"
          rel="noopener noreferrer"
          className="font-label text-xs font-medium uppercase tracking-widest text-slate-200 hover:text-indigo-300 transition-colors"
        >
          Github
        </a>
        <a
          href="https://coff.ee/abhastheain"
          target="_blank"
          rel="noopener noreferrer"
          className="font-label text-xs font-medium uppercase tracking-widest text-indigo-400 hover:bg-black hover:text-white px-2 py-1 rounded transition-all duration-300 active:scale-95"
        >
          Support Developer
        </a>
      </div>
    </footer>
  );
};

export default NewFooter;
