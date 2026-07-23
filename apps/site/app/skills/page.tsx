import "./registry.css";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegistrySearch } from "@/components/registry-search";
import { SkillCard } from "@/components/skill-card";
import {
  listPopularRegistryKeywords,
  registryDiscoveryStats,
} from "@/lib/registry/discovery";
import { searchPublicSkills } from "@/lib/registry/service";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Skill registry",
  description:
    "Search reusable AI coding skills by package name, namespace, description, and keywords.",
};

function queryString(input: {
  query?: string;
  keyword?: string;
  sort?: string;
}): string {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.keyword) params.set("keyword", input.keyword);
  if (input.sort) params.set("sort", input.sort);
  return params.toString();
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    keyword?: string;
    sort?: string;
    skill?: string;
  }>;
}) {
  const params = await searchParams;
  if (params.skill?.trim()) {
    redirect(`/skills/${params.skill.trim().replace(/^\/+/, "")}`);
  }

  const sort =
    params.sort === "newest" || params.sort === "updated"
      ? params.sort
      : "popular";
  const query = params.q?.trim() ?? "";
  const keyword = params.keyword?.trim().toLowerCase() ?? "";
  const effectiveQuery = keyword || query;

  const [skills, keywords, stats] = await Promise.all([
    searchPublicSkills({ query: effectiveQuery, sort, limit: 60 }),
    listPopularRegistryKeywords(),
    registryDiscoveryStats(),
  ]);

  return (
    <main className="page-shell standard-page registry-page">
      <header className="registry-hero">
        <div>
          <span className="section-label">Skillib public registry</span>
          <h1>Find expertise your AI can actually reuse.</h1>
          <p>
            Search package names, namespaces, descriptions, README content, and
            publisher keywords. Inspect immutable releases before adding them to
            a project.
          </p>
          <div className="registry-search-shell">
            <RegistrySearch initialQuery={query} />
          </div>
        </div>
        <div className="registry-stat-panel" aria-label="Registry statistics">
          <div>
            <strong>{formatNumber(stats.packages)}</strong>
            <span>Public packages</span>
          </div>
          <div>
            <strong>{formatNumber(stats.downloads)}</strong>
            <span>Downloads</span>
          </div>
          <div>
            <strong>{formatNumber(stats.publishers)}</strong>
            <span>Publishers</span>
          </div>
        </div>
      </header>

      <div className="registry-discovery-layout">
        <aside className="registry-filters" aria-label="Registry filters">
          <section className="registry-filter-group">
            <h2>Popular keywords</h2>
            <div className="registry-filter-links">
              {keywords.map((facet) => (
                <Link
                  className={keyword === facet.keyword ? "active" : ""}
                  href={`/skills?${queryString({ keyword: facet.keyword, sort })}`}
                  key={facet.keyword}
                >
                  {facet.keyword}
                  <small>{facet.count}</small>
                </Link>
              ))}
            </div>
          </section>

          {(query || keyword) && (
            <Link className="button button-secondary button-small" href="/skills">
              Clear filters
            </Link>
          )}

          <p className="registry-roadmap-note">
            Category, AI-model, agent-client, framework, runtime, language, and
            license facets will appear here as their catalog relations are
            connected in issue #10.
          </p>
        </aside>

        <section className="registry-results-shell">
          <div className="registry-toolbar">
            <div>
              <strong>{skills.length}</strong>{" "}
              {effectiveQuery
                ? `results for “${effectiveQuery}”`
                : "public packages"}
            </div>
            <nav aria-label="Sort packages">
              {(["popular", "newest", "updated"] as const).map((value) => (
                <Link
                  className={sort === value ? "active" : ""}
                  href={`/skills?${queryString({ query, keyword, sort: value })}`}
                  key={value}
                >
                  {value[0]?.toUpperCase()}
                  {value.slice(1)}
                </Link>
              ))}
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
              <h2>No packages matched those filters.</h2>
              <p>
                Try another keyword, remove the active filter, or publish the
                reusable workflow you expected to find.
              </p>
              <div>
                <Link className="button" href="/skills">
                  Clear filters
                </Link>
                <Link className="button button-secondary" href="/account/skills">
                  Publish a package
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
