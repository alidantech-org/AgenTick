import { NextResponse } from "next/server";
import { revokeApiToken } from "@/lib/account/service";
import { getSessionAccount } from "@/lib/auth/session";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const account = await getSessionAccount();
  if (!account)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const revoked = await revokeApiToken(account.id, id);
  return NextResponse.json({ revoked }, { status: revoked ? 200 : 404 });
}
