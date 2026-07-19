import { NextResponse } from "next/server";
import { createOrganization } from "@/lib/account/service";
import { getSessionAccount } from "@/lib/auth/session";

export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
    };
    const organization = await createOrganization({
      accountId: account.id,
      name: typeof body.name === "string" ? body.name : "",
      slug: typeof body.slug === "string" ? body.slug : "",
      ...(typeof body.description === "string"
        ? { description: body.description }
        : {}),
    });
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create organization",
      },
      { status: 400 },
    );
  }
}
