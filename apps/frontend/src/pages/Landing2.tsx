import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, } from "@clerk/clerk-react";
import TypeWriter from "../components/TypeWriter";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";

const LandingPage: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useSpring(mouseX, { stiffness: 40, damping: 20, mass: 1 });
  const bgY = useSpring(mouseY, { stiffness: 40, damping: 20, mass: 1 });

  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  const { isLoaded } = useAuth();
  const route = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(((e.clientX - centerX) / centerX) * 15);
      mouseY.set(((e.clientY - centerY) / centerY) * 15);
    };

    if (isBackgroundActive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isBackgroundActive, mouseX, mouseY]);

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
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden relative">
      {/* Background */}
      <motion.div className="fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          onAnimationComplete={() => setIsBackgroundActive(true)}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.02, 1, 1.01, 1],
              rotate: [0, 0.5, 0, -0.3, 0]
            }}
            transition={{ 
              duration: 20, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
            className="absolute inset-0"
          >
            <motion.div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-93IcsfNYof3sJtMY0MY9yLfh7TzbW0.png')`,
                x: isBackgroundActive ? bgX : 0,
                y: isBackgroundActive ? bgY : 0,
              }}
            />
          </motion.div>
        </motion.div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/10 to-white/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90" />
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
              className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto px-4 font-medium"
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
                  className="min-w-[140px] px-6 py-4 border-2 border-black text-black hover:bg-black hover:text-white rounded-md transition-all font-medium shadow-lg backdrop-blur-sm bg-white/80"
                >
                  Start Drafting <ArrowRight className="ml-2 inline h-5 w-5" />
                </button>
                <button className="min-w-[140px] px-6 py-4 bg-black text-white hover:bg-transparent hover:text-black border-2 border-black rounded-md transition-all font-medium shadow-lg"
                  onClick={() => route("/blogs")}
                >
                  Start Reading <ArrowRight className="ml-2 inline h-5 w-5" />
                </button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="min-w-[140px] px-6 py-4 border-2 border-black text-black hover:bg-black hover:text-white rounded-md transition-all font-medium shadow-lg backdrop-blur-sm bg-white/80">
                    Start Drafting <ArrowRight className="ml-2 inline h-5 w-5" />
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="min-w-[140px] px-6 py-4 bg-black text-white hover:bg-transparent hover:text-black border-2 border-black rounded-md transition-all font-medium shadow-lg">
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