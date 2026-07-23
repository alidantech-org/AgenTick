import "server-only";

import { sendLoginOtp, sendOrganizationInvite } from "@/lib/auth/mail";
import { claimEvents, completeEvent, failEvent } from "./bus";

function stringField(payload: Record<string, unknown>, field: string): string {
  const value = payload[field];
  if (typeof value !== "string" || !value) {
    throw new Error(`Outbox payload is missing ${field}`);
  }
  return value;
}

async function dispatchEvent(
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (eventType) {
    case "auth.login-otp.requested":
      await sendLoginOtp(
        stringField(payload, "email"),
        stringField(payload, "otp"),
      );
      return;
    case "organization.invitation.created":
      await sendOrganizationInvite({
        email: stringField(payload, "email"),
        organizationName: stringField(payload, "organizationName"),
        code: stringField(payload, "code"),
      });
      return;
    default:
      throw new Error(`No event handler is registered for ${eventType}`);
  }
}

export async function dispatchPendingEvents(limit = 10): Promise<{
  processed: number;
  failed: number;
}> {
  const events = await claimEvents(limit);
  let processed = 0;
  let failed = 0;

  for (const event of events) {
    try {
      await dispatchEvent(event.eventType, event.payload);
      await completeEvent(event.id);
      processed += 1;
    } catch (error) {
      await failEvent(event.id, event.attempts, error);
      failed += 1;
    }
  }

  return { processed, failed };
}
