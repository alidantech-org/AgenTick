import { cn } from "@/lib/utils";

export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 text-foreground opacity-[0.05]",
        "[background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]",
        "[background-size:44px_44px]",
        "[mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent_75%)]",
        className,
      )}
    />
  );
}
