"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth/dal";
import {
  revokeAccountSession,
  revokeOtherAccountSessions,
} from "@/lib/account/security";

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const account = await requireAccount();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;
  await revokeAccountSession(account.id, sessionId);
  revalidatePath("/account/security");
}

export async function revokeOtherSessionsAction(): Promise<void> {
  const account = await requireAccount();
  await revokeOtherAccountSessions(account.id);
  revalidatePath("/account/security");
}
