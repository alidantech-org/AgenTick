import {
  index,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./common";
import { accounts } from "./users";

export const orgsSchema = pgSchema("orgs");
export const organizationStatusEnum = orgsSchema.enum("organization_status", [
  "active",
  "suspended",
  "deleted",
]);
export const membershipRoleEnum = orgsSchema.enum("membership_role", [
  "owner",
  "admin",
  "publisher",
  "member",
]);
export const membershipStatusEnum = orgsSchema.enum("membership_status", [
  "invited",
  "active",
  "suspended",
]);
export const invitationStatusEnum = orgsSchema.enum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const organizations = orgsSchema.table(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    ownerAccountId: uuid("owner_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    status: organizationStatusEnum("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("organizations_slug_unique").on(table.slug),
    index("organizations_status_idx").on(table.status),
  ],
);

export const memberships = orgsSchema.table(
  "memberships",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    status: membershipStatusEnum("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.accountId] }),
    index("memberships_account_idx").on(table.accountId),
  ],
);

export const invitations = orgsSchema.table(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    role: membershipRoleEnum("role").notNull(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    createdByAccountId: uuid("created_by_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedByAccountId: uuid("accepted_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("invitations_code_hash_unique").on(table.codeHash),
    index("invitations_email_expiry_idx").on(table.email, table.expiresAt),
    index("invitations_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const teams = orgsSchema.table(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("teams_organization_slug_unique").on(
      table.organizationId,
      table.slug,
    ),
  ],
);

export const teamMembers = orgsSchema.table(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.teamId, table.accountId] })],
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMembership = typeof memberships.$inferSelect;
export type NewOrganizationMembership = typeof memberships.$inferInsert;
export type OrganizationInvitation = typeof invitations.$inferSelect;
export type NewOrganizationInvitation = typeof invitations.$inferInsert;
export type OrganizationTeam = typeof teams.$inferSelect;
export type NewOrganizationTeam = typeof teams.$inferInsert;
export type OrganizationTeamMember = typeof teamMembers.$inferSelect;
export type NewOrganizationTeamMember = typeof teamMembers.$inferInsert;
