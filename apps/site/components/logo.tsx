import Link from "next/link";

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="logo-mark"
    >
      <rect x="5" y="5" width="54" height="54" rx="16" fill="currentColor" />
      <path
        d="M16 33.5 27.2 44.8 49 20"
        fill="none"
        stroke="var(--background)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="wordmark" aria-label="Skillib home">
      <LogoMark size={compact ? 28 : 34} />
      <span>Skillib</span>
    </Link>
  );
}
