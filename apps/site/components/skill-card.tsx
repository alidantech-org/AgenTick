import Link from "next/link";
import { Download, Eye, Package2 } from "lucide-react";
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
      <div className="keyword-row" aria-label="Package keywords">
        {skill.keywords.slice(0, 4).map((keyword) => (
          <Link
            href={`/skills?keyword=${encodeURIComponent(keyword.toLowerCase())}`}
            key={keyword}
          >
            {keyword}
          </Link>
        ))}
      </div>
      <footer>
        <span title="Downloads">
          <Download size={14} /> {formatNumber(skill.downloads)}
        </span>
        <span title="Views">
          <Eye size={14} /> {formatNumber(skill.views)}
        </span>
        <span>{formatDate(skill.updatedAt)}</span>
        {privateContext && (
          <span className="owner-context">
            <Package2 size={13} /> managed
          </span>
        )}
      </footer>
    </article>
  );
}
