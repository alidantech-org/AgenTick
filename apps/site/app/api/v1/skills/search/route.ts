import { NextResponse } from "next/server";
import { searchPublicSkills } from "@/lib/registry/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const sortValue = url.searchParams.get("sort");
  const sort =
    sortValue === "newest" || sortValue === "updated" ? sortValue : "popular";
  const skills = await searchPublicSkills({ query, sort, limit: 24 });
  return NextResponse.json(
    skills.map((skill) => ({
      id: `@${skill.namespace}/${skill.name}`,
      description: skill.description,
      latest: skill.latestVersion ?? "unreleased",
      tags: skill.keywords,
    })),
  );
}
