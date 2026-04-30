import React from "react";
import Sidebar from "../SideBar";
import { AppHeader } from "./AppHeader";
import { Footer } from "../Footer";

interface AppShellProps {
  children: React.ReactNode;
  activePage?: string;
  hideSidebar?: boolean;
  hideRightPanel?: boolean;
  rightPanelContent?: React.ReactNode;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  showSearch?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activePage,
  hideSidebar = false,
  hideRightPanel = false,
  rightPanelContent,
  searchTerm,
  setSearchTerm,
  showSearch = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Global Header */}
      <AppHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearch}
      />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar */}
        {!hideSidebar && (
          <div className="hidden md:block flex-shrink-0 self-stretch">
            <Sidebar activePage={activePage} />
          </div>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 p-4 md:p-6 transition-all duration-300 pb-20 md:pb-6 ${!hideSidebar ? 'md:px-8' : 'px-4'}`}>
          {children}
        </main>

        {/* Right Sidebar */}
        {!hideRightPanel && (
          <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-l border-gray-200/80 dark:border-gray-800/80 p-6">
            {rightPanelContent || (
              <div className="space-y-8">
                <div className="p-6 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl text-white shadow-xl shadow-violet-200/30 dark:shadow-none">
                  <h4 className="font-headline text-xl font-bold mb-2">Upgrade to Dock Elite</h4>
                  <p className="font-body text-xs opacity-90 mb-6 leading-relaxed">Early access to premium drafts, and help build the future of the Dock.</p>
                  <button className="w-full py-3 bg-white text-violet-600 font-label font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                    Get Started
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">Trending on DraftDock</h5>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3">
                        <span className="text-2xl font-bold text-gray-200 dark:text-gray-700">0{i}</span>
                        <div>
                          <h6 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">How AI is changing the landscape of decentralized blogging in 2026.</h6>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">5 min read</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Sidebar (drawer handled internally by Sidebar component) */}
      {!hideSidebar && (
        <div className="md:hidden">
          <Sidebar activePage={activePage} />
        </div>
      )}

      {/* Site Footer - always at bottom, full width */}
      <footer className="w-full">
        <Footer />
      </footer>
    </div>
  );
};
