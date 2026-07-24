import "./organisations.css";
import Link from "next/link";
import { OrganisationManager } from "@/components/organisation-manager";
import { requireAccount } from "@/lib/auth/dal";
import { listOrganizations } from "@/lib/registry/service";

export default async function OrganisationsPage() {
  const account = await requireAccount();
  const organizations = await listOrganizations(account.id);
  return (
    <>
      <header className="section-page-heading">
        <div>
          <span className="kicker">Shared namespaces</span>
          <h2>Organisations</h2>
          <p>
            Publish private or public skills with teammates under a controlled
            registry namespace.
          </p>
        </div>
      </header>
      {organizations.length > 0 && (
        <div className="organisation-grid">
          {organizations.map((organization) => (
            <article key={organization.id}>
              <div>
                <span className="visibility-badge">{organization.role}</span>
                <h3>{organization.name}</h3>
                <code>@{organization.slug}</code>
                <p>{organization.description ?? "No description yet."}</p>
              </div>
              <footer>
                <span>{organization.memberCount} members</span>
                <span>{organization.skillCount} skills</span>
                <Link href={`/account/organisation/${organization.slug}/skills`}>
                  Open namespace →
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
      <OrganisationManager organizations={organizations} />
    </>
  );
}
