export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 w-full ${className}`} />;
}

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="skeleton h-40 w-full" />
      <div className="p-4 space-y-3">
        <SkeletonLine className="h-5 w-2/3" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
