import { NextResponse } from "next/server";
import { searchPublicSkills } from "@/lib/registry/service";

export async function GET(request: Request) {
  const skills = await searchPublicSkills({ limit: 100 });
  const revision = skills.reduce(
    (latest, skill) => Math.max(latest, Date.parse(skill.updatedAt) || 0),
    0,
  );
  const requested = Number(new URL(request.url).searchParams.get("revision"));
  if (Number.isFinite(requested) && requested === revision)
    return new NextResponse(null, { status: 304 });
  return NextResponse.json({
    revision,
    packages: skills.map((skill) => ({
      id: `@${skill.namespace}/${skill.name}`,
      description: skill.description,
      latest: skill.latestVersion ?? "unreleased",
      tags: skill.keywords,
    })),
  });
}
