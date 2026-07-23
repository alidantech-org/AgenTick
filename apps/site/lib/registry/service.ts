import "server-only";

import { headers } from "next/headers";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import {
  integrityForBundle,
  parseSkillMarkdown,
  validateSkillBundle,
  type SkillBundle,
} from "@alidantech/skillib-skill-lib";
import { database, type SkillibDatabase } from "@/lib/db/client";
import {
  organizationMembers,
  organizations,
  registryNamespaces,
  skillEvents,
  skills,
  skillVersions,
} from "@/lib/db/schema";
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
    releaseNumber: number;
    version: string;
    integrity: string;
    publishedAt: string;
    metadata: Record<string, unknown>;
  }>;
}

type SkillRow = typeof skills.$inferSelect;
type Transaction = Parameters<Parameters<SkillibDatabase["transaction"]>[0]>[0];

function summaryFromRow(row: SkillRow): SkillSummary {
  return {
    id: row.id,
    namespace: row.namespaceSlug,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    latestVersion: row.latestVersion,
    license: row.license,
    keywords: row.keywords,
    views: row.viewsCount,
    downloads: row.downloadsCount,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function searchPublicSkills(
  input: {
    query?: string;
    sort?: "popular" | "newest" | "updated";
    limit?: number;
  } = {},
): Promise<SkillSummary[]> {
  const query = input.query?.trim() ?? "";
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 100);
  const pattern = `%${query}%`;
  const filters = [
    eq(skills.visibility, "public"),
    eq(skills.status, "active"),
  ];

  if (query) {
    filters.push(
      or(
        ilike(skills.name, pattern),
        ilike(skills.namespaceSlug, pattern),
        ilike(skills.description, pattern),
        sql`${skills.keywords}::text ILIKE ${pattern}`,
      )!,
    );
  }

  const order =
    input.sort === "newest"
      ? [desc(skills.createdAt)]
      : input.sort === "updated"
        ? [desc(skills.updatedAt)]
        : [
            desc(skills.downloadsCount),
            desc(skills.viewsCount),
            desc(skills.updatedAt),
          ];

  const rows = await database()
    .select()
    .from(skills)
    .where(and(...filters))
    .orderBy(...order)
    .limit(limit);

  return rows.map(summaryFromRow);
}

export async function listAccountSkills(
  accountId: string,
): Promise<SkillSummary[]> {
  const rows = await database()
    .select()
    .from(skills)
    .where(eq(skills.ownerAccountId, accountId))
    .orderBy(desc(skills.updatedAt));
  return rows.map(summaryFromRow);
}

export async function listOrganizationSkills(
  accountId: string,
  organizationSlug: string,
): Promise<{
  organization: { id: string; name: string; slug: string; role: string };
  skills: SkillSummary[];
} | null> {
  const rows = await database()
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: organizationMembers.role,
    })
    .from(organizations)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, organizations.id),
    )
    .where(
      and(
        eq(organizations.slug, organizationSlug),
        eq(organizationMembers.accountId, accountId),
      ),
    )
    .limit(1);

  const organization = rows[0];
  if (!organization) return null;

  const skillRows = await database()
    .select()
    .from(skills)
    .where(eq(skills.organizationId, organization.id))
    .orderBy(desc(skills.updatedAt));

  return { organization, skills: skillRows.map(summaryFromRow) };
}

export async function listOrganizations(accountId: string) {
  const rows = await database().execute<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    role: string;
    member_count: number;
    skill_count: number;
  }>(sql`
    SELECT o.id, o.name, o.slug, o.description, m.role,
      (SELECT count(*)::int FROM orgs.memberships mm WHERE mm.organization_id = o.id) AS member_count,
      (SELECT count(*)::int FROM registry.packages p WHERE p.organization_id = o.id) AS skill_count
    FROM orgs.organizations o
    JOIN orgs.memberships m ON m.organization_id = o.id
    WHERE m.account_id = ${accountId}::uuid
    ORDER BY o.name
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    role: row.role,
    memberCount: row.member_count,
    skillCount: row.skill_count,
  }));
}

async function isOrganizationMember(
  accountId: string,
  organizationId: string,
): Promise<boolean> {
  const rows = await database()
    .select({ accountId: organizationMembers.accountId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.accountId, accountId),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}

async function canReadRow(
  row: SkillRow,
  principal: Principal | null,
): Promise<boolean> {
  if (row.visibility === "public") return true;
  if (!principal || !hasScope(principal, "skills:read")) return false;
  if (row.ownerAccountId === principal.id) return true;
  return row.organizationId
    ? isOrganizationMember(principal.id, row.organizationId)
    : false;
}

async function findSkill(identifier: string): Promise<SkillRow | undefined> {
  const segments = identifier.split("/").filter(Boolean);
  if (segments.length === 2) {
    return (
      await database()
        .select()
        .from(skills)
        .where(
          and(
            eq(skills.namespaceSlug, segments[0]!),
            eq(skills.normalizedName, segments[1]!.toLowerCase()),
          ),
        )
        .limit(1)
    )[0];
  }

  return (
    await database()
      .select()
      .from(skills)
      .where(
        and(
          eq(skills.normalizedName, (segments[0] ?? "").toLowerCase()),
          eq(skills.visibility, "public"),
          eq(skills.status, "active"),
        ),
      )
      .orderBy(
        desc(skills.downloadsCount),
        desc(skills.viewsCount),
        desc(skills.updatedAt),
      )
      .limit(1)
  )[0];
}

export async function getSkillDetail(
  identifier: string,
  principal: Principal | null = null,
): Promise<SkillDetail | null> {
  const skill = await findSkill(identifier);
  if (!skill || !(await canReadRow(skill, principal))) return null;

  const versions = await database()
    .select()
    .from(skillVersions)
    .where(
      and(eq(skillVersions.skillId, skill.id), isNull(skillVersions.yankedAt)),
    )
    .orderBy(desc(skillVersions.releaseNumber));

  const bundles = versions.map((version) => ({
    ...version,
    bundle: validateSkillBundle(version.bundle),
  }));
  const latestBundle =
    bundles.find((version) => version.version === skill.latestVersion)
      ?.bundle ?? bundles[0]?.bundle;
  const skillMarkdown = latestBundle?.files.find(
    (file) => file.path === "SKILL.md",
  );

  return {
    ...summaryFromRow(skill),
    ownerAccountId: skill.ownerAccountId,
    organizationId: skill.organizationId,
    namespaceType: skill.namespaceType,
    readme: skillMarkdown
      ? parseSkillMarkdown(
          Buffer.from(skillMarkdown.content, "base64").toString("utf8"),
        ).body
      : null,
    versions: versions.map((version) => ({
      id: version.id,
      releaseNumber: version.releaseNumber,
      version: version.version,
      integrity: version.integrity,
      publishedAt: version.publishedAt.toISOString(),
      metadata: version.metadata,
    })),
  };
}

interface NamespacePermission {
  namespaceId: string;
  type: "user" | "organization";
  organizationId: string | null;
}

async function namespacePermission(
  principal: Principal,
  namespace: string,
  tx: Transaction,
): Promise<NamespacePermission> {
  const rows = await tx
    .select({
      namespaceId: registryNamespaces.id,
      namespaceType: registryNamespaces.namespaceType,
      ownerAccountId: registryNamespaces.ownerAccountId,
      organizationId: registryNamespaces.organizationId,
      role: organizationMembers.role,
    })
    .from(registryNamespaces)
    .leftJoin(
      organizationMembers,
      and(
        eq(
          organizationMembers.organizationId,
          registryNamespaces.organizationId,
        ),
        eq(organizationMembers.accountId, principal.id),
      ),
    )
    .where(eq(registryNamespaces.slug, namespace))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error(`The ${namespace} namespace does not exist`);
  if (row.namespaceType === "user") {
    if (row.ownerAccountId !== principal.id) {
      throw new Error(`You cannot publish in the ${namespace} namespace`);
    }
    return {
      namespaceId: row.namespaceId,
      type: "user",
      organizationId: null,
    };
  }
  if (!row.role || !["owner", "admin", "publisher"].includes(row.role)) {
    throw new Error(`You cannot publish in the ${namespace} namespace`);
  }
  return {
    namespaceId: row.namespaceId,
    type: "organization",
    organizationId: row.organizationId,
  };
}

function bundleKeywords(bundle: SkillBundle): string[] {
  const value = bundle.metadata.metadata?.keywords;
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .slice(0, 20)
    : [];
}

function versionParts(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
} {
  const match = version
    .replace(/^v/, "")
    .match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) throw new Error(`Invalid semantic version: ${version}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

export async function publishSkill(input: {
  principal: Principal;
  bundle: unknown;
  integrity?: string;
  visibility?: SkillVisibility;
}): Promise<{
  id: string;
  releaseId: string;
  releaseNumber: number;
  version: string;
  integrity: string;
}> {
  if (!hasScope(input.principal, "skills:write")) {
    throw new Error("Token lacks skills:write scope");
  }

  const bundle = validateSkillBundle(input.bundle);
  const integrity = integrityForBundle(bundle);
  if (input.integrity && input.integrity !== integrity) {
    throw new Error("Bundle integrity does not match");
  }
  const [namespace, name] = bundle.id.split("/");
  if (!namespace || !name) throw new Error("Skill id must use namespace/name");
  const normalizedName = name.toLowerCase();
  const semver = versionParts(bundle.version);

  let result: { releaseId: string; releaseNumber: number } | undefined;

  try {
    result = await database().transaction(async (tx) => {
      const permission = await namespacePermission(
        input.principal,
        namespace,
        tx,
      );
      const existing = await tx
        .select()
        .from(skills)
        .where(
          and(
            eq(skills.namespaceId, permission.namespaceId),
            eq(skills.normalizedName, normalizedName),
          ),
        )
        .limit(1);

      const current = existing[0];
      const visibility = input.visibility ?? current?.visibility ?? "public";
      let skillId: string;

      if (!current) {
        const [created] = await tx
          .insert(skills)
          .values({
            namespaceId: permission.namespaceId,
            namespaceSlug: namespace,
            namespaceType: permission.type,
            ownerAccountId: input.principal.id,
            organizationId: permission.organizationId,
            name,
            normalizedName,
            description: bundle.metadata.description,
            visibility,
            license: bundle.metadata.license ?? null,
            keywords: bundleKeywords(bundle),
            latestVersion: bundle.version,
          })
          .returning({ id: skills.id });
        if (!created) throw new Error("Unable to create skill package");
        skillId = created.id;
      } else {
        skillId = current.id;
        await tx.execute(sql`
          SELECT id FROM registry.packages
          WHERE id = ${skillId}::uuid
          FOR UPDATE
        `);

        const duplicate = await tx
          .select({ id: skillVersions.id })
          .from(skillVersions)
          .where(
            and(
              eq(skillVersions.skillId, skillId),
              eq(skillVersions.version, bundle.version),
            ),
          )
          .limit(1);
        if (duplicate[0]) {
          throw new Error(
            `${bundle.id}@${bundle.version} is already published and immutable`,
          );
        }

        await tx
          .update(skills)
          .set({
            description: bundle.metadata.description,
            visibility,
            license: bundle.metadata.license ?? null,
            keywords: bundleKeywords(bundle),
            latestVersion:
              !current.latestVersion ||
              compareVersions(bundle.version, current.latestVersion) > 0
                ? bundle.version
                : current.latestVersion,
            updatedAt: new Date(),
          })
          .where(eq(skills.id, skillId));
      }

      const releaseRows = await tx
        .select({
          nextRelease: sql<number>`coalesce(max(${skillVersions.releaseNumber}), 0) + 1`,
        })
        .from(skillVersions)
        .where(eq(skillVersions.skillId, skillId));
      const releaseNumber = Number(releaseRows[0]?.nextRelease ?? 1);

      const [release] = await tx
        .insert(skillVersions)
        .values({
          skillId,
          releaseNumber,
          version: bundle.version,
          ...semver,
          integrity,
          bundle,
          manifest: bundle.metadata,
          metadata: bundle.metadata,
          publishedByAccountId: input.principal.id,
        })
        .returning({ id: skillVersions.id });
      if (!release) throw new Error("Unable to publish skill release");

      await tx.insert(skillEvents).values({
        packageId: skillId,
        versionId: release.id,
        accountId: input.principal.id,
        eventType: "publish",
        eventDay: new Date().toISOString().slice(0, 10),
      });

      return { releaseId: release.id, releaseNumber };
    });
  } catch (error) {
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) {
      throw new Error(
        `${bundle.id}@${bundle.version} is already published and immutable`,
      );
    }
    throw error;
  }

  if (!result) throw new Error("Publishing did not return a release");
  return {
    id: bundle.id,
    releaseId: result.releaseId,
    releaseNumber: result.releaseNumber,
    version: bundle.version,
    integrity,
  };
}

export async function resolveSkill(input: {
  namespace: string;
  name: string;
  requestedVersion: string;
  principal: Principal | null;
}): Promise<{
  skill: SkillSummary;
  versionId: string;
  releaseNumber: number;
  bundle: SkillBundle;
  integrity: string;
} | null> {
  const row = (
    await database()
      .select()
      .from(skills)
      .where(
        and(
          eq(skills.namespaceSlug, input.namespace),
          eq(skills.normalizedName, input.name.toLowerCase()),
        ),
      )
      .limit(1)
  )[0];
  if (!row || !(await canReadRow(row, input.principal))) return null;

  const releases = await database()
    .select()
    .from(skillVersions)
    .where(
      and(eq(skillVersions.skillId, row.id), isNull(skillVersions.yankedAt)),
    )
    .orderBy(desc(skillVersions.releaseNumber));
  const selected = releases
    .filter(
      (release) =>
        String(release.releaseNumber) === input.requestedVersion ||
        versionMatches(release.version, input.requestedVersion),
    )
    .sort((left, right) => compareVersions(right.version, left.version))[0];
  if (!selected) return null;

  return {
    skill: summaryFromRow(row),
    versionId: selected.id,
    releaseNumber: selected.releaseNumber,
    bundle: validateSkillBundle(selected.bundle),
    integrity: selected.integrity,
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

  await database().transaction(async (tx) => {
    const inserted = await tx
      .insert(skillEvents)
      .values({
        packageId: input.skillId,
        versionId: input.versionId ?? null,
        accountId: input.principal?.id ?? null,
        eventType: input.eventType,
        dedupeKey: dedupe,
        eventDay: day,
      })
      .onConflictDoNothing()
      .returning({ id: skillEvents.id });

    if (inserted.length === 0) return;

    await tx
      .update(skills)
      .set(
        input.eventType === "view"
          ? { viewsCount: sql`${skills.viewsCount} + 1` }
          : { downloadsCount: sql`${skills.downloadsCount} + 1` },
      )
      .where(eq(skills.id, input.skillId));
  });
}
