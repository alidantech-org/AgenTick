import { NextResponse } from "next/server";
import { getBearerPrincipal } from "@/lib/auth/dal";
import { parseLanguagePublishRequest } from "@/lib/registry/language-contract";
import { publishLanguageRelease } from "@/lib/registry/language-registry";

export async function POST(request: Request) {
  const principal = await getBearerPrincipal(request.headers);
  if (!principal)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = parseLanguagePublishRequest(await request.json());
    const published = await publishLanguageRelease(principal, input);
    return NextResponse.json(published, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish skill";
    const status = /already published|immutable/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
