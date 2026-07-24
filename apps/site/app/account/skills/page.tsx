import "./publisher.css";
import { PublishSkillForm } from "@/components/publish-skill-form";
import { SkillCard } from "@/components/skill-card";
import { requireAccount } from "@/lib/auth/dal";
import { listOrganizations, listAccountSkills } from "@/lib/registry/service";

export default async function AccountSkillsPage() {
  const account = await requireAccount();
  const [skills, organizations] = await Promise.all([
    listAccountSkills(account.id),
    listOrganizations(account.id),
  ]);
  const namespaces = [
    account.handle,
    ...organizations
      .filter((organization) =>
        ["owner", "admin", "publisher"].includes(organization.role),
      )
      .map((organization) => organization.slug),
  ];
  return (
    <>
      <header className="section-page-heading">
        <div>
          <span className="kicker">Personal registry</span>
          <h2>My skills</h2>
          <p>
            Manage packages published by your account across personal and
            organisation namespaces.
          </p>
        </div>
      </header>
      <PublishSkillForm namespaces={namespaces} />
      {skills.length > 0 ? (
        <div className="skill-grid account-skill-grid">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} privateContext />
          ))}
        </div>
      ) : (
        <div className="large-empty-state">
          <h2>You have not published a skill yet.</h2>
          <p>
            Start with a focused one-file skill here, then use the CLI when you
            need references, scripts, or assets.
          </p>
        </div>
      )}
    </>
  );
}
