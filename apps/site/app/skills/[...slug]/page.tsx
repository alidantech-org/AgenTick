import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillReadme } from "@/components/skill-readme";
import { optionalAccount } from "@/lib/auth/dal";
import { formatDate, formatNumber } from "@/lib/format";
import { getSkillDetail, recordSkillMetric } from "@/lib/registry/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkillDetail(slug.join("/"));
  return skill
    ? {
        title: `${skill.namespace}/${skill.name}`,
        description: skill.description,
      }
    : { title: "Skill not found" };
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const account = await optionalAccount();
  const skill = await getSkillDetail(slug.join("/"), account);
  if (!skill) notFound();
  await recordSkillMetric({
    skillId: skill.id,
    principal: account,
    eventType: "view",
    requestHeaders: await headers(),
  });
  const latest =
    skill.versions.find((version) => version.version === skill.latestVersion) ??
    skill.versions[0];

  return (
    <main className="page-shell standard-page skill-detail-page">
      <div className="skill-breadcrumb">
        <Link href="/skills">Registry</Link>
        <span>/</span>
        <Link href={`/skills?q=${skill.namespace}`}>{skill.namespace}</Link>
        <span>/</span>
        <b>{skill.name}</b>
      </div>
      <section className="skill-package-header">
        <div>
          <div className="package-meta-line">
            <span
              className={`visibility-badge ${skill.visibility === "private" ? "visibility-private" : ""}`}
            >
              {skill.visibility}
            </span>
            {skill.license && <span>{skill.license}</span>}
          </div>
          <h1>
            <span>{skill.namespace}/</span>
            {skill.name}
          </h1>
          <p>{skill.description}</p>
          <div className="package-stats">
            <span>
              <b>{formatNumber(skill.downloads)}</b> downloads
            </span>
            <span>
              <b>{formatNumber(skill.views)}</b> views
            </span>
            <span>
              <b>{skill.versions.length}</b> versions
            </span>
          </div>
        </div>
        <div className="install-panel">
          <span>Install with Skillib</span>
          <code>
            skillib skill add {skill.namespace}/{skill.name} --version{" "}
            {skill.latestVersion ?? "latest"}
          </code>
          {latest && (
            <a
              className="button button-wide"
              href={`/api/v1/skills/${skill.namespace}/${skill.name}/download?version=${latest.version}`}
            >
              Download v{latest.version}
            </a>
          )}
        </div>
      </section>
      <div className="package-layout">
        <section className="package-readme">
          <div className="readme-heading">
            <h2>About this skill</h2>
            <span>SKILL.md</span>
          </div>
          {skill.readme ? (
            <SkillReadme source={skill.readme} />
          ) : (
            <p>{skill.description}</p>
          )}
          <div className="readme-security-note">
            <h3>Integrity and execution</h3>
            <p>
              Skillib verifies the locked SHA-512 digest, installs the package
              into a generated read-only library, and never executes downloaded
              scripts automatically.
            </p>
          </div>
          {skill.keywords.length > 0 && (
            <div className="keyword-row large-keywords">
              {skill.keywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
          )}
        </section>
        <aside className="package-sidebar">
          <h3>Latest version</h3>
          <strong className="version-number">
            {skill.latestVersion ?? "—"}
          </strong>
          <dl>
            <dt>Namespace</dt>
            <dd>{skill.namespace}</dd>
            <dt>Visibility</dt>
            <dd>{skill.visibility}</dd>
            <dt>Updated</dt>
            <dd>{formatDate(skill.updatedAt)}</dd>
            <dt>License</dt>
            <dd>{skill.license ?? "Not specified"}</dd>
          </dl>
          <h3>Version history</h3>
          <div className="version-list">
            {skill.versions.map((version) => (
              <div key={version.id}>
                <code>{version.version}</code>
                <span>{formatDate(version.publishedAt)}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
