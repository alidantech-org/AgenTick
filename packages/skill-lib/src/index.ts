import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { posix, relative, resolve } from "node:path";
import { parse } from "yaml";
import { z } from "zod";

const skillId = z.string().regex(/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/);

const exactSemver = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
    "Expected an exact semantic version",
  );

const metadataSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(1).max(1024),
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  "allowed-tools": z.string().optional(),
});

export type SkillMetadata = z.infer<typeof metadataSchema>;

export const skillBundleSchema = z.object({
  formatVersion: z.literal(1),
  id: skillId,
  version: exactSemver,
  metadata: metadataSchema,
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(500),
        encoding: z.literal("base64"),
        content: z.string(),
      }),
    )
    .min(1)
    .max(500),
});

export type SkillBundle = z.infer<typeof skillBundleSchema>;

export interface SkillBundleLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
}

export const DEFAULT_BUNDLE_LIMITS: SkillBundleLimits = {
  maxFiles: 500,
  maxFileBytes: 2 * 1024 * 1024,
  maxTotalBytes: 10 * 1024 * 1024,
};

export function parseSkillMarkdown(source: string): {
  metadata: SkillMetadata;
  body: string;
} {
  if (!source.startsWith("---\n")) {
    throw new Error("SKILL.md must start with YAML frontmatter");
  }

  const end = source.indexOf("\n---\n", 4);
  if (end < 0) {
    throw new Error("SKILL.md frontmatter is not closed");
  }

  const metadata = metadataSchema.parse(parse(source.slice(4, end)));
  return { metadata, body: source.slice(end + 5).trimStart() };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function canonicalBundleBytes(bundle: SkillBundle): Uint8Array {
  const normalized = skillBundleSchema.parse({
    ...bundle,
    files: [...bundle.files].sort((left, right) =>
      left.path.localeCompare(right.path),
    ),
  });
  return Buffer.from(JSON.stringify(canonicalize(normalized)), "utf8");
}

export function integrityFor(content: Uint8Array): string {
  return `sha512-${createHash("sha512").update(content).digest("base64")}`;
}

export function integrityForBundle(bundle: SkillBundle): string {
  return integrityFor(canonicalBundleBytes(bundle));
}

export function validateBundlePaths(
  bundle: SkillBundle,
  limits: SkillBundleLimits = DEFAULT_BUNDLE_LIMITS,
): void {
  if (bundle.files.length > limits.maxFiles) {
    throw new Error(`Skill has more than ${limits.maxFiles} files`);
  }

  const paths = new Set<string>();
  let totalBytes = 0;
  for (const file of bundle.files) {
    if (file.path.includes("\\") || file.path.includes("\0")) {
      throw new Error(`Invalid skill path: ${file.path}`);
    }
    const normalized = posix.normalize(file.path);
    if (
      normalized !== file.path ||
      normalized.startsWith("../") ||
      normalized === ".." ||
      posix.isAbsolute(normalized)
    ) {
      throw new Error(`Unsafe skill path: ${file.path}`);
    }
    if (paths.has(normalized)) {
      throw new Error(`Duplicate skill path: ${file.path}`);
    }
    paths.add(normalized);

    const size = Buffer.byteLength(file.content, "base64");
    if (size > limits.maxFileBytes) {
      throw new Error(`Skill file exceeds size limit: ${file.path}`);
    }
    totalBytes += size;
    if (totalBytes > limits.maxTotalBytes) {
      throw new Error("Skill bundle exceeds total size limit");
    }
  }

  if (!paths.has("SKILL.md")) {
    throw new Error("Skill bundle must contain SKILL.md");
  }
}

export function validateSkillBundle(input: unknown): SkillBundle {
  const bundle = skillBundleSchema.parse(input);
  validateBundlePaths(bundle);
  const skillMarkdown = bundle.files.find((file) => file.path === "SKILL.md");
  if (!skillMarkdown) throw new Error("Skill bundle must contain SKILL.md");
  const parsed = parseSkillMarkdown(
    Buffer.from(skillMarkdown.content, "base64").toString("utf8"),
  );
  const expectedName = bundle.id.split("/")[1];
  if (parsed.metadata.name !== expectedName) {
    throw new Error(
      `SKILL.md name ${parsed.metadata.name} does not match bundle id ${bundle.id}`,
    );
  }
  return bundle;
}

async function collectFiles(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = resolve(directory, entry.name);
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink()) {
      throw new Error(`Skill sources may not contain symlinks: ${absolute}`);
    }
    if (stat.isDirectory()) files.push(...(await collectFiles(root, absolute)));
    else if (stat.isFile())
      files.push(relative(root, absolute).replaceAll("\\", "/"));
  }
  return files;
}

export async function createSkillBundle(input: {
  directory: string;
  id: string;
  version: string;
}): Promise<SkillBundle> {
  const directory = resolve(input.directory);
  const paths = await collectFiles(directory);
  const files = await Promise.all(
    paths.map(async (path) => ({
      path,
      encoding: "base64" as const,
      content: (await readFile(resolve(directory, path))).toString("base64"),
    })),
  );
  const skillMarkdown = files.find((file) => file.path === "SKILL.md");
  if (!skillMarkdown) throw new Error("Skill source must contain SKILL.md");
  const { metadata } = parseSkillMarkdown(
    Buffer.from(skillMarkdown.content, "base64").toString("utf8"),
  );
  return validateSkillBundle({
    formatVersion: 1,
    id: input.id,
    version: input.version,
    metadata,
    files,
  });
}

export function registryUrlFromEnv(
  envName: string,
  env: NodeJS.ProcessEnv = process.env,
): URL {
  const value = env[envName];
  if (!value) {
    throw new Error(`${envName} must point to the AgenTick registry`);
  }
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error(`${envName} must use http or https`);
  }
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (url.protocol !== "https:" && !localHosts.has(url.hostname)) {
    throw new Error(`${envName} must use https outside local development`);
  }
  return url;
}
