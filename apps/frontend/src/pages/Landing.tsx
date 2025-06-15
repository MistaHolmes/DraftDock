import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, easeOut } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, } from "@clerk/clerk-react";
import TypeWriter from "../components/TypeWriter";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";

const LandingPage: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridX = useSpring(mouseX, { stiffness: 80, damping: 15, mass: 0.7 });
  const gridY = useSpring(mouseY, { stiffness: 80, damping: 15, mass: 0.7 });

  const [isGridActive, setIsGridActive] = useState(false);
  const { isLoaded } = useAuth();
  const route = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(((e.clientX - centerX) / centerX) * 30);
      mouseY.set(((e.clientY - centerY) / centerY) * 30);
    };

    if (isGridActive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isGridActive, mouseX, mouseY]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        delayChildren: 0.3,
        staggerChildren: 0.2,
       },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: easeOut,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden relative">
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
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 0, 0, 0.12) 1.5px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 0, 0, 0.12) 1.5px, transparent 1px)
                `,
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
      <div className="absolute top-4 right-4 z-20">
        <SignedOut>
          <SignInButton>
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
              className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4"
            >
              Read And Write Blogs of Folks, and Have a great time in this site
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center px-4"
            >
              <SignedIn>
                <button
                  onClick={() => route("/create-blog")}
                  className="min-w-[140px] px-6 py-4 border-2 border-black text-black hover:bg-black hover:text-white rounded-md transition-all font-medium"
                >
                  Start Drafting <ArrowRight className="ml-2 inline h-5 w-5" />
                </button>
                <button className="min-w-[140px] px-6 py-4 bg-black text-white hover:bg-transparent hover:text-black border-2 border-black rounded-md transition-all font-medium"
                  onClick={() => route("/blogs")}
                >
                  Start Reading <ArrowRight className="ml-2 inline h-5 w-5" />
                </button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="min-w-[140px] px-6 py-4 border-2 border-black text-black hover:bg-black hover:text-white rounded-md transition-all font-medium">
                    Start Drafting <ArrowRight className="ml-2 inline h-5 w-5" />
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="min-w-[140px] px-6 py-4 bg-black text-white hover:bg-transparent hover:text-black border-2 border-black rounded-md transition-all font-medium">
                    Start Reading <ArrowRight className="ml-2 inline h-5 w-5" />
                  </button>
                </SignInButton>
              </SignedOut>              
            </motion.div>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;

