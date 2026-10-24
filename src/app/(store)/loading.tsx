export default function Loading() {
  return (
    <div className="container-page py-16" aria-busy="true" aria-label="Loading">
      <div className="mx-auto h-10 w-64 animate-pulse bg-sand" />
      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] animate-pulse bg-sand" />
            <div className="h-4 w-3/4 animate-pulse bg-sand" />
            <div className="h-3 w-1/3 animate-pulse bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}
