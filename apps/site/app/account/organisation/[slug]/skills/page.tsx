import { notFound } from "next/navigation";
import { SkillCard } from "@/components/skill-card";
import { requireAccount } from "@/lib/auth/dal";
import { listOrganizationSkills } from "@/lib/registry/service";

export default async function OrganisationSkillsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const account = await requireAccount();
  const { slug } = await params;
  const result = await listOrganizationSkills(account.id, slug);
  if (!result) notFound();
  return (
    <>
      <header className="section-page-heading">
        <div>
          <span className="kicker">Organisation namespace</span>
          <h2>{result.organization.name}</h2>
          <p>
            @{result.organization.slug} · Your role: {result.organization.role}
          </p>
        </div>
      </header>
      {result.skills.length > 0 ? (
        <div className="skill-grid account-skill-grid">
          {result.skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} privateContext />
          ))}
        </div>
      ) : (
        <div className="large-empty-state">
          <h2>No skills in this namespace yet.</h2>
          <p>
            Open My skills to publish the first public or private package under
            @{result.organization.slug}.
          </p>
        </div>
      )}
    </>
  );
}
