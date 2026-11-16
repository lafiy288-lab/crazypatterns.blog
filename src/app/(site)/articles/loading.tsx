export default function Loading() {
  return (
    <div className="container-page py-10" role="status" aria-label="Loading articles">
      <div className="skeleton mb-8 h-9 w-48" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton aspect-[16/9] rounded-none" />
            <div className="space-y-2 p-5"><div className="skeleton h-5 w-4/5" /><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-2/3" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
