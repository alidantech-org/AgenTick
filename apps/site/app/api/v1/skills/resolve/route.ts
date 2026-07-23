import { NextResponse } from "next/server";
import { getRequestPrincipal } from "@/lib/auth/dal";
import { resolveLanguageRelease } from "@/lib/registry/language-registry";

export async function POST(request: Request) {
  const principal = await getRequestPrincipal(request.headers);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const packageName = typeof body.package === "string" ? body.package : "";
    const selector = typeof body.selector === "string" ? body.selector : "latest";
    const resolved = await resolveLanguageRelease(packageName, selector, principal);
    if (!resolved)
      return NextResponse.json({ error: "Package release not found" }, { status: 404 });
    const baseUrl = new URL(request.url).origin;
    const downloadUrl = new URL("/api/v1/skills/archive", baseUrl);
    downloadUrl.searchParams.set("package", resolved.package);
    downloadUrl.searchParams.set("release", String(resolved.release));
    return NextResponse.json({
      package: resolved.package,
      release: resolved.release,
      version: resolved.version,
      integrity: resolved.integrity,
      download_url: downloadUrl.toString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve package";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
