import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface ReadabilityMeterProps {
  content: string;
}

interface ReadabilityData {
  score: number;
  grade: string;
  level: "easy" | "moderate" | "difficult";
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
}

const ReadabilityMeter = ({ content }: ReadabilityMeterProps) => {
  const [data, setData] = useState<ReadabilityData | null>(null);

  useEffect(() => {
    if (!content || content.trim().length < 50) { setData(null); return; }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/readability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) setData(await res.json());
      } catch { /* silently fail */ }
    }, 1500); // Debounce 1.5s

    return () => clearTimeout(timeout);
  }, [content]);

  if (!data) return null;

  const color = data.level === "easy" ? "text-green-500" : data.level === "moderate" ? "text-amber-500" : "text-red-500";
  const bg = data.level === "easy" ? "bg-green-50 dark:bg-green-900/20" : data.level === "moderate" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-red-50 dark:bg-red-900/20";
  const barWidth = `${Math.min(100, data.score)}%`;
  const barColor = data.level === "easy" ? "bg-green-500" : data.level === "moderate" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <Gauge size={14} className={color} /> Readability
        </span>
        <span className={`text-lg font-bold ${color}`}>{data.score}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: barWidth }} />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{data.grade}</span>
        <span>{data.wordCount} words · {data.sentenceCount} sentences</span>
      </div>
    </div>
  );
};

export default ReadabilityMeter;
