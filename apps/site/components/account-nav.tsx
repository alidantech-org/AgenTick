import Link from "next/link";
import {
  Building2,
  KeyRound,
  LayoutDashboard,
  Package2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const items = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/skills", label: "Packages", icon: Package2 },
  { href: "/account/organisations", label: "Organisations", icon: Building2 },
  { href: "/account/tokens", label: "Tokens", icon: KeyRound },
  { href: "/account/security", label: "Security", icon: ShieldCheck },
];

export function AccountNav() {
  return (
    <nav className="account-nav" aria-label="Account navigation">
      {items.map(({ href, label, icon: Icon }) => (
        <Link href={href} key={href}>
          <Icon size={16} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
