import { NextResponse } from "next/server";
import { getBearerPrincipal } from "@/lib/auth/dal";

export async function GET(request: Request) {
  const principal = await getBearerPrincipal(request.headers);
  if (!principal)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    handle: principal.handle,
    email: principal.email,
    scopes: principal.scopes,
  });
}
