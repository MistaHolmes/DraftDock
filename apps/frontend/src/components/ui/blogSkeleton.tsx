// Skeleton Loading Component
const BlogSkeleton = () => (
  <div className="mb-4 border-b pb-4 last:border-none rounded-lg p-4 -m-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-3"></div>
        
        {/* Content skeleton - multiple lines */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        
        {/* Date skeleton */}
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
      
    </div>
  </div>
);

// Draft Blog Skeleton (with draft badge)
const DraftBlogSkeleton = () => (
  <div className="mb-4 border-b pb-4 last:border-none rounded-lg p-4 -m-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        {/* Title and badge skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded-md w-2/3"></div>
          <div className="h-6 bg-yellow-100 rounded-full w-12"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        
        {/* Date skeleton */}
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
      
      {/* Buttons skeleton */}
      <div className="ml-4 flex gap-2">
        <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
        <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

export { BlogSkeleton, DraftBlogSkeleton };