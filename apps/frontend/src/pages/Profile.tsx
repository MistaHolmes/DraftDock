import { UserButton, useUser } from "@clerk/clerk-react";
import Header from "../components/ui/header";
import UserContentSection from "../components/UserContent";
import { Footer } from "@/components/Footer";

const ProfileComponent = () => {
  const { user, isLoaded } = useUser();

  const userName = isLoaded && user?.primaryEmailAddress?.emailAddress 
    ? user.primaryEmailAddress.emailAddress.split("@")[0].replace(/^./, c => c.toUpperCase())
    : "DraftDock User";

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container blueprint-grid min-h-screen flex flex-col">
      <Header />

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-6 w-full flex-1">
        {/* Profile Header */}
        <header className="flex flex-col md:flex-row items-start gap-12 mb-20">
          <div className="relative group">
            <div className="w-40 h-40 bg-surface-container-highest rounded-xl overflow-hidden ring-4 ring-white shadow-sm flex items-center justify-center">
              {isLoaded && user?.imageUrl ? (
                <img className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" alt="Profile" src={user.imageUrl} />
              ) : (
                <div className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 bg-primary opacity-20" />
              )}
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tighter font-headline mb-2">{userName}</h1>
              <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed">
                  Architecting the future of code and prose. Sharing architectural insights, code templates, and building scalable system designs.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-8 text-sm font-medium">
              <div className="flex flex-col">
                <span className="text-zinc-400 font-label uppercase tracking-widest text-[10px] mb-1">Published</span>
                <span className="text-xl font-headline font-bold">12</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-400 font-label uppercase tracking-widest text-[10px] mb-1">Drafts</span>
                <span className="text-xl font-headline font-bold">4</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-400 font-label uppercase tracking-widest text-[10px] mb-1">Reads</span>
                <span className="text-xl font-headline font-bold">1.2k</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-400 font-label uppercase tracking-widest text-[10px] mb-1">Member Since</span>
                <span className="text-xl font-headline font-bold">2024</span>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <div className="relative bg-surface-container-highest text-on-surface pl-2 pr-6 py-1.5 rounded-md font-headline font-bold flex items-center gap-3 hover:bg-surface-container-high transition-all">
                <div className="relative z-10 pointer-events-none">
                  <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                      elements: {
                          userButtonAvatarBox: "w-8 h-8",
                      },
                  }}/>
                </div>
                <span className="pointer-events-none">Manage Account</span>
                {/* Transparent overlay that catches clicks and proxies them to the Clerk button */}
                <div 
                   className="absolute inset-0 w-full h-full z-20 cursor-pointer"
                   onClick={(e) => {
                     const btn = e.currentTarget.parentElement?.querySelector('.cl-userButtonTrigger') as HTMLButtonElement | null;
                     if (btn) btn.click();
                   }}
                />
              </div>
              <a href="https://buymeacoffee.com/abhash" target="_blank" rel="noopener noreferrer" className="bg-secondary text-on-secondary px-6 py-2.5 rounded-md font-headline font-bold flex items-center gap-2 hover:bg-secondary/90 transition-all">
                <span className="material-symbols-outlined text-sm">coffee</span>
                Support
              </a>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Content Area */}
          <div className="flex-1 w-full">
            <UserContentSection />
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-12">
            {/* Quick Insights */}
            <section className="bg-surface-container-low p-8 rounded-xl">
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest mb-6">Quick Insights</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Weekly Growth</p>
                    <p className="text-2xl font-bold font-headline">+12.4%</p>
                  </div>
                  <span className="material-symbols-outlined text-green-600 mb-1">trending_up</span>
                </div>
                <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Top Category</p>
                    <p className="text-2xl font-bold font-headline">Architecture</p>
                  </div>
                  <span className="material-symbols-outlined text-primary mb-1">terminal</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Engagement</p>
                    <p className="text-2xl font-bold font-headline">High</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary mb-1">favorite</span>
                </div>
              </div>
            </section>
            
            {/* Trending Tags */}
            <section>
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest mb-6">Trending Tags</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-surface-container-lowest rounded-md text-xs font-bold border border-outline-variant/10 hover:bg-primary hover:text-white transition-all cursor-pointer">#webassembly</span>
                <span className="px-4 py-2 bg-surface-container-lowest rounded-md text-xs font-bold border border-outline-variant/10 hover:bg-primary hover:text-white transition-all cursor-pointer">#rustlang</span>
                <span className="px-4 py-2 bg-surface-container-lowest rounded-md text-xs font-bold border border-outline-variant/10 hover:bg-primary hover:text-white transition-all cursor-pointer">#productivity</span>
                <span className="px-4 py-2 bg-surface-container-lowest rounded-md text-xs font-bold border border-outline-variant/10 hover:bg-primary hover:text-white transition-all cursor-pointer">#devops</span>
                <span className="px-4 py-2 bg-surface-container-lowest rounded-md text-xs font-bold border border-outline-variant/10 hover:bg-primary hover:text-white transition-all cursor-pointer">#frontend</span>
              </div>
            </section>
            
            {/* Community Card */}
            <section className="bg-secondary-container p-8 rounded-xl">
              <h4 className="font-headline font-bold text-secondary text-sm mb-2">Support Research</h4>
              <p className="text-on-secondary-container text-xs mb-6 font-medium leading-relaxed">Your contributions help fund deep-dive technical research and open-source documentation.</p>
              <a href="https://buymeacoffee.com/abhash" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-secondary text-on-secondary py-3 rounded-md font-headline font-bold text-sm hover:opacity-90 transition-all">
                Buy Me a Coffee
              </a>
            </section>
          </aside>
        </div>
      </main>
      <div className="mt-8">
        <Footer />
      </div>
    </div>
  );
};

export default ProfileComponent;
