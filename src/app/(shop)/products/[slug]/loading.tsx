import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex gap-2">
        {[60, 80, 100, 120].map((width, i) => (
          <Skeleton key={i} className="h-4" style={{ width }} />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-md" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-px w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
