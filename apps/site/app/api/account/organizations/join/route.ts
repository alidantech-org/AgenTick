import { NextResponse } from "next/server";
import { joinOrganization } from "@/lib/account/service";
import { getSessionAccount } from "@/lib/auth/session";

export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as { code?: unknown };
    const organization = await joinOrganization({
      accountId: account.id,
      accountEmail: account.email,
      code: typeof body.code === "string" ? body.code : "",
    });
    return NextResponse.json(organization);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to join organization",
      },
      { status: 400 },
    );
  }
}
