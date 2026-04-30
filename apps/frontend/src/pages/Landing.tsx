import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, easeOut } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, } from "@clerk/clerk-react";
import TypeWriter from "../components/TypeWriter";
import RotatingWords from "@/components/RotatingWords";
import { useNavigate } from "react-router-dom";
import BackgroundGlow from "@/components/ui/BackgroundGlow";
import { Footer } from "@/components/Footer";

const LandingPage: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridX = useSpring(mouseX, { stiffness: 80, damping: 15, mass: 0.7 });
  const gridY = useSpring(mouseY, { stiffness: 80, damping: 15, mass: 0.7 });

  const [isGridActive, setIsGridActive] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const hueRef = useRef<HTMLDivElement | null>(null);
  const { isLoaded } = useAuth();
  const route = useNavigate();

  // grid parallax values will be driven from the main RAF follower below

  // Always track mouse for the hue effect using requestAnimationFrame for smooth, GPU-accelerated updates
  useEffect(() => {
    // initialize dark state from document class or localStorage
    try {
      const saved = localStorage.getItem("site-theme");
      if (saved) setIsDark(saved === "dark");
      else setIsDark(document.documentElement.classList.contains("dark"));
    } catch (_) {
      setIsDark(document.documentElement.classList.contains("dark"));
    }

    let rafId: number | null = null;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let hasMoved = false;

    const tick = () => {
      if (hueRef.current && hasMoved) {
        const h = 250 + Math.round((targetX / window.innerWidth) * 60);
        // Use transform (translate3d) so motion is GPU-accelerated and precise
        hueRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
        // adjust hue background based on theme
        if (isDark) {
          hueRef.current.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06), rgba(255,255,255,0) 40%)`;
        } else {
          hueRef.current.style.background = `radial-gradient(circle at 30% 30%, hsla(${h},80%,62%,0.14), rgba(0,0,0,0) 40%)`;
        }
      }

      // only drive the grid spring after the first real mouse event
      if (hasMoved) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mouseX.set(((targetX - centerX) / centerX) * 30);
        mouseY.set(((targetY - centerY) / centerY) * 30);
      }

      rafId = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      hasMoved = true;
    };

    window.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mouseX, mouseY]);

  // react to manual theme changes (toggle from ThemeToggle)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "site-theme") {
        setIsDark(e.newValue === "dark");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.45,
        staggerChildren: 0.35,
       },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 1.0,
        ease: easeOut,
      },
    },
  };

  // Reveal-on-scroll variants (waterfall / stagger)
  const revealContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.18 } },
  };

  const revealItem = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.95, ease: easeOut } },
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden relative">
      <BackgroundGlow />
      {/* Background */}
      <motion.div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gray-150" />

        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          onAnimationComplete={() => setIsGridActive(true)}
        >
            <motion.div
            animate={{ y: [0, -10, 0, 8, 0], x: [0, 7, 0, -3, 0] }}
            transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
            className="absolute inset-0"
          >
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: isDark
                  ? `linear-gradient(to right, rgba(255,255,255,0.06) 1.5px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1.5px, transparent 1px)`
                  : `linear-gradient(to right, rgba(0, 0, 0, 0.12) 1.5px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.12) 1.5px, transparent 1px)`,
                backgroundSize: "clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px)",
                x: isGridActive ? gridX : 0,
                y: isGridActive ? gridY : 0,
              }}
            />
          </motion.div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </motion.div>

      {/* Header */}
      <div className="absolute top-7 left-6 flex space-x-2 z-20">
        <div className="h-2 w-2 rounded-full bg-black"></div>
        <div className="h-2 w-2 rounded-full bg-black"></div>
      </div>
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <a
          href="https://dockstudio.abhasbehera.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-black bg-transparent text-black rounded-md hover:bg-black hover:text-white transition"
        >
          DockStudio
        </a>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 border border-black bg-black text-white rounded-md hover:bg-white hover:text-black transition">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      {/* Main content */}
      <main className="h-screen flex items-center justify-center px-4 relative z-10">
        {isLoaded && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[90%] sm:max-w-3xl text-center space-y-6 sm:space-y-8"
          >
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight flex flex-wrap items-center justify-center gap-2"
            >
              <span className="bg-black text-white px-2">
                <TypeWriter text="DraftDock" className="inline-block" />
              </span>
              <span className="flex items-center">.app</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4 flex items-center justify-center gap-2"
            >
              A collaborative space for evolving
              <RotatingWords
                words={["Performance", "Scalability", "Architecture", "Patterns", "Best Practices"]}
                className="text-indigo-600 italic"
              />
              in real time.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center px-4"
            >
              <SignedIn>
                <motion.button
                  onClick={() => route("/create-blog")}
                  className="min-w-[140px] px-6 py-4 border-2 border-black bg-white text-black hover:bg-black hover:text-white rounded-md transition-all font-medium"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start Drafting <ArrowRight className="ml-2 inline h-5 w-5" />
                </motion.button>
                <motion.button className="min-w-[140px] px-6 py-4 bg-black text-white hover:bg-white hover:text-black border-2 border-black rounded-md transition-all font-medium"
                  onClick={() => route("/blogs")}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start Reading <ArrowRight className="ml-2 inline h-5 w-5" />
                </motion.button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="min-w-[140px] px-6 py-4 border-2 border-black text-black hover:bg-black hover:text-white rounded-md transition-all font-medium">
                    Start Drafting <ArrowRight className="ml-2 inline h-5 w-5" />
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="min-w-[140px] px-6 py-4 bg-black text-white hover:bg-white hover:text-black border-2 border-black rounded-md transition-all font-medium">
                    Start Reading <ArrowRight className="ml-2 inline h-5 w-5" />
                  </button>
                </SignInButton>
              </SignedOut>
            </motion.div>
          </motion.section>
        )}
        {/* Bouncing down arrow (nudge to scroll) - positioned at bottom of hero section */}
        <motion.button
          aria-label="Scroll down"
          onClick={() => window.scrollTo({ top: window.innerHeight - 80, behavior: 'smooth' })}
          className="absolute left-1/2 -translate-x-1/2 z-30 bottom-12 bg-white text-black border border-gray-200 rounded-full p-3 shadow-lg hover:shadow-2xl"
          initial={{ y: 0 }}
          animate={{ y: [0, -14, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </main>
      {/* Hue follower (position updated via ref on mousemove) */}
      <div
        ref={hueRef}
        aria-hidden
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform, background',
          width: 420,
          height: 420,
          pointerEvents: 'none',
          borderRadius: '50%',
          mixBlendMode: 'screen',
          zIndex: 2,
          filter: 'blur(72px) saturate(120%)',
        }}

      />

      {/* Designed for Mental Clarity */}
      <motion.section
        className="py-24 px-6 md:px-12 w-full max-w-screen-2xl mx-auto overflow-hidden"
        variants={revealContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div className="lg:col-span-7 relative" variants={revealItem}>
            <div className="aspect-video bg-surface-container-low relative overflow-hidden">
              <img
                alt="Minimalist workstation"
                className="w-full h-full object-cover grayscale opacity-80"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM7_qmbbDsNXF60Bc6q6Evonx4eBITxlHbSBIySj1Vx0dskGuXJgdU-841a5XfegomqA7i8CL0uAqqT5daKg5hWCn6WiH_ei0Lfr23VQpIH4K3bHF-K9jhCUgb0jWE2I7NCM7yx9jPI9ylSlRT3dCpUYoNYmayZQxuAxYIJO-usZrqFL8wKgIryoYasaXdh0dyCc-Baibb1qr1h74IZ1LOa0a5Wd8g9trzerVhPiHQ9WwmZyRXk9wdquORE3VdnWmoc58vJeQqbSw"
              />
              <div className="absolute inset-0 bg-primary/5"></div>
            </div>
          </motion.div>
          <motion.div className="lg:col-span-5 lg:pl-12" variants={revealItem}>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 leading-none">
              Designed for <br/>Mental Clarity.
            </h2>
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              We've removed the noise. No toolbars that distract, no complex menus that confuse. Just a pure drafting plane where your ideas take physical shape in high-contrast precision.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary" data-icon="architecture">architecture</span>
                <span className="font-bold uppercase text-xs tracking-widest">Architectural Grid System</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary" data-icon="history_edu">history_edu</span>
                <span className="font-bold uppercase text-xs tracking-widest">Ink-Ready Typography</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="py-24 px-6 md:px-12 w-full max-w-screen-2xl mx-auto"
        variants={revealContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className="mb-16">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-on-surface-variant">Module.01</span>
          <h2 className="text-4xl font-black uppercase tracking-tighter mt-2">Core Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div variants={revealItem} className="bg-surface-container-low p-10 flex flex-col justify-between group hover:bg-surface-container-highest transition-colors cursor-default">
            <div>
              <span className="material-symbols-outlined text-6xl mb-6 block" data-icon="groups">groups</span>
              <h3 className="text-xl font-bold uppercase mb-3">Real-Time Collaboration</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">Co-author drafts with your team live. Every keystroke syncs instantly — no conflicts, no waiting.</p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Live multi-user cursors
              </li>
              <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Conflict-free merge engine
              </li>
              <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Presence indicators per section
              </li>
            </ul>
          </motion.div>
          {/* Card 2 – accent */}
          <motion.div variants={revealItem} className="bg-primary p-10 flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-6xl mb-6 block text-white" data-icon="code">edit_note</span>
              <h3 className="text-xl font-bold uppercase mb-3 text-white">Rich Markdown Editor</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-6">Write in pure Markdown with a live split-preview. Full GFM, syntax-highlighted code blocks, and inline math — all rendered beautifully.</p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-white/70">
                <span className="material-symbols-outlined text-sm text-white">check_circle</span>
                GitHub-Flavored Markdown
              </li>
              <li className="flex items-center gap-2 text-xs text-white/70">
                <span className="material-symbols-outlined text-sm text-white">check_circle</span>
                100+ language code highlight
              </li>
              <li className="flex items-center gap-2 text-xs text-white/70">
                <span className="material-symbols-outlined text-sm text-white">check_circle</span>
                Cover images & tags
              </li>
            </ul>
          </motion.div>
          {/* Card 3 */}
          <motion.div variants={revealItem} className="bg-surface-container-low p-10 flex flex-col justify-between group hover:bg-surface-container-highest transition-colors cursor-default">
            <div>
              <span className="material-symbols-outlined text-6xl mb-6 block" data-icon="ai_assistant">auto_awesome</span>
              <h3 className="text-xl font-bold uppercase mb-3">AI Writing Assistant</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">Stuck mid-draft? Ask the integrated AI to continue, rephrase, summarise, or brainstorm — right inside the editor, no tab-switching.</p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Contextual continuation
              </li>
              <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Tone & style rewriter
              </li>
              <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                One-click TL;DR summaries
              </li>
            </ul>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="py-24 bg-surface-container-high"
        variants={revealContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 text-center">
          <motion.div variants={revealItem} className="mb-12">
            <span className="material-symbols-outlined text-primary text-5xl" data-icon="format_quote" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>format_quote</span>
          </motion.div>
          <motion.blockquote variants={revealItem} className="text-3xl md:text-5xl font-light italic tracking-tight mb-12 text-on-surface">
            "DraftDock is the first writing environment that respects the mathematical structure of a story. It’s an essential part of my technical workflow."
          </motion.blockquote>
          <motion.div variants={revealItem} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary mb-4 grayscale">
              <img alt="User portrait" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWdNSsIipQb-1ZDVz6dpAla8uJrQSeEmdZynYrrURAp2XjRjdQ73A154QGyuVVF6irsyRq4IFTxWLHCPJt3PoEz9i5OSFSQnn1rJKYnePAbD13XNJ6EBqLom0JFCrWnNSLY9x62QG5PjQK6CwebJhc6Q3nST_-vXhA2rbHPRx7TPUlOwfPIi0RR4e-AfvUycejVtVjOrfXqnVV-s01SG0-YD-7SKxwjMFz1XKCwD54i0h4YJnooAYQbKNaAVJscVRA5zBoB-UyU1g"/>
            </div>
            <p className="font-bold uppercase text-xs tracking-[0.2em]">Julian Thorne</p>
            <p className="text-[10px] uppercase text-on-surface-variant mt-1">Lead Architect, NEXUS LABS</p>
          </motion.div>
        </div>
      </motion.section>

      <section className="py-24 px-6 md:px-12 w-full max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-on-surface-variant">How it works</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter mt-2 mb-12">From Draft to Published</h2>
                <div className="space-y-12">
                <motion.div variants={revealItem} className="group">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-2xl font-bold uppercase flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl text-primary">edit_note</span>
                      Write &amp; Format
                    </h4>
                    <span className="font-mono text-[10px] text-outline">01</span>
                  </div>
                  <p className="text-on-surface-variant pb-8 border-b border-outline-variant/20">Open the editor, write in Markdown, drop in cover art, and organise with tags. The live preview shows exactly how readers will see your post before you hit publish.</p>
                </motion.div>
                <motion.div variants={revealItem} className="group">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-2xl font-bold uppercase flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl text-primary">explore</span>
                      Publish &amp; Get Discovered
                    </h4>
                    <span className="font-mono text-[10px] text-outline">02</span>
                  </div>
                  <p className="text-on-surface-variant pb-8 border-b border-outline-variant/20">One click publishes your post to your public profile. The Explore feed surfaces your work to readers browsing by topic, trending posts, and personalised recommendations.</p>
                </motion.div>
                <motion.div variants={revealItem} className="group">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-2xl font-bold uppercase flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl text-primary">local_fire_department</span>
                      Build Streaks &amp; Earn Badges
                    </h4>
                    <span className="font-mono text-[10px] text-outline">03</span>
                  </div>
                  <p className="text-on-surface-variant pb-8 border-b border-outline-variant/20">Write consistently to build publishing streaks and climb the Leaderboard. Unlock achievement badges as you hit milestones — your progress is always on display on your profile.</p>
                </motion.div>
              </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full aspect-square bg-gray-50 relative p-8">
              <div className="absolute inset-0 drafting-grid opacity-10" />
              <div className="relative h-full w-full border border-gray-300 bg-gray-50 flex flex-col p-12 justify-center items-center">
                <span className="material-symbols-outlined text-8xl text-black mb-8" data-icon="token">token</span>
                <div className="text-center">
                  <p className="text-3xl font-black uppercase tracking-tighter mb-4 text-black">DraftDock Enterprise</p>
                  <p className="text-sm text-gray-600 mb-8 max-w-xs mx-auto">Scalable infrastructure for global documentation teams and technical writers.</p>
                  <button
                    onClick={() => route('/contact')}
                    className="bg-black text-white px-8 py-4 font-bold uppercase text-xs tracking-widest hover:opacity-80 transition-opacity"
                  >
                    Inquiry Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;

