import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegistrySearch } from "@/components/registry-search";
import { SkillCard } from "@/components/skill-card";
import { searchPublicSkills } from "@/lib/registry/service";

export const metadata: Metadata = { title: "Skill registry" };

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; skill?: string }>;
}) {
  const params = await searchParams;
  if (params.skill?.trim())
    redirect(`/skills/${params.skill.trim().replace(/^\/+/, "")}`);
  const sort =
    params.sort === "newest" || params.sort === "updated"
      ? params.sort
      : "popular";
  const query = params.q?.trim() ?? "";
  const skills = await searchPublicSkills({ query, sort, limit: 60 });

  return (
    <main className="page-shell standard-page registry-page">
      <header className="page-hero registry-hero">
        <span className="section-label">AgenTick skill registry</span>
        <h1>Reusable expertise for coding with AI.</h1>
        <p>
          Discover public skills, inspect immutable versions, and install
          exactly what your project needs.
        </p>
        <RegistrySearch initialQuery={query} />
      </header>
      <div className="registry-toolbar">
        <div>
          <strong>{skills.length}</strong>{" "}
          {query ? `results for “${query}”` : "public skills"}
        </div>
        <nav aria-label="Sort skills">
          <Link
            className={sort === "popular" ? "active" : ""}
            href={`/skills?${query ? `q=${encodeURIComponent(query)}&` : ""}sort=popular`}
          >
            Popular
          </Link>
          <Link
            className={sort === "newest" ? "active" : ""}
            href={`/skills?${query ? `q=${encodeURIComponent(query)}&` : ""}sort=newest`}
          >
            Newest
          </Link>
          <Link
            className={sort === "updated" ? "active" : ""}
            href={`/skills?${query ? `q=${encodeURIComponent(query)}&` : ""}sort=updated`}
          >
            Updated
          </Link>
        </nav>
      </div>
      {skills.length > 0 ? (
        <div className="skill-grid registry-grid">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <div className="large-empty-state">
          <h2>No skills matched that search.</h2>
          <p>
            Try a broader term, browse the most popular skills, or publish the
            workflow you hoped to find.
          </p>
          <div>
            <Link className="button" href="/skills">
              Clear search
            </Link>
            <Link className="button button-secondary" href="/account/skills">
              Publish a skill
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
