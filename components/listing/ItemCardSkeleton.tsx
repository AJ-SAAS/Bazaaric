import { Skeleton } from "@/components/ui/Skeleton";

export default function ItemCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square rounded-xl" />
      <Skeleton className="mt-2 h-4 w-16" />
      <Skeleton className="mt-1 h-4 w-32" />
      <Skeleton className="mt-1 h-3 w-20" />
    </div>
  );
}