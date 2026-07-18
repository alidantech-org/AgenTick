import Link from "next/link";
import type { SkillSummary } from "@/lib/registry/service";
import { formatDate, formatNumber } from "@/lib/format";

export function SkillCard({
  skill,
  privateContext = false,
}: {
  skill: SkillSummary;
  privateContext?: boolean;
}) {
  return (
    <article className="skill-card">
      <div className="skill-card-topline">
        <span
          className={`visibility-badge ${skill.visibility === "private" ? "visibility-private" : ""}`}
        >
          {skill.visibility}
        </span>
        {skill.latestVersion && <code>v{skill.latestVersion}</code>}
      </div>
      <h3>
        <Link href={`/skills/${skill.namespace}/${skill.name}`}>
          <span>{skill.namespace}/</span>
          {skill.name}
        </Link>
      </h3>
      <p>{skill.description}</p>
      <div className="keyword-row">
        {skill.keywords.slice(0, 3).map((keyword) => (
          <span key={keyword}>{keyword}</span>
        ))}
      </div>
      <footer>
        <span title="Downloads">↓ {formatNumber(skill.downloads)}</span>
        <span title="Views">◉ {formatNumber(skill.views)}</span>
        <span>{formatDate(skill.updatedAt)}</span>
        {privateContext && <span className="owner-context">managed</span>}
      </footer>
    </article>
  );
}
