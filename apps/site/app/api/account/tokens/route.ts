import { NextResponse } from "next/server";
import { createApiToken, listApiTokens } from "@/lib/account/service";
import { getSessionAccount } from "@/lib/auth/session";

export async function GET() {
  const account = await getSessionAccount();
  if (!account)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ tokens: await listApiTokens(account.id) });
}

export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as { name?: unknown };
    return NextResponse.json(
      await createApiToken(
        account.id,
        typeof body.name === "string" ? body.name : "",
      ),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create token",
      },
      { status: 400 },
    );
  }
}
