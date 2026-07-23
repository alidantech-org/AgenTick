import { index, jsonb, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { accounts } from "./users";

export const auditSchema = pgSchema("audit");

export const entries = auditSchema.table(
  "entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actorType: text("actor_type").notNull(),
    actorId: uuid("actor_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    organizationId: uuid("organization_id"),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    before: jsonb("before").$type<Record<string, unknown> | null>(),
    after: jsonb("after").$type<Record<string, unknown> | null>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    index("entries_target_idx").on(
      table.targetType,
      table.targetId,
      table.occurredAt,
    ),
    index("entries_actor_idx").on(table.actorId, table.occurredAt),
    index("entries_action_idx").on(table.action, table.occurredAt),
  ],
);

export type AuditEntry = typeof entries.$inferSelect;
export type NewAuditEntry = typeof entries.$inferInsert;
