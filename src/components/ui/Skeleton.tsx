export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        animate-pulse
        bg-gradient-to-r
        from-border
        via-border-strong
        to-border
        bg-[length:200%_100%]
        rounded-lg
        ${className}
      `}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full mb-2" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-4 ${className}`}>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-2/5 mb-1" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 text-right" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 4, className = '' }: { columns?: number; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-lg p-3 ${className}`}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}