import { NextResponse } from "next/server";
import { getRequestPrincipal } from "@/lib/auth/dal";
import { resolveLanguageRelease } from "@/lib/registry/language-registry";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const packageName = url.searchParams.get("package") ?? "";
  const release = url.searchParams.get("release") ?? "latest";
  const principal = await getRequestPrincipal(request.headers);
  const resolved = await resolveLanguageRelease(packageName, release, principal);
  if (!resolved)
    return NextResponse.json({ error: "Package release not found" }, { status: 404 });
  const bytes = Buffer.from(resolved.archiveBase64, "base64");
  return new NextResponse(bytes, {
    headers: {
      "content-type": "application/vnd.skillib.package+json",
      "content-length": String(bytes.byteLength),
      "cache-control": "private, max-age=0, must-revalidate",
      etag: `"${resolved.integrity}"`,
    },
  });
}
