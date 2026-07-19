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
      <path
        d="M14 33.5 26.4 46 51 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50.5 13.5c-9.6-8.1-26.4-7.5-36.1 2.1C4.8 25.2 4.8 40.8 14.4 50.4c9.6 9.6 25.2 9.6 34.8 0 6-6 8.2-14.4 5.8-22.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="4 8"
      />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="wordmark" aria-label="AgenTick home">
      <LogoMark size={compact ? 32 : 38} />
      <span>AgenTick</span>
    </Link>
  );
}
