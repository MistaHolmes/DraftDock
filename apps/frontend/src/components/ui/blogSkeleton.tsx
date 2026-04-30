// Skeleton Loading Component
import { Skeleton } from "./skeleton";

const BlogSkeleton = () => (
  <div className="mb-4 pb-4 last:border-none rounded-lg p-4 bg-transparent">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4 mb-3" />

        {/* Content skeleton - multiple lines */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        {/* Date skeleton */}
        <Skeleton className="h-3 w-1/3" />
      </div>

    </div>
  </div>
);

// Draft Blog Skeleton (with draft badge)
const DraftBlogSkeleton = () => (
  <div className="mb-4 pb-4 last:border-none rounded-lg p-4 bg-transparent">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        {/* Title and badge skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-6 w-2/3" />
          <div className="h-6 rounded-full w-12 bg-yellow-100/80" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        {/* Date skeleton */}
        <Skeleton className="h-3 w-1/3" />
      </div>

      {/* Buttons skeleton */}
      <div className="ml-4 flex gap-2">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[rgba(255,255,255,0.06)]" />
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[rgba(255,255,255,0.06)]" />
      </div>
    </div>
  </div>
);

export { BlogSkeleton, DraftBlogSkeleton };