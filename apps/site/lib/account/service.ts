import "server-only";
import { randomUUID } from "node:crypto";
import {
  execute,
  executeBatch,
  numberValue,
  stringValue,
} from "@/lib/db/client";
import { hashApiToken, hashInviteCode, randomToken } from "@/lib/auth/crypto";
import { sendOrganizationInvite } from "@/lib/auth/mail";
import { normalizeEmail, normalizeSlug } from "@/lib/format";

export async function getAccountOverview(accountId: string) {
  const result = await execute(
    `SELECT
       (SELECT COUNT(*) FROM skills WHERE owner_account_id = ?) AS skill_count,
       (SELECT COALESCE(SUM(downloads_count), 0) FROM skills WHERE owner_account_id = ?) AS download_count,
       (SELECT COUNT(*) FROM organization_members WHERE account_id = ?) AS organization_count,
       (SELECT COUNT(*) FROM api_tokens WHERE account_id = ? AND revoked_at IS NULL) AS token_count`,
    [accountId, accountId, accountId, accountId],
  );
  const row = result.rows[0];
  return {
    skillCount: numberValue(row?.skill_count),
    downloadCount: numberValue(row?.download_count),
    organizationCount: numberValue(row?.organization_count),
    tokenCount: numberValue(row?.token_count),
  };
}

export async function listApiTokens(accountId: string) {
  const result = await execute(
    `SELECT id, token_prefix, name, scopes_json, last_used_at, expires_at, created_at
       FROM api_tokens
      WHERE account_id = ? AND revoked_at IS NULL
      ORDER BY created_at DESC`,
    [accountId],
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    prefix: String(row.token_prefix),
    name: String(row.name),
    scopes: JSON.parse(String(row.scopes_json)) as string[],
    lastUsedAt: stringValue(row.last_used_at),
    expiresAt: stringValue(row.expires_at),
    createdAt: String(row.created_at),
  }));
}

export async function createApiToken(accountId: string, rawName: string) {
  const name = rawName.trim().slice(0, 60) || "CLI token";
  const token = `agt_live_${randomToken(32)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const scopes = ["skills:read", "skills:write"];
  await execute(
    `INSERT INTO api_tokens (
       id, account_id, token_prefix, token_hash, name, scopes_json,
       expires_at, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      accountId,
      token.slice(0, 16),
      hashApiToken(token),
      name,
      JSON.stringify(scopes),
      expiresAt.toISOString(),
      now.toISOString(),
    ],
  );
  return { token, name, scopes, expiresAt: expiresAt.toISOString() };
}

export async function revokeApiToken(
  accountId: string,
  tokenId: string,
): Promise<boolean> {
  const result = await execute(
    `UPDATE api_tokens SET revoked_at = ? WHERE id = ? AND account_id = ? AND revoked_at IS NULL`,
    [new Date().toISOString(), tokenId, accountId],
  );
  return result.rowsAffected > 0;
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
  const now = new Date().toISOString();
  const organizationId = randomUUID();
  try {
    await executeBatch([
      {
        sql: `INSERT INTO organizations (id, slug, name, description, owner_account_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          organizationId,
          slug,
          name,
          input.description?.trim().slice(0, 280) || null,
          input.accountId,
          now,
          now,
        ],
      },
      {
        sql: `INSERT INTO registry_namespaces (slug, namespace_type, organization_id, created_at)
              VALUES (?, 'organization', ?, ?)`,
        args: [slug, organizationId, now],
      },
      {
        sql: `INSERT INTO organization_members (organization_id, account_id, role, created_at)
              VALUES (?, ?, 'owner', ?)`,
        args: [organizationId, input.accountId, now],
      },
    ]);
  } catch (error) {
    if (error instanceof Error && /UNIQUE|constraint/i.test(error.message)) {
      throw new Error("That registry namespace is already in use");
    }
    throw error;
  }
  return { id: organizationId, name, slug };
}

async function requireOrganizationAdmin(
  accountId: string,
  organizationId: string,
) {
  const result = await execute(
    `SELECT o.name, o.slug, m.role
       FROM organizations o
       JOIN organization_members m ON m.organization_id = o.id
      WHERE o.id = ? AND m.account_id = ?
      LIMIT 1`,
    [organizationId, accountId],
  );
  const row = result.rows[0];
  if (!row || !["owner", "admin"].includes(String(row.role))) {
    throw new Error("Only organization owners and admins can invite members");
  }
  return { name: String(row.name), slug: String(row.slug) };
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
  const code = `agt_join_${randomToken(18)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inviteId = randomUUID();
  await execute(
    `INSERT INTO organization_invites (
       id, organization_id, email, code_hash, role, created_by_account_id,
       expires_at, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      inviteId,
      input.organizationId,
      email,
      hashInviteCode(code),
      input.role,
      input.accountId,
      expiresAt.toISOString(),
      now.toISOString(),
    ],
  );
  try {
    await sendOrganizationInvite({
      email,
      organizationName: organization.name,
      code,
    });
  } catch (error) {
    await execute("DELETE FROM organization_invites WHERE id = ?", [inviteId]);
    throw error;
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
  const now = new Date().toISOString();
  const result = await execute(
    `SELECT i.id, i.organization_id, i.email, i.role, o.name, o.slug
       FROM organization_invites i
       JOIN organizations o ON o.id = i.organization_id
      WHERE i.code_hash = ? AND i.accepted_at IS NULL AND i.expires_at > ?
      LIMIT 1`,
    [hashInviteCode(code), now],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Invitation code is invalid or expired");
  if (
    normalizeEmail(String(row.email)) !== normalizeEmail(input.accountEmail)
  ) {
    throw new Error(
      "Sign in with the email address that received this invitation",
    );
  }
  await executeBatch([
    {
      sql: `INSERT OR IGNORE INTO organization_members (organization_id, account_id, role, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [
        String(row.organization_id),
        input.accountId,
        String(row.role),
        now,
      ],
    },
    {
      sql: "UPDATE organization_invites SET accepted_at = ? WHERE id = ? AND accepted_at IS NULL",
      args: [now, String(row.id)],
    },
  ]);
  return {
    name: String(row.name),
    slug: String(row.slug),
    role: String(row.role),
  };
}
