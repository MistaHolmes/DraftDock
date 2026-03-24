import { Skeleton } from "@/components/ui/skeleton";

const SubmitSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <Skeleton className="h-8 w-3/4 mb-4" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-11/12 mb-2" />
      <Skeleton className="h-5 w-10/12 mb-2" />
      <Skeleton className="h-5 w-9/12 mb-2" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  );
};

export default SubmitSkeleton;
