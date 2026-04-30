import React, { useEffect, useState } from "react";

const RotatingWords: React.FC<{ words: string[]; className?: string }> = ({ words, className }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const current = words[wordIndex] || "";

    if (phase === "typing") {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), 70);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), 700);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), 900 + Math.random() * 400);
    } else if (phase === "deleting") {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, text.length - 1)), 40);
      } else {
        setWordIndex((i) => (i + 1) % words.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [text, phase, wordIndex, words]);

  return (
    <span className={className}>
      {text}
      <span className="ml-1 inline-block text-indigo-600 dark:text-indigo-400 animate-pulse">|</span>
    </span>
  );
};

export default RotatingWords;
