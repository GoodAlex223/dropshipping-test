import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryDetailLoading() {
  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex gap-2">
        {[60, 80, 100].map((width, i) => (
          <Skeleton key={i} className="h-4" style={{ width }} />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-64" />
        <Skeleton className="mt-4 h-4 w-24" />
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex justify-end">
        <Skeleton className="h-10 w-[160px]" />
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <Skeleton className="aspect-square" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
