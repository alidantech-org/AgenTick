import { Tick } from "@/components/tick";

export function Stamp({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex size-[76px] flex-none -rotate-[10deg] flex-col items-center justify-center gap-[3px] rounded-full border-[1.5px] border-foreground bg-surface text-center transition-transform duration-500 ease-out ${className}`}
    >
      <Tick className="size-[15px] text-foreground" />
      <span className="px-1 font-mono text-[8px] leading-tight tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
