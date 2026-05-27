export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-[2rem] border border-gray-200 p-6 animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded-lg w-1/3"></div>
        <div className="h-4 bg-gray-100 rounded w-full"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 p-6 animate-pulse space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
          </div>
          <div className="w-20 h-8 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-lg w-1/2"></div>
      <div className="h-5 bg-gray-100 rounded w-2/3"></div>
    </div>
  );
}

export function SkeletonTabs() {
  return (
    <div className="flex gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 rounded-lg w-24"></div>
      ))}
    </div>
  );
}

export function SkeletonFormField() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
