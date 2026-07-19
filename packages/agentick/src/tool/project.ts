import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { execa } from "execa";
import {
  parseAgentickConfig,
  type AgentickConfig,
} from "@alidantech/agentick-config";

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
      `AgenTick must run inside a Git working tree. Current path: ${cwd}`,
    );
  }
  const root = result.stdout.trim();
  const agentsDir = join(root, "agents");
  return { root, agentsDir, configPath: join(agentsDir, "agentick.yml") };
}

export async function loadProjectConfig(
  project: ProjectContext,
): Promise<AgentickConfig> {
  try {
    await access(project.configPath, constants.R_OK);
  } catch {
    throw new Error(
      `Missing ${project.configPath}. Run \`agentick init\` first.`,
    );
  }
  return parseAgentickConfig(await readFile(project.configPath, "utf8"));
}
