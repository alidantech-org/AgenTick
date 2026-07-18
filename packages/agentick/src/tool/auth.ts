import { randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { registryUrlFromEnv } from "@alidantech/agentick-skill-lib";
import { HistoryStore } from "./history.js";
import {
  discoverProject,
  loadProjectConfig,
  type ProjectContext,
} from "./project.js";

interface StoredCredentials {
  version: 1;
  registry: string;
  token: string;
  account: {
    id: string;
    email: string;
    handle: string;
    displayName: string | null;
  };
  scopes: string[];
  savedAt: string;
}

interface MeResponse {
  account: StoredCredentials["account"];
  scopes: string[];
}

function credentialPath(project: ProjectContext): string {
  return join(project.agentsDir, ".agentick", "auth.json");
}

async function readCredentials(
  project: ProjectContext,
): Promise<StoredCredentials | null> {
  try {
    const parsed = JSON.parse(
      await readFile(credentialPath(project), "utf8"),
    ) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Partial<StoredCredentials>;
    if (
      value.version !== 1 ||
      typeof value.registry !== "string" ||
      typeof value.token !== "string"
    ) {
      return null;
    }
    return value as StoredCredentials;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return null;
    throw error;
  }
}

async function fetchIdentity(
  registry: URL,
  token: string,
): Promise<MeResponse> {
  const response = await fetch(new URL("/api/v1/auth/me", registry), {
    headers: { authorization: `Bearer ${token}` },
    redirect: "error",
  });
  if (!response.ok) {
    throw new Error(
      `Registry rejected the token: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as MeResponse;
}

export async function loginToRegistry(input: {
  cwd?: string;
  token: string;
  env?: NodeJS.ProcessEnv;
}): Promise<MeResponse> {
  const project = await discoverProject(input.cwd ?? process.cwd());
  const config = await loadProjectConfig(project);
  const registry = registryUrlFromEnv(
    config.registry.urlEnv,
    input.env ?? process.env,
  );
  const token = input.token.trim();
  if (!token.startsWith("agt_"))
    throw new Error("Expected an AgenTick token beginning with agt_");
  const identity = await fetchIdentity(registry, token);
  const path = credentialPath(project);
  await mkdir(dirname(path), { recursive: true });
  const content = `${JSON.stringify(
    {
      version: 1,
      registry: registry.origin,
      token,
      account: identity.account,
      scopes: identity.scopes,
      savedAt: new Date().toISOString(),
    } satisfies StoredCredentials,
    null,
    2,
  )}\n`;
  const tempPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(tempPath, content, { encoding: "utf8", mode: 0o600 });
  await chmod(tempPath, 0o600).catch(() => undefined);
  await rm(path, { force: true });
  await rename(tempPath, path);
  await chmod(path, 0o600).catch(() => undefined);
  const history = new HistoryStore(project);
  await history.record("registry.login", {
    path: "agents/.agentick/auth.json",
    payload: { registry: registry.origin, handle: identity.account.handle },
  });
  history.close();
  return identity;
}

export async function logoutFromRegistry(
  cwd = process.cwd(),
): Promise<boolean> {
  const project = await discoverProject(cwd);
  const path = credentialPath(project);
  const existed = Boolean(await readCredentials(project));
  await rm(path, { force: true });
  if (existed) {
    const history = new HistoryStore(project);
    await history.record("registry.logout", {
      path: "agents/.agentick/auth.json",
    });
    history.close();
  }
  return existed;
}

export async function registryIdentity(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<MeResponse> {
  const project = await discoverProject(cwd);
  const config = await loadProjectConfig(project);
  const registry = registryUrlFromEnv(config.registry.urlEnv, env);
  const token = await resolveRegistryToken(project, registry, env);
  if (!token)
    throw new Error(
      "Not logged in. Create a token on the site and run `agentick login`.",
    );
  return fetchIdentity(registry, token);
}

export async function resolveRegistryToken(
  project: ProjectContext,
  registry: URL,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | null> {
  if (env.AGENTICK_TOKEN?.trim()) return env.AGENTICK_TOKEN.trim();
  const stored = await readCredentials(project);
  if (!stored) return null;
  if (stored.registry !== registry.origin) {
    throw new Error(
      `Stored credentials belong to ${stored.registry}, but the configured registry is ${registry.origin}. Run \`agentick login\` again.`,
    );
  }
  return stored.token;
}
