import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BorderBeamProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  durationMs?: number;
};

export function BorderBeam({
  children,
  className,
  contentClassName,
  durationMs = 6000,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[1.75rem] p-px",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-150%] animate-spin [animation-duration:var(--beam-duration)] [background:conic-gradient(from_0deg,transparent_0%,color-mix(in_oklch,var(--foreground)_50%,transparent)_10%,transparent_25%)]"
        style={
          {
            "--beam-duration": `${durationMs}ms`,
          } as CSSProperties
        }
      />
      <div className={cn("relative rounded-[inherit]", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
