import { NextResponse } from "next/server";
import { getBearerPrincipal } from "@/lib/auth/dal";

export async function GET(request: Request) {
  const principal = await getBearerPrincipal(request.headers);
  if (!principal)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    account: {
      id: principal.id,
      email: principal.email,
      handle: principal.handle,
      displayName: principal.displayName,
    },
    scopes: principal.scopes,
  });
}
