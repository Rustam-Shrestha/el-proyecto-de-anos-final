export type SkeletonType = "list" | "table" | "grid";

type SkeletonLoaderProps = {
  count?: number;
  type?: SkeletonType;
};

type SkeletonHookArgs<T> = {
  data?: T | null;
  isLoading: boolean;
};

const rowWidths = ["w-5/6", "w-3/4", "w-4/5", "w-2/3", "w-11/12"];

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <SkeletonBlock className="h-4 w-1/2" />
        <SkeletonBlock className={`mt-3 h-3 ${rowWidths[index % rowWidths.length]}`} />
        <SkeletonBlock className={`mt-2 h-3 ${rowWidths[(index + 1) % rowWidths.length]}`} />
      </div>
    ))}
  </div>
);

const TableSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
    <div className="grid grid-cols-4 gap-4 border-b border-gray-100 bg-gray-50 p-4">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-4 w-20" />
      <SkeletonBlock className="h-4 w-28" />
      <SkeletonBlock className="h-4 w-16" />
    </div>
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4">
          <SkeletonBlock className="h-4 w-11/12" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-4 w-4/5" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

const GridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="mt-4 h-4 w-2/3" />
        <SkeletonBlock className="mt-2 h-3 w-1/2" />
      </div>
    ))}
  </div>
);

export const SkeletonLoader = ({ count = 5, type = "list" }: SkeletonLoaderProps) => {
  if (type === "table") {
    return <TableSkeleton count={count} />;
  }

  if (type === "grid") {
    return <GridSkeleton count={count} />;
  }

  return <ListSkeleton count={count} />;
};

export const useSkeletonLoader = <T,>({ data, isLoading }: SkeletonHookArgs<T>) => {
  return {
    isLoading,
    showSkeleton: isLoading || !data,
  };
};

export default SkeletonLoader;