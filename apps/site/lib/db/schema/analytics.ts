import {
  bigint,
  date,
  index,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt } from "./common";
import { accounts } from "./users";
import { tokens } from "./auth";
import { packages, versions } from "./registry";

export const analyticsSchema = pgSchema("analytics");
export const analyticsEventTypeEnum = analyticsSchema.enum("event_type", [
  "view",
  "resolve",
  "download",
  "publish",
]);

export const events = analyticsSchema.table(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    versionId: uuid("version_id").references(() => versions.id, {
      onDelete: "set null",
    }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    tokenId: uuid("token_id").references(() => tokens.id, {
      onDelete: "set null",
    }),
    eventType: analyticsEventTypeEnum("event_type").notNull(),
    dedupeKey: text("dedupe_key"),
    eventDay: date("event_day", { mode: "string" }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    countryCode: text("country_code"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt,
  },
  (table) => [
    uniqueIndex("events_dedupe_unique").on(
      table.packageId,
      table.eventType,
      table.dedupeKey,
      table.eventDay,
    ),
    index("events_package_occurred_idx").on(table.packageId, table.occurredAt),
    index("events_type_occurred_idx").on(table.eventType, table.occurredAt),
  ],
);

export const packageDaily = analyticsSchema.table(
  "package_daily",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    views: bigint("views", { mode: "number" }).notNull().default(0),
    downloads: bigint("downloads", { mode: "number" }).notNull().default(0),
    uniqueDownloaders: bigint("unique_downloaders", { mode: "number" })
      .notNull()
      .default(0),
    resolves: bigint("resolves", { mode: "number" }).notNull().default(0),
    publishes: bigint("publishes", { mode: "number" }).notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.packageId, table.day] })],
);

export type AnalyticsEvent = typeof events.$inferSelect;
export type NewAnalyticsEvent = typeof events.$inferInsert;
export type PackageDailyMetric = typeof packageDaily.$inferSelect;
export type NewPackageDailyMetric = typeof packageDaily.$inferInsert;
