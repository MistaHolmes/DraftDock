import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

/**
 * A thin, animated progress bar fixed to the top of the viewport.
 * It fills up as the user scrolls through the page content.
 */
const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const smoothProgress = useSpring(0, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(percent);
      smoothProgress.set(percent);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, [smoothProgress]);

  return (
    <motion.div
      className="fixed top-0 left-0 h-[3px] z-[100]"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: progress > 0.5 ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
};

export default ReadingProgressBar;
