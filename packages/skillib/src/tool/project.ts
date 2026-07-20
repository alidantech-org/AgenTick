import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join, resolve } from "node:path";
import { execa } from "execa";
import {
  parseAgentickConfig,
  type AgentickConfig,
} from "@alidantech/skillib-config";

export interface ProjectContext {
  root: string;
  agentsDir: string;
  configPath: string;
}

export async function discoverProject(
  cwd = process.cwd(),
): Promise<ProjectContext> {
  const result = await execa("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    reject: false,
  });
  if (result.exitCode !== 0 || !result.stdout.trim()) {
    throw new Error(
      `Skillib must run inside a Git working tree. Current path: ${cwd}`,
    );
  }
  // Git Bash may print Windows roots with forward slashes while Node APIs return
  // native separators. Resolve the Git result once so every caller receives the
  // canonical path format for the current operating system.
  const root = resolve(result.stdout.trim());
  const agentsDir = join(root, "agents");
  return { root, agentsDir, configPath: join(agentsDir, "skillib.yml") };
}

export async function loadProjectConfig(
  project: ProjectContext,
): Promise<AgentickConfig> {
  try {
    await access(project.configPath, constants.R_OK);
  } catch {
    throw new Error(
      `Missing ${project.configPath}. Run \`skillib init\` first.`,
    );
  }
  return parseAgentickConfig(await readFile(project.configPath, "utf8"));
}
