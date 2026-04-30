import { Skeleton } from "@/components/ui/skeleton";

interface BlogSkeletonProps {
  variant?: "small" | "medium" | "large";
}

const BlogSkeleton: React.FC<BlogSkeletonProps> = ({ variant = "small" }) => {
  // Base skeleton lines (title + 3 lines)
  const baseLines = [
    <Skeleton key="title" className="h-8 w-3/4 mb-4" />,
    <Skeleton key="line1" className="h-5 w-full mb-2" />,
    <Skeleton key="line2" className="h-5 w-5/6 mb-2" />,
    <Skeleton key="line3" className="h-5 w-2/3" />,
  ];

  // Extra lines for medium and large variants
  const extraLinesMedium = [
    <Skeleton key="extra1" className="h-5 w-full mb-2" />,
    <Skeleton key="extra2" className="h-5 w-4/6 mb-2" />,
    <Skeleton key="extra3" className="h-5 w-4/6 mb-2" />,
    <Skeleton key="extra4" className="h-5 w-4/6 mb-2" />,
    <Skeleton key="extra5" className="h-5 w-4/6 mb-2" />,
  ];

  const extraLinesLarge = [
    <Skeleton key="large1" className="h-5 w-full mb-2" />,
    <Skeleton key="large2" className="h-5 w-4/6 mb-2" />,
    <Skeleton key="large3" className="h-5 w-3/4 mb-2" />,
    <Skeleton key="large4" className="h-5 w-3/4 mb-2" />,
    <Skeleton key="large5" className="h-5 w-3/4 mb-2" />,
    <Skeleton key="large6" className="h-5 w-3/4 mb-2" />,
  ];

  let skeletons = baseLines;

  if (variant === "medium") {
    skeletons = [...baseLines, ...extraLinesMedium];
  } else if (variant === "large") {
    skeletons = [...baseLines, ...extraLinesMedium, ...extraLinesLarge];
  }

  return (
    <div className="p-6 mb-6 w-full max-w-4xl mx-auto bg-transparent">
      {variant !== "small" && (
        <div className="w-full h-64 rounded-md mb-6 bg-gray-200 dark:bg-[rgba(255,255,255,0.04)] animate-pulse" />
      )}
      <div className="space-y-2">
        {skeletons}
      </div>
    </div>
  );
};

export default BlogSkeleton;
