export function WaveDivider({
  fillClassName = "fill-background",
  flip = false,
}: {
  fillClassName?: string;
  flip?: boolean;
}) {
  return (
    <div aria-hidden className={flip ? "rotate-180" : undefined}>
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="block h-9 w-full"
      >
        <path
          d="M0,34 C150,10 300,58 450,34 C600,10 750,58 900,34 C1050,10 1150,44 1200,34 L1200,60 L0,60 Z"
          className={fillClassName}
        />
      </svg>
    </div>
  );
}
