export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="skeleton aspect-[4/5] rounded-none" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-5 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${90 - (i % 3) * 15}%` }} />
      ))}
    </div>
  );
}

export function PageSkeleton({ withSidebar = false }: { withSidebar?: boolean }) {
  return (
    <div className="container-page py-10">
      <div className="skeleton mb-3 h-8 w-64" />
      <div className="skeleton mb-8 h-4 w-96 max-w-full" />
      <div className={withSidebar ? "grid gap-8 lg:grid-cols-[260px_1fr]" : ""}>
        {withSidebar && <div className="skeleton hidden h-[520px] lg:block" />}
        <ProductGridSkeleton count={withSidebar ? 9 : 8} />
      </div>
    </div>
  );
}
