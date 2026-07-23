import {
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt } from "./common";

export const eventsSchema = pgSchema("events");
export const outboxStatusEnum = eventsSchema.enum("outbox_status", [
  "pending",
  "processing",
  "sent",
  "failed",
]);
export const deliveryStatusEnum = eventsSchema.enum("delivery_status", [
  "pending",
  "processing",
  "delivered",
  "failed",
]);

export const outbox = eventsSchema.table(
  "outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventType: text("event_type").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: outboxStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt,
  },
  (table) => [
    index("outbox_dispatch_idx").on(
      table.status,
      table.availableAt,
      table.createdAt,
    ),
  ],
);

export const deliveries = eventsSchema.table(
  "deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => outbox.id, { onDelete: "cascade" }),
    consumer: text("consumer").notNull(),
    status: deliveryStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastError: text("last_error"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("deliveries_event_consumer_unique").on(
      table.eventId,
      table.consumer,
    ),
    index("deliveries_dispatch_idx").on(table.status, table.availableAt),
  ],
);

export const deadLetters = eventsSchema.table("dead_letters", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => outbox.id, {
    onDelete: "set null",
  }),
  consumer: text("consumer").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  error: text("error").notNull(),
  failedAt: timestamp("failed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  replayedAt: timestamp("replayed_at", { withTimezone: true }),
  createdAt,
});

export type OutboxEvent = typeof outbox.$inferSelect;
export type NewOutboxEvent = typeof outbox.$inferInsert;
export type EventDelivery = typeof deliveries.$inferSelect;
export type NewEventDelivery = typeof deliveries.$inferInsert;
export type DeadLetter = typeof deadLetters.$inferSelect;
export type NewDeadLetter = typeof deadLetters.$inferInsert;
