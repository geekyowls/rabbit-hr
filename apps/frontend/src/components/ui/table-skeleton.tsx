export function TableSkeleton() {
  return (
    <div className="w-full mt-3 container mx-auto">
      {/* Table header */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-4 w-44 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="flex gap-3">
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border dark:border-gray-800 dark:border-opacity-60">
        {/* Table header row */}
        <div className="flex items-center p-6 border-b dark:border-gray-800 bg-gray-50 dark:bg-dark-card">
          <div className="flex-1 h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="flex-1 h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse ml-8" />
          <div className="flex-1 h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse ml-8" />
          <div className="flex-1 h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse ml-8" />
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse ml-8" />
        </div>

        {/* Table rows */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center p-6 border-b dark:border-gray-800 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors dark:bg-dark-background"
          >
            <div className="flex-1 h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="flex-1 h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse ml-8" />
            <div className="flex-1 h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse ml-8" />
            <div className="flex-1 h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse ml-8" />
            <div className="w-24 flex gap-3 ml-8">
              <div className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-5 p-2">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="flex gap-3">
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
