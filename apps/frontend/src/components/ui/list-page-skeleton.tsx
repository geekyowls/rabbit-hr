import { Skeleton } from '@/components/ui/skeleton';

interface ListPageSkeletonProps {
  title?: boolean;
  subtitle?: boolean;
  actionButton?: boolean;
  searchBar?: boolean;
  filters?: number;
  rows?: number;
}

export function ListPageSkeleton({
  title = true,
  subtitle = true,
  actionButton = true,
  searchBar = true,
  filters = 2,
  rows = 5,
}: ListPageSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title && <Skeleton className="h-7 w-32" />}
          {subtitle && <Skeleton className="h-4 w-48" />}
        </div>
        {actionButton && <Skeleton className="h-10 w-24" />}
      </div>

      {(searchBar || filters > 0) && (
        <div className="flex flex-wrap gap-4">
          {searchBar && <Skeleton className="h-10 w-64" />}
          {Array.from({ length: filters }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-40" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
