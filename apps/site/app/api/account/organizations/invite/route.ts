import { NextResponse } from "next/server";
import { inviteOrganizationMember } from "@/lib/account/service";
import { getSessionAccount } from "@/lib/auth/session";

export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as {
      organizationId?: unknown;
      email?: unknown;
      role?: unknown;
    };
    const role =
      body.role === "admin" || body.role === "publisher" ? body.role : "member";
    const invite = await inviteOrganizationMember({
      accountId: account.id,
      organizationId:
        typeof body.organizationId === "string" ? body.organizationId : "",
      email: typeof body.email === "string" ? body.email : "",
      role,
    });
    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send invitation",
      },
      { status: 400 },
    );
  }
}
