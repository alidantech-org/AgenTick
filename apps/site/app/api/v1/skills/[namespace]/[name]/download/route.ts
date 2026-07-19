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
    return Response.json(
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
  return new Response(JSON.stringify(resolved.bundle, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${namespace}-${name}-${resolved.bundle.version}.agentick.json"`,
      "x-agentick-integrity": resolved.integrity,
    },
  });
}
