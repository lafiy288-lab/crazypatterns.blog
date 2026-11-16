import { cn } from "@/lib/utils";

/** Fades content in as it scrolls into view using CSS scroll-driven animations (no JS). */
export function Reveal({ children, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <div className={cn("reveal", className)}>{children}</div>;
}
