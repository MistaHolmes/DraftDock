import { Skeleton } from "@/components/ui/skeleton";

const BlogSkeleton = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4 w-full max-w-3xl mx-auto">
      <Skeleton className="h-6 w-2/3 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-1" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
};

export default BlogSkeleton;
