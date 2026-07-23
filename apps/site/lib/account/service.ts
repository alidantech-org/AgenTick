import "server-only";

import { and, count, desc, eq, isNull, sql, sum } from "drizzle-orm";
import { database } from "@/lib/db/client";
import {
  apiTokens,
  organizationInvites,
  organizationMembers,
  organizations,
  registryNamespaces,
  skills,
} from "@/lib/db/schema";
import { dispatchPendingEvents } from "@/lib/events/dispatcher";
import { publishEvent } from "@/lib/events/bus";
import { hashApiToken, hashInviteCode, randomToken } from "@/lib/auth/crypto";
import { normalizeEmail, normalizeSlug } from "@/lib/format";

export async function getAccountOverview(accountId: string) {
  const db = database();
  const [skillCount, downloadCount, organizationCount, tokenCount] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(skills)
        .where(eq(skills.ownerAccountId, accountId)),
      db
        .select({ value: sum(skills.downloadsCount) })
        .from(skills)
        .where(eq(skills.ownerAccountId, accountId)),
      db
        .select({ value: count() })
        .from(organizationMembers)
        .where(eq(organizationMembers.accountId, accountId)),
      db
        .select({ value: count() })
        .from(apiTokens)
        .where(and(eq(apiTokens.accountId, accountId), isNull(apiTokens.revokedAt))),
    ]);

  return {
    skillCount: skillCount[0]?.value ?? 0,
    downloadCount: Number(downloadCount[0]?.value ?? 0),
    organizationCount: organizationCount[0]?.value ?? 0,
    tokenCount: tokenCount[0]?.value ?? 0,
  };
}

export async function listApiTokens(accountId: string) {
  const rows = await database()
    .select({
      id: apiTokens.id,
      prefix: apiTokens.tokenPrefix,
      name: apiTokens.name,
      scopes: apiTokens.scopes,
      lastUsedAt: apiTokens.lastUsedAt,
      expiresAt: apiTokens.expiresAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(and(eq(apiTokens.accountId, accountId), isNull(apiTokens.revokedAt)))
    .orderBy(desc(apiTokens.createdAt));

  return rows.map((row) => ({
    ...row,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createApiToken(accountId: string, rawName: string) {
  const name = rawName.trim().slice(0, 60) || "CLI token";
  const token = `skl_live_${randomToken(32)}`;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const scopes = ["skills:read", "skills:write"];

  await database().insert(apiTokens).values({
    accountId,
    tokenPrefix: token.slice(0, 16),
    tokenHash: hashApiToken(token),
    name,
    scopes,
    expiresAt,
  });

  return { token, name, scopes, expiresAt: expiresAt.toISOString() };
}

export async function revokeApiToken(
  accountId: string,
  tokenId: string,
): Promise<boolean> {
  const rows = await database()
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiTokens.id, tokenId),
        eq(apiTokens.accountId, accountId),
        isNull(apiTokens.revokedAt),
      ),
    )
    .returning({ id: apiTokens.id });
  return rows.length > 0;
}

export async function createOrganization(input: {
  accountId: string;
  name: string;
  slug: string;
  description?: string;
}) {
  const name = input.name.trim().slice(0, 80);
  const slug = normalizeSlug(input.slug || name);
  if (name.length < 2) throw new Error("Organization name is too short");
  if (slug.length < 2) throw new Error("Choose a valid organization slug");

  try {
    return await database().transaction(async (tx) => {
      const [organization] = await tx
        .insert(organizations)
        .values({
          slug,
          name,
          description: input.description?.trim().slice(0, 280) || null,
          ownerAccountId: input.accountId,
        })
        .returning({ id: organizations.id });

      if (!organization) throw new Error("Unable to create organization");

      await tx.insert(registryNamespaces).values({
        slug,
        namespaceType: "organization",
        organizationId: organization.id,
      });
      await tx.insert(organizationMembers).values({
        organizationId: organization.id,
        accountId: input.accountId,
        role: "owner",
      });

      return { id: organization.id, name, slug };
    });
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      throw new Error("That registry namespace is already in use");
    }
    throw error;
  }
}

async function requireOrganizationAdmin(
  accountId: string,
  organizationId: string,
) {
  const rows = await database()
    .select({
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
        eq(organizations.id, organizationId),
        eq(organizationMembers.accountId, accountId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || !["owner", "admin"].includes(row.role)) {
    throw new Error("Only organization owners and admins can invite members");
  }
  return row;
}

export async function inviteOrganizationMember(input: {
  accountId: string;
  organizationId: string;
  email: string;
  role: "admin" | "publisher" | "member";
}) {
  const organization = await requireOrganizationAdmin(
    input.accountId,
    input.organizationId,
  );
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) throw new Error("Enter a valid email address");

  const code = `skl_join_${randomToken(18)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await database().transaction(async (tx) => {
    const [invite] = await tx
      .insert(organizationInvites)
      .values({
        organizationId: input.organizationId,
        email,
        codeHash: hashInviteCode(code),
        role: input.role,
        createdByAccountId: input.accountId,
        expiresAt,
      })
      .returning({ id: organizationInvites.id });

    if (!invite) throw new Error("Unable to create invitation");

    await publishEvent(
      {
        type: "organization.invitation.created",
        aggregateType: "organization-invite",
        aggregateId: invite.id,
        payload: {
          email,
          organizationName: organization.name,
          code,
          expiresAt: expiresAt.toISOString(),
        },
      },
      tx,
    );
  });

  const delivery = await dispatchPendingEvents(10);
  if (delivery.failed > 0) {
    throw new Error("Invitation created, but email delivery failed. Retry delivery.");
  }

  return {
    email,
    organization: organization.name,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function joinOrganization(input: {
  accountId: string;
  accountEmail: string;
  code: string;
}) {
  const code = input.code.trim();
  if (code.length < 12) throw new Error("Invitation code is invalid");

  return database().transaction(async (tx) => {
    const rows = await tx.execute<{
      id: string;
      organization_id: string;
      email: string;
      role: "admin" | "publisher" | "member";
      name: string;
      slug: string;
    }>(sql`
      SELECT i.id, i.organization_id, i.email, i.role, o.name, o.slug
      FROM organization_invites i
      JOIN organizations o ON o.id = i.organization_id
      WHERE i.code_hash = ${hashInviteCode(code)}
        AND i.accepted_at IS NULL
        AND i.expires_at > now()
      FOR UPDATE
      LIMIT 1
    `);

    const invite = rows[0];
    if (!invite) throw new Error("Invitation code is invalid or expired");
    if (normalizeEmail(invite.email) !== normalizeEmail(input.accountEmail)) {
      throw new Error(
        "Sign in with the email address that received this invitation",
      );
    }

    await tx
      .insert(organizationMembers)
      .values({
        organizationId: invite.organization_id,
        accountId: input.accountId,
        role: invite.role,
      })
      .onConflictDoNothing();

    const accepted = await tx
      .update(organizationInvites)
      .set({ acceptedAt: new Date() })
      .where(
        and(
          eq(organizationInvites.id, invite.id),
          isNull(organizationInvites.acceptedAt),
        ),
      )
      .returning({ id: organizationInvites.id });

    if (!accepted[0]) throw new Error("Invitation has already been accepted");

    return { name: invite.name, slug: invite.slug, role: invite.role };
  });
}
