import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import {
  integrityForBundle,
  parseSkillMarkdown,
  validateSkillBundle,
  type SkillBundle,
} from "@alidantech/agentick-skill-lib";
import { execute, numberValue, stringValue } from "@/lib/db/client";
import { fingerprint } from "@/lib/auth/crypto";
import { hasScope, type TokenPrincipal } from "@/lib/auth/dal";
import type { SessionAccount } from "@/lib/auth/session";
import { compareVersions, versionMatches } from "./version";

export type Principal = TokenPrincipal | SessionAccount;
export type SkillVisibility = "public" | "private";

export interface SkillSummary {
  id: string;
  namespace: string;
  name: string;
  description: string;
  visibility: SkillVisibility;
  latestVersion: string | null;
  license: string | null;
  keywords: string[];
  views: number;
  downloads: number;
  updatedAt: string;
}

export interface SkillDetail extends SkillSummary {
  ownerAccountId: string;
  organizationId: string | null;
  namespaceType: "user" | "organization";
  readme: string | null;
  versions: Array<{
    id: string;
    version: string;
    integrity: string;
    publishedAt: string;
    metadata: Record<string, unknown>;
  }>;
}

function parseJsonArray(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value)) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  try {
    const parsed = JSON.parse(String(value)) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function summaryFromRow(row: Record<string, unknown>): SkillSummary {
  return {
    id: String(row.id),
    namespace: String(row.namespace_slug),
    name: String(row.name),
    description: String(row.description),
    visibility: String(row.visibility) as SkillVisibility,
    latestVersion: stringValue(row.latest_version),
    license: stringValue(row.license),
    keywords: parseJsonArray(row.keywords_json),
    views: numberValue(row.views_count),
    downloads: numberValue(row.downloads_count),
    updatedAt: String(row.updated_at),
  };
}

export async function searchPublicSkills(
  input: {
    query?: string;
    sort?: "popular" | "newest" | "updated";
    limit?: number;
  } = {},
): Promise<SkillSummary[]> {
  const query = input.query?.trim().toLowerCase() ?? "";
  const pattern = `%${query}%`;
  const order =
    input.sort === "newest"
      ? "created_at DESC"
      : input.sort === "updated"
        ? "updated_at DESC"
        : "downloads_count DESC, views_count DESC, updated_at DESC";
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 100);
  const result = await execute(
    `SELECT * FROM skills
      WHERE visibility = 'public'
        AND (? = '' OR lower(name) LIKE ? OR lower(namespace_slug) LIKE ? OR lower(description) LIKE ? OR lower(keywords_json) LIKE ?)
      ORDER BY ${order}
      LIMIT ?`,
    [query, pattern, pattern, pattern, pattern, limit],
  );
  return result.rows.map((row) =>
    summaryFromRow(row as Record<string, unknown>),
  );
}

export async function listAccountSkills(
  accountId: string,
): Promise<SkillSummary[]> {
  const result = await execute(
    `SELECT * FROM skills WHERE owner_account_id = ? ORDER BY updated_at DESC`,
    [accountId],
  );
  return result.rows.map((row) =>
    summaryFromRow(row as Record<string, unknown>),
  );
}

export async function listOrganizationSkills(
  accountId: string,
  organizationSlug: string,
): Promise<{
  organization: { id: string; name: string; slug: string; role: string };
  skills: SkillSummary[];
} | null> {
  const organization = await execute(
    `SELECT o.id, o.name, o.slug, m.role
       FROM organizations o
       JOIN organization_members m ON m.organization_id = o.id
      WHERE o.slug = ? AND m.account_id = ?
      LIMIT 1`,
    [organizationSlug, accountId],
  );
  const row = organization.rows[0];
  if (!row) return null;
  const skills = await execute(
    `SELECT * FROM skills WHERE organization_id = ? ORDER BY updated_at DESC`,
    [String(row.id)],
  );
  return {
    organization: {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      role: String(row.role),
    },
    skills: skills.rows.map((skill) =>
      summaryFromRow(skill as Record<string, unknown>),
    ),
  };
}

export async function listOrganizations(accountId: string) {
  const result = await execute(
    `SELECT o.id, o.name, o.slug, o.description, m.role,
            (SELECT COUNT(*) FROM organization_members mm WHERE mm.organization_id = o.id) AS member_count,
            (SELECT COUNT(*) FROM skills s WHERE s.organization_id = o.id) AS skill_count
       FROM organizations o
       JOIN organization_members m ON m.organization_id = o.id
      WHERE m.account_id = ?
      ORDER BY o.name`,
    [accountId],
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: stringValue(row.description),
    role: String(row.role),
    memberCount: numberValue(row.member_count),
    skillCount: numberValue(row.skill_count),
  }));
}

async function isOrganizationMember(
  accountId: string,
  organizationId: string,
): Promise<boolean> {
  const result = await execute(
    "SELECT 1 FROM organization_members WHERE organization_id = ? AND account_id = ? LIMIT 1",
    [organizationId, accountId],
  );
  return Boolean(result.rows[0]);
}

async function canReadRow(
  row: Record<string, unknown>,
  principal: Principal | null,
): Promise<boolean> {
  if (String(row.visibility) === "public") return true;
  if (!principal) return false;
  if (!hasScope(principal, "skills:read")) return false;
  if (String(row.owner_account_id) === principal.id) return true;
  const organizationId = stringValue(row.organization_id);
  return organizationId
    ? isOrganizationMember(principal.id, organizationId)
    : false;
}

export async function getSkillDetail(
  identifier: string,
  principal: Principal | null = null,
): Promise<SkillDetail | null> {
  const segments = identifier.split("/").filter(Boolean);
  const result =
    segments.length === 2
      ? await execute(
          "SELECT * FROM skills WHERE namespace_slug = ? AND name = ? LIMIT 1",
          [segments[0]!, segments[1]!],
        )
      : await execute(
          `SELECT * FROM skills
            WHERE name = ? AND visibility = 'public'
            ORDER BY downloads_count DESC, updated_at DESC
            LIMIT 1`,
          [segments[0] ?? ""],
        );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row || !(await canReadRow(row, principal))) return null;
  const versions = await execute(
    `SELECT id, version, integrity, metadata_json, bundle_json, published_at
       FROM skill_versions
      WHERE skill_id = ? AND yanked_at IS NULL
      ORDER BY published_at DESC`,
    [String(row.id)],
  );
  const versionRows = versions.rows.map((version) => ({
    id: String(version.id),
    version: String(version.version),
    integrity: String(version.integrity),
    publishedAt: String(version.published_at),
    metadata: parseJsonObject(version.metadata_json),
    bundle: validateSkillBundle(JSON.parse(String(version.bundle_json))),
  }));
  const latestVersion = stringValue(row.latest_version);
  const latestBundle =
    versionRows.find((version) => version.version === latestVersion)?.bundle ??
    versionRows[0]?.bundle;
  const skillMarkdown = latestBundle?.files.find(
    (file) => file.path === "SKILL.md",
  );
  const readme = skillMarkdown
    ? parseSkillMarkdown(
        Buffer.from(skillMarkdown.content, "base64").toString("utf8"),
      ).body
    : null;
  return {
    ...summaryFromRow(row),
    ownerAccountId: String(row.owner_account_id),
    organizationId: stringValue(row.organization_id),
    namespaceType: String(row.namespace_type) as "user" | "organization",
    readme,
    versions: versionRows.map(({ bundle: _bundle, ...version }) => version),
  };
}

async function namespacePermission(
  principal: Principal,
  namespace: string,
): Promise<{ type: "user" | "organization"; organizationId: string | null }> {
  const result = await execute(
    `SELECT n.namespace_type, n.owner_account_id, n.organization_id, m.role
       FROM registry_namespaces n
       LEFT JOIN organization_members m
         ON m.organization_id = n.organization_id AND m.account_id = ?
      WHERE n.slug = ?
      LIMIT 1`,
    [principal.id, namespace],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`The ${namespace} namespace does not exist`);
  if (String(row.namespace_type) === "user") {
    if (String(row.owner_account_id) !== principal.id) {
      throw new Error(`You cannot publish in the ${namespace} namespace`);
    }
    return { type: "user", organizationId: null };
  }
  if (!["owner", "admin", "publisher"].includes(String(row.role))) {
    throw new Error(`You cannot publish in the ${namespace} namespace`);
  }
  return { type: "organization", organizationId: String(row.organization_id) };
}

function bundleKeywords(bundle: SkillBundle): string[] {
  const value = bundle.metadata.metadata?.keywords;
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .slice(0, 20)
    : [];
}

export async function publishSkill(input: {
  principal: Principal;
  bundle: unknown;
  integrity?: string;
  visibility?: SkillVisibility;
}): Promise<{ id: string; version: string; integrity: string }> {
  if (!hasScope(input.principal, "skills:write"))
    throw new Error("Token lacks skills:write scope");
  const bundle = validateSkillBundle(input.bundle);
  const integrity = integrityForBundle(bundle);
  if (input.integrity && input.integrity !== integrity)
    throw new Error("Bundle integrity does not match");
  const [namespace, name] = bundle.id.split("/");
  if (!namespace || !name) throw new Error("Skill id must use namespace/name");
  const permission = await namespacePermission(input.principal, namespace);
  const now = new Date().toISOString();

  const existing = await execute(
    "SELECT id, latest_version, visibility FROM skills WHERE namespace_slug = ? AND name = ? LIMIT 1",
    [namespace, name],
  );
  const skillId = existing.rows[0] ? String(existing.rows[0].id) : randomUUID();
  const visibility =
    input.visibility ??
    (existing.rows[0]
      ? (String(existing.rows[0].visibility) as SkillVisibility)
      : "public");

  if (existing.rows[0]) {
    const duplicate = await execute(
      "SELECT 1 FROM skill_versions WHERE skill_id = ? AND version = ? LIMIT 1",
      [skillId, bundle.version],
    );
    if (duplicate.rows[0]) {
      throw new Error(
        `${bundle.id}@${bundle.version} is already published and immutable`,
      );
    }
  }

  if (!existing.rows[0]) {
    await execute(
      `INSERT INTO skills (
        id, namespace_slug, namespace_type, owner_account_id, organization_id,
        name, description, visibility, license, keywords_json, latest_version,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        skillId,
        namespace,
        permission.type,
        input.principal.id,
        permission.organizationId,
        name,
        bundle.metadata.description,
        visibility,
        bundle.metadata.license ?? null,
        JSON.stringify(bundleKeywords(bundle)),
        bundle.version,
        now,
        now,
      ],
    );
  } else {
    const latest = stringValue(existing.rows[0].latest_version);
    await execute(
      `UPDATE skills
          SET description = ?, visibility = ?, license = ?, keywords_json = ?,
              latest_version = ?, updated_at = ?
        WHERE id = ?`,
      [
        bundle.metadata.description,
        visibility,
        bundle.metadata.license ?? null,
        JSON.stringify(bundleKeywords(bundle)),
        !latest || compareVersions(bundle.version, latest) > 0
          ? bundle.version
          : latest,
        now,
        skillId,
      ],
    );
  }

  const versionId = randomUUID();
  try {
    await execute(
      `INSERT INTO skill_versions (
        id, skill_id, version, integrity, bundle_json, metadata_json,
        published_by_account_id, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        versionId,
        skillId,
        bundle.version,
        integrity,
        JSON.stringify(bundle),
        JSON.stringify(bundle.metadata),
        input.principal.id,
        now,
      ],
    );
  } catch (error) {
    if (error instanceof Error && /UNIQUE|constraint/i.test(error.message)) {
      throw new Error(
        `${bundle.id}@${bundle.version} is already published and immutable`,
      );
    }
    throw error;
  }
  await execute(
    `INSERT INTO skill_events (id, skill_id, version_id, account_id, event_type, event_day, created_at)
     VALUES (?, ?, ?, ?, 'publish', ?, ?)`,
    [
      randomUUID(),
      skillId,
      versionId,
      input.principal.id,
      now.slice(0, 10),
      now,
    ],
  );
  return { id: bundle.id, version: bundle.version, integrity };
}

export async function resolveSkill(input: {
  namespace: string;
  name: string;
  requestedVersion: string;
  principal: Principal | null;
}): Promise<{
  skill: SkillSummary;
  versionId: string;
  bundle: SkillBundle;
  integrity: string;
} | null> {
  const result = await execute(
    "SELECT * FROM skills WHERE namespace_slug = ? AND name = ? LIMIT 1",
    [input.namespace, input.name],
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row || !(await canReadRow(row, input.principal))) return null;
  const versions = await execute(
    `SELECT id, version, integrity, bundle_json
       FROM skill_versions
      WHERE skill_id = ? AND yanked_at IS NULL
      ORDER BY published_at DESC`,
    [String(row.id)],
  );
  const selected = versions.rows
    .filter((version) =>
      versionMatches(String(version.version), input.requestedVersion),
    )
    .sort((left, right) =>
      compareVersions(String(right.version), String(left.version)),
    )[0];
  if (!selected) return null;
  return {
    skill: summaryFromRow(row),
    versionId: String(selected.id),
    bundle: validateSkillBundle(JSON.parse(String(selected.bundle_json))),
    integrity: String(selected.integrity),
  };
}

export async function recordSkillMetric(input: {
  skillId: string;
  versionId?: string;
  principal?: Principal | null;
  eventType: "view" | "download";
  requestHeaders?: Headers;
}): Promise<void> {
  const source = input.requestHeaders ?? (await headers());
  const ip = source.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const userAgent = source.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const dedupe = fingerprint([
    input.principal?.id ?? null,
    ip,
    userAgent,
    input.eventType,
    input.skillId,
    day,
  ]);
  const now = new Date().toISOString();
  const inserted = await execute(
    `INSERT OR IGNORE INTO skill_events (
      id, skill_id, version_id, account_id, event_type, dedupe_key, event_day, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      input.skillId,
      input.versionId ?? null,
      input.principal?.id ?? null,
      input.eventType,
      dedupe,
      day,
      now,
    ],
  );
  if (inserted.rowsAffected > 0) {
    const column =
      input.eventType === "view" ? "views_count" : "downloads_count";
    await execute(`UPDATE skills SET ${column} = ${column} + 1 WHERE id = ?`, [
      input.skillId,
    ]);
  }
}
