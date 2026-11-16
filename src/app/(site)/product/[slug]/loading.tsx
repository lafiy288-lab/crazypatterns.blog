import { TextSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
      <div className="skeleton aspect-[4/5]" />
      <div className="space-y-5">
        <div className="skeleton h-10 w-3/4" />
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-8 w-1/4" />
        <div className="skeleton h-12 w-1/2" />
        <TextSkeleton lines={6} />
      </div>
    </div>
  );
}
