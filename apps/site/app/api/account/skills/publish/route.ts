import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth/session";
import { publishSkill } from "@/lib/registry/service";

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const namespace =
      typeof body.namespace === "string"
        ? body.namespace.trim().toLowerCase()
        : "";
    const name =
      typeof body.name === "string" ? body.name.trim().toLowerCase() : "";
    const version = typeof body.version === "string" ? body.version.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const instructions =
      typeof body.instructions === "string" ? body.instructions.trim() : "";
    const license = typeof body.license === "string" ? body.license.trim() : "";
    const keywords =
      typeof body.keywords === "string"
        ? body.keywords
            .split(",")
            .map((keyword) => keyword.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 20)
        : [];
    const visibility = body.visibility === "private" ? "private" : "public";
    if (!namespace || !name || !version || !description || !instructions) {
      throw new Error(
        "Namespace, name, version, description, and instructions are required",
      );
    }
    const skillMarkdown = `---\nname: ${yamlString(name)}\ndescription: ${yamlString(description)}${license ? `\nlicense: ${yamlString(license)}` : ""}\n---\n\n${instructions}\n`;
    const bundle = {
      formatVersion: 1,
      id: `${namespace}/${name}`,
      version,
      metadata: {
        name,
        description,
        ...(license ? { license } : {}),
        ...(keywords.length > 0 ? { metadata: { keywords } } : {}),
      },
      files: [
        {
          path: "SKILL.md",
          encoding: "base64",
          content: Buffer.from(skillMarkdown, "utf8").toString("base64"),
        },
      ],
    };
    const published = await publishSkill({
      principal: account,
      bundle,
      visibility,
    });
    return NextResponse.json(published, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to publish skill";
    return NextResponse.json(
      { error: message },
      { status: /already published/i.test(message) ? 409 : 400 },
    );
  }
}
