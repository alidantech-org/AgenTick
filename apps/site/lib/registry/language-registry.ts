import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { database, type SkillibDatabase } from "@/lib/db/client";
import {
  distributionTags,
  organizationMembers,
  registryNamespaces,
  skillEvents,
  skills,
  skillVersions,
} from "@/lib/db/schema";
import { hasScope, type TokenPrincipal } from "@/lib/auth/dal";
import type { SessionAccount } from "@/lib/auth/session";
import type { LanguagePublishRequest } from "./language-contract";

export type RegistryPrincipal = TokenPrincipal | SessionAccount;
type Transaction = Parameters<Parameters<SkillibDatabase["transaction"]>[0]>[0];

type ResolvedLanguageRelease = {
  package: string;
  release: number;
  version: string;
  integrity: string;
  archiveBase64: string;
};

function identityParts(identity: string): [string, string] {
  const parts = identity.replace(/^@/, "").split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("Package must use @namespace/name");
  return [parts[0].toLowerCase(), parts[1].toLowerCase()];
}

function versionParts(version: string) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) throw new Error("Release version must use semantic versioning");
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] ?? null };
}

async function namespacePermission(principal: RegistryPrincipal, namespace: string, tx: Transaction) {
  const rows = await tx
    .select({
      id: registryNamespaces.id,
      type: registryNamespaces.namespaceType,
      owner: registryNamespaces.ownerAccountId,
      organizationId: registryNamespaces.organizationId,
      role: organizationMembers.role,
    })
    .from(registryNamespaces)
    .leftJoin(
      organizationMembers,
      and(
        eq(organizationMembers.organizationId, registryNamespaces.organizationId),
        eq(organizationMembers.accountId, principal.id),
      ),
    )
    .where(eq(registryNamespaces.slug, namespace))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error(`Namespace ${namespace} does not exist`);
  if (row.type === "user" && row.owner !== principal.id) throw new Error(`Cannot publish in ${namespace}`);
  if (row.type === "organization" && !["owner", "admin", "publisher"].includes(row.role ?? "")) throw new Error(`Cannot publish in ${namespace}`);
  return row;
}

export async function publishLanguageRelease(principal: RegistryPrincipal, request: LanguagePublishRequest) {
  if (!hasScope(principal, "skills:write")) throw new Error("Token lacks skills:write scope");
  const [namespace, name] = identityParts(request.package);
  const version = request.ir.version;
  if (!version) throw new Error("Published skills require a version declaration");
  const semver = versionParts(version);

  return database().transaction(async (tx) => {
    const permission = await namespacePermission(principal, namespace, tx);
    const existing = await tx.select().from(skills).where(and(eq(skills.namespaceId, permission.id), eq(skills.normalizedName, name))).limit(1);
    const current = existing[0];
    let packageId: string;
    if (current) {
      packageId = current.id;
      await tx.execute(sql`SELECT id FROM registry.packages WHERE id = ${packageId}::uuid FOR UPDATE`);
      const duplicate = await tx.select({ id: skillVersions.id }).from(skillVersions).where(and(eq(skillVersions.skillId, packageId), eq(skillVersions.version, version))).limit(1);
      if (duplicate[0]) throw new Error(`${request.package}@${version} is already published and immutable`);
      await tx.update(skills).set({ description: request.ir.description, visibility: request.visibility, latestVersion: version, updatedAt: new Date() }).where(eq(skills.id, packageId));
    } else {
      const [created] = await tx.insert(skills).values({
        namespaceId: permission.id,
        namespaceSlug: namespace,
        namespaceType: permission.type,
        ownerAccountId: principal.id,
        organizationId: permission.organizationId,
        name,
        normalizedName: name,
        description: request.ir.description,
        visibility: request.visibility,
        keywords: [],
        latestVersion: version,
      }).returning({ id: skills.id });
      if (!created) throw new Error("Unable to create package");
      packageId = created.id;
    }

    const rows = await tx.select({ next: sql<number>`coalesce(max(${skillVersions.releaseNumber}), 0) + 1` }).from(skillVersions).where(eq(skillVersions.skillId, packageId));
    const releaseNumber = Number(rows[0]?.next ?? 1);
    const [release] = await tx.insert(skillVersions).values({
      skillId: packageId,
      releaseNumber,
      version,
      ...semver,
      integrity: request.integrity,
      sourceExtension: request.extension,
      languageVersion: request.language_version,
      compilerVersion: request.compiler_version,
      sourceText: request.source,
      compiledIr: request.ir,
      sourceHash: request.source_hash,
      irHash: request.ir_hash,
      dependencies: request.dependencies,
      permissions: request.permissions,
      diagnostics: [],
      bundle: { formatVersion: 2, archiveBase64: request.archive_base64 },
      manifest: { schema: request.ir.schema },
      metadata: { description: request.ir.description },
      provenance: { compiler: request.compiler_version },
      publishedByAccountId: principal.id,
    }).returning({ id: skillVersions.id });
    if (!release) throw new Error("Unable to create release");
    await tx.insert(distributionTags).values({ packageId, name: "latest", versionId: release.id, updatedByAccountId: principal.id }).onConflictDoUpdate({ target: [distributionTags.packageId, distributionTags.name], set: { versionId: release.id, updatedByAccountId: principal.id, updatedAt: new Date() } });
    await tx.insert(skillEvents).values({ packageId, versionId: release.id, accountId: principal.id, eventType: "publish", eventDay: new Date().toISOString().slice(0, 10) });
    return { package: request.package, release: releaseNumber, version, integrity: request.integrity };
  });
}

async function canRead(packageRow: typeof skills.$inferSelect, principal: RegistryPrincipal | null) {
  if (packageRow.visibility === "public") return true;
  if (!principal || !hasScope(principal, "skills:read")) return false;
  if (packageRow.ownerAccountId === principal.id) return true;
  if (!packageRow.organizationId) return false;
  const rows = await database().select({ id: organizationMembers.accountId }).from(organizationMembers).where(and(eq(organizationMembers.organizationId, packageRow.organizationId), eq(organizationMembers.accountId, principal.id))).limit(1);
  return Boolean(rows[0]);
}

export async function resolveLanguageRelease(packageName: string, selector: string, principal: RegistryPrincipal | null): Promise<ResolvedLanguageRelease | null> {
  const [namespace, name] = identityParts(packageName);
  const packageRow = (await database().select().from(skills).where(and(eq(skills.namespaceSlug, namespace), eq(skills.normalizedName, name), eq(skills.status, "active"))).limit(1))[0];
  if (!packageRow || !(await canRead(packageRow, principal))) return null;
  const releases = await database().select().from(skillVersions).where(and(eq(skillVersions.skillId, packageRow.id), isNull(skillVersions.yankedAt))).orderBy(desc(skillVersions.releaseNumber));
  let selected = selector === "latest" ? releases.find((item) => item.version === packageRow.latestVersion) ?? releases[0] : releases.find((item) => String(item.releaseNumber) === selector || item.version === selector);
  if (!selected) {
    const tag = (await database().select({ versionId: distributionTags.versionId }).from(distributionTags).where(and(eq(distributionTags.packageId, packageRow.id), eq(distributionTags.name, selector))).limit(1))[0];
    selected = tag ? releases.find((item) => item.id === tag.versionId) : undefined;
  }
  const archiveBase64 = selected && typeof selected.bundle.archiveBase64 === "string" ? selected.bundle.archiveBase64 : null;
  if (!selected || !archiveBase64) return null;
  return { package: `@${namespace}/${name}`, release: selected.releaseNumber, version: selected.version, integrity: selected.integrity, archiveBase64 };
}
