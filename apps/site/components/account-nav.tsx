import Link from "next/link";

export function AccountNav() {
  return (
    <nav className="account-nav" aria-label="Account navigation">
      <Link href="/account">Overview</Link>
      <Link href="/account/skills">My skills</Link>
      <Link href="/account/organisations">Organisations</Link>
    </nav>
  );
}
