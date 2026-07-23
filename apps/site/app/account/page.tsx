import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Download,
  KeyRound,
  Package2,
  ShieldCheck,
} from "lucide-react";
import { getAccountOverview } from "@/lib/account/service";
import { requireAccount } from "@/lib/auth/dal";
import { formatNumber } from "@/lib/format";

const quickLinks = [
  {
    href: "/account/skills",
    title: "Manage packages",
    description: "Publish releases, update metadata, and review package activity.",
    icon: Package2,
  },
  {
    href: "/account/organisations",
    title: "Organisation access",
    description: "Manage team namespaces, invitations, and package ownership.",
    icon: Building2,
  },
  {
    href: "/account/tokens",
    title: "Publishing tokens",
    description: "Create and revoke credentials for CLI pull and push operations.",
    icon: KeyRound,
  },
  {
    href: "/account/security",
    title: "Account security",
    description: "Review active sessions and revoke unrecognised devices.",
    icon: ShieldCheck,
  },
];

export default async function AccountPage() {
  const account = await requireAccount();
  const overview = await getAccountOverview(account.id);

  return (
    <div className="account-content-stack">
      <section className="account-page-heading account-overview-heading">
        <div>
          <span className="section-label">Workspace overview</span>
          <h2>Everything you publish, in one place</h2>
          <p>
            Monitor your registry footprint, manage access, and keep every Skillib
            publishing workflow accountable.
          </p>
        </div>
      </section>

      <section className="account-stat-grid">
        <article>
          <Package2 size={19} />
          <span>Packages</span>
          <strong>{overview.skillCount}</strong>
          <p>Personal registry packages</p>
        </article>
        <article>
          <Download size={19} />
          <span>Downloads</span>
          <strong>{formatNumber(overview.downloadCount)}</strong>
          <p>Across your published releases</p>
        </article>
        <article>
          <Building2 size={19} />
          <span>Organisations</span>
          <strong>{overview.organizationCount}</strong>
          <p>Team namespaces you can access</p>
        </article>
        <article>
          <KeyRound size={19} />
          <span>Active tokens</span>
          <strong>{overview.tokenCount}</strong>
          <p>CLI and automation credentials</p>
        </article>
      </section>

      <section className="account-quick-grid" aria-label="Account actions">
        {quickLinks.map(({ href, title, description, icon: Icon }) => (
          <Link href={href} key={href}>
            <span className="quick-link-icon">
              <Icon size={19} />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
            <ArrowRight size={17} />
          </Link>
        ))}
      </section>
    </div>
  );
}
