import { NextResponse } from "next/server";
import { getRequestPrincipal } from "@/lib/auth/dal";
import { recordSkillMetric, resolveSkill } from "@/lib/registry/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ namespace: string; name: string }> },
) {
  const { namespace, name } = await context.params;
  const url = new URL(request.url);
  const principal = await getRequestPrincipal(request.headers);
  const resolved = await resolveSkill({
    namespace,
    name,
    requestedVersion: url.searchParams.get("version") ?? "latest",
    principal,
  });
  if (!resolved)
    return NextResponse.json(
      { error: "Skill or version not found" },
      { status: 404 },
    );
  await recordSkillMetric({
    skillId: resolved.skill.id,
    versionId: resolved.versionId,
    principal,
    eventType: "download",
    requestHeaders: request.headers,
  });
  const version = resolved.bundle.version;
  return NextResponse.json({
    id: resolved.bundle.id,
    version,
    integrity: resolved.integrity,
    resolved: `/api/v1/skills/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/download?version=${encodeURIComponent(version)}`,
    bundle: resolved.bundle,
  });
}
