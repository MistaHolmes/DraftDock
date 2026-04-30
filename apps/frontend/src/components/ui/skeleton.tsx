// components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-[rgba(255,255,255,0.06)] rounded-md",
        className
      )}
    />
  );
};
