import { NextResponse } from "next/server";
import { getRequestPrincipal } from "@/lib/auth/dal";
import { publishSkill, type SkillVisibility } from "@/lib/registry/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ namespace: string; name: string }> },
) {
  const principal = await getRequestPrincipal(request.headers);
  if (!principal)
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  try {
    const { namespace, name } = await context.params;
    const body = (await request.json()) as {
      bundle?: unknown;
      integrity?: unknown;
      visibility?: unknown;
    };
    const bundleId =
      body.bundle && typeof body.bundle === "object" && "id" in body.bundle
        ? String((body.bundle as { id: unknown }).id)
        : "";
    if (bundleId !== `${namespace}/${name}`) {
      return NextResponse.json(
        { error: "Route and bundle skill ids differ" },
        { status: 400 },
      );
    }
    const visibility: SkillVisibility | undefined =
      body.visibility === "private"
        ? "private"
        : body.visibility === "public"
          ? "public"
          : undefined;
    const published = await publishSkill({
      principal,
      bundle: body.bundle,
      ...(typeof body.integrity === "string"
        ? { integrity: body.integrity }
        : {}),
      ...(visibility ? { visibility } : {}),
    });
    return NextResponse.json(published, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to publish skill";
    const status = /already published|immutable/i.test(message)
      ? 409
      : /cannot publish|scope/i.test(message)
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
