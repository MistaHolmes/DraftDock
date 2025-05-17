import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import TypeWriter from "../components/TypeWriter";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridX = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 0.5 });
  const gridY = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 0.5 });

  const [animationDone, setAnimationDone] = useState(false);
  const route = useNavigate();

  useEffect(() => {
    if (!animationDone) return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(((e.clientX - centerX) / centerX) * 20);
      mouseY.set(((e.clientY - centerY) / centerY) * 20);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [animationDone, mouseX, mouseY]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden select-none relative">
      <motion.div className="fixed inset-0 z-0">
        {/* Light background */}
        <div className="absolute inset-0 bg-white" />

        {/* Grid Fade + Float Wrapper */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          onAnimationComplete={() => setAnimationDone(true)}
        >
          {/* Floating effect */}
          <motion.div
            animate={{ y: [0, -10, 0, 8, 0], x: [0, 7, 0, -3, 0] }}
            transition={{
              duration: 12,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="absolute inset-0"
          >
            {/* Mouse-Reactive Grid */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 0, 0, 0.19) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 0, 0, 0.18) 1px, transparent 1px)
                `,
                backgroundSize: "clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px)",
                x: animationDone ? gridX : 0,
                y: animationDone ? gridY : 0,
              }}
            />
          </motion.div>
        </motion.div>

        {/* Light gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </motion.div>
        <main className="h-screen flex items-center justify-center z-10 relative px-4">
          <div className="absolute top-7 left-6 flex space-x-2 z-20">
            <div className="h-2 w-2 rounded-full bg-black"></div>
            <div className="h-2 w-2 rounded-full bg-black"></div>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <SignedOut>
              <SignInButton>
                <button
                  className="px-4 py-2 border border-black text-black rounded-md hover:bg-black hover:text-white transition"
                  aria-label="Sign in"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton/>
            </SignedIn>
          </div>
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
          <motion.p variants={itemVariants} className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Write and Like Blogs of Folks, and Have a great time in this site
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
          >
            <SignedIn>
              <motion.button
                variants={itemVariants}
                className="w-full sm:w-auto mt-3 sm:mt-10 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 ease-in-out text-base px-6 py-4 h-auto bg-transparent rounded-md font-medium"
                onClick={() => route("/blogs")}
              >
                DRAFTS
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </motion.button>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <motion.button
                  variants={itemVariants}
                  className="w-full sm:w-auto mt-4 sm:mt-10 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 ease-in-out text-base px-6 py-4 h-auto bg-transparent rounded-md font-medium"
                >
                  DRAFTS
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </motion.button>
              </SignInButton>
            </SignedOut>

            <motion.button
              variants={itemVariants}
              className="w-full sm:w-auto mt-4 sm:mt-10 bg-black text-white border-2 border-black hover:bg-transparent hover:text-black transition-all duration-300 ease-in-out text-base px-6 py-4 h-auto rounded-md font-medium"
            >
              CANVAS
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </motion.button>
          </motion.div>
        </motion.section>
      </main>

      <footer className=" border-t border-black/10 text-gray-600 px-6 py-10 text-sm text-center z-10 relative">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-center gap-6 flex-wrap">
            <a href="#" className="hover:text-black transition">Privacy Policy</a>
            <a href="#" className="hover:text-black transition">Terms of Service</a>
            <a href="#" className="hover:text-black transition">Contact</a>
            <a href="https://github.com/MistaHolmes" className="hover:text-black transition">GitHub</a>
          </div>
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} kreatify.app. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
