import {
  index,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt } from "./common";
import { accounts } from "./users";

export const platformSchema = pgSchema("platform");

export const roles = platformSchema.table(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt,
  },
  (table) => [uniqueIndex("roles_slug_unique").on(table.slug)],
);

export const permissions = platformSchema.table(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt,
  },
  (table) => [uniqueIndex("permissions_slug_unique").on(table.slug)],
);

export const rolePermissions = platformSchema.table(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const adminAssignments = platformSchema.table(
  "admin_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    grantedByAccountId: uuid("granted_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    reason: text("reason"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    index("admin_assignments_account_idx").on(table.accountId),
    uniqueIndex("admin_assignments_active_unique").on(
      table.accountId,
      table.roleId,
      table.revokedAt,
    ),
  ],
);

export const moderationCases = platformSchema.table(
  "moderation_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    status: text("status").notNull().default("open"),
    reason: text("reason").notNull(),
    openedByAccountId: uuid("opened_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    resolvedByAccountId: uuid("resolved_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    index("moderation_cases_status_idx").on(table.status, table.createdAt),
  ],
);

export type PlatformRole = typeof roles.$inferSelect;
export type NewPlatformRole = typeof roles.$inferInsert;
export type PlatformPermission = typeof permissions.$inferSelect;
export type NewPlatformPermission = typeof permissions.$inferInsert;
export type PlatformRolePermission = typeof rolePermissions.$inferSelect;
export type NewPlatformRolePermission = typeof rolePermissions.$inferInsert;
export type AdminAssignment = typeof adminAssignments.$inferSelect;
export type NewAdminAssignment = typeof adminAssignments.$inferInsert;
export type ModerationCase = typeof moderationCases.$inferSelect;
export type NewModerationCase = typeof moderationCases.$inferInsert;
