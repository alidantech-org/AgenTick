import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { database, type SkillibDatabase } from "@/lib/db/client";
import { deliveries, outboxEvents } from "@/lib/db/schema";

export type SkillibEvent =
  | {
      type: "auth.login-otp.requested";
      aggregateType: "login-otp";
      aggregateId: string;
      payload: { email: string; otp: string; expiresAt: string };
    }
  | {
      type: "organization.invitation.created";
      aggregateType: "organization-invite";
      aggregateId: string;
      payload: {
        email: string;
        organizationName: string;
        code: string;
        expiresAt: string;
      };
    };

type Transaction = Parameters<Parameters<SkillibDatabase["transaction"]>[0]>[0];

const EMAIL_CONSUMER = "smtp-email";

export async function publishEvent(
  event: SkillibEvent,
  transaction?: Transaction,
): Promise<void> {
  const executor = transaction ?? database();
  const [created] = await executor
    .insert(outboxEvents)
    .values({
      eventType: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
    })
    .returning({ id: outboxEvents.id });

  if (!created) throw new Error("Unable to persist event");

  await executor.insert(deliveries).values({
    eventId: created.id,
    consumer: EMAIL_CONSUMER,
  });
}

export interface ClaimedEvent {
  id: string;
  deliveryId: string;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export async function claimEvents(limit = 10): Promise<ClaimedEvent[]> {
  const workerId = crypto.randomUUID();

  return database().transaction(async (tx) => {
    const rows = await tx.execute<{
      id: string;
      delivery_id: string;
      event_type: string;
      payload: Record<string, unknown>;
      attempts: number;
    }>(sql`
      SELECT
        o.id,
        d.id AS delivery_id,
        o.event_type,
        o.payload,
        d.attempts
      FROM events.deliveries d
      JOIN events.outbox o ON o.id = d.event_id
      WHERE d.consumer = ${EMAIL_CONSUMER}
        AND d.status IN ('pending', 'failed')
        AND d.available_at <= now()
        AND d.attempts < 10
      ORDER BY d.created_at
      FOR UPDATE OF d SKIP LOCKED
      LIMIT ${limit}
    `);

    if (rows.length === 0) return [];

    const deliveryIds = rows.map((row) => row.delivery_id);
    const eventIds = [...new Set(rows.map((row) => row.id))];

    await tx
      .update(deliveries)
      .set({ status: "processing" })
      .where(inArray(deliveries.id, deliveryIds));

    await tx
      .update(outboxEvents)
      .set({ status: "processing", lockedAt: new Date(), lockedBy: workerId })
      .where(inArray(outboxEvents.id, eventIds));

    return rows.map((row) => ({
      id: row.id,
      deliveryId: row.delivery_id,
      eventType: row.event_type,
      payload: row.payload,
      attempts: row.attempts,
    }));
  });
}

export async function completeEvent(
  eventId: string,
  deliveryId: string,
): Promise<void> {
  await database().transaction(async (tx) => {
    await tx
      .update(deliveries)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        lastError: null,
      })
      .where(eq(deliveries.id, deliveryId));

    const remaining = await tx
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(
        and(
          eq(deliveries.eventId, eventId),
          sql`${deliveries.status} <> 'delivered'`,
        ),
      )
      .limit(1);

    if (remaining.length === 0) {
      await tx
        .update(outboxEvents)
        .set({
          status: "sent",
          processedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        })
        .where(eq(outboxEvents.id, eventId));
    }
  });
}

export async function failEvent(
  eventId: string,
  deliveryId: string,
  attempts: number,
  error: unknown,
): Promise<void> {
  const nextAttempt = attempts + 1;
  const delaySeconds = Math.min(15 * 2 ** Math.min(nextAttempt, 8), 3600);
  const message =
    error instanceof Error ? error.message.slice(0, 2000) : "Unknown error";

  await database().transaction(async (tx) => {
    await tx
      .update(deliveries)
      .set({
        status: "failed",
        attempts: nextAttempt,
        availableAt: new Date(Date.now() + delaySeconds * 1000),
        lastError: message,
      })
      .where(eq(deliveries.id, deliveryId));

    await tx
      .update(outboxEvents)
      .set({
        status: "failed",
        attempts: sql`${outboxEvents.attempts} + 1`,
        lockedAt: null,
        lockedBy: null,
        availableAt: new Date(Date.now() + delaySeconds * 1000),
        lastError: message,
      })
      .where(eq(outboxEvents.id, eventId));
  });
}
