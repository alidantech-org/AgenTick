import "server-only";

import { eq, sql } from "drizzle-orm";
import { database, type SkillibDatabase } from "@/lib/db/client";
import { outboxEvents } from "@/lib/db/schema";

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

export async function publishEvent(
  event: SkillibEvent,
  transaction?: Transaction,
): Promise<void> {
  const executor = transaction ?? database();
  await executor.insert(outboxEvents).values({
    eventType: event.type,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    payload: event.payload,
  });
}

export interface ClaimedEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export async function claimEvents(limit = 10): Promise<ClaimedEvent[]> {
  return database().transaction(async (tx) => {
    const rows = await tx.execute<{
      id: string;
      event_type: string;
      payload: Record<string, unknown>;
      attempts: number;
    }>(sql`
      SELECT id, event_type, payload, attempts
      FROM outbox_events
      WHERE status IN ('pending', 'failed')
        AND available_at <= now()
        AND attempts < 10
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    `);

    const claimed = rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      payload: row.payload,
      attempts: row.attempts,
    }));

    if (claimed.length > 0) {
      await tx
        .update(outboxEvents)
        .set({ status: "processing", lockedAt: new Date() })
        .where(
          sql`${outboxEvents.id} IN (${sql.join(
            claimed.map((event) => sql`${event.id}::uuid`),
            sql`, `,
          )})`,
        );
    }

    return claimed;
  });
}

export async function completeEvent(id: string): Promise<void> {
  await database()
    .update(outboxEvents)
    .set({
      status: "sent",
      processedAt: new Date(),
      lockedAt: null,
      lastError: null,
    })
    .where(eq(outboxEvents.id, id));
}

export async function failEvent(
  id: string,
  attempts: number,
  error: unknown,
): Promise<void> {
  const nextAttempt = attempts + 1;
  const delaySeconds = Math.min(15 * 2 ** Math.min(nextAttempt, 8), 3600);
  await database()
    .update(outboxEvents)
    .set({
      status: "failed",
      attempts: nextAttempt,
      lockedAt: null,
      availableAt: new Date(Date.now() + delaySeconds * 1000),
      lastError:
        error instanceof Error ? error.message.slice(0, 2000) : "Unknown error",
    })
    .where(eq(outboxEvents.id, id));
}
