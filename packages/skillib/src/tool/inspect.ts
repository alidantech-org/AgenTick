import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execa } from "execa";
import {
  parseSkillDeclaration,
  parseSkillLock,
} from "@alidantech/skillib-config";
import type { AgentickEvent } from "@alidantech/skillib-shared";
import { HistoryStore } from "./history.js";
import { discoverProject, loadProjectConfig } from "./project.js";

export interface ProjectStatus {
  root: string;
  project: string;
  branch: string;
  dirtyFiles: number;
  recentEvents: AgentickEvent[];
}

export async function inspectProject(
  cwd = process.cwd(),
): Promise<ProjectStatus> {
  const project = await discoverProject(cwd);
  const config = await loadProjectConfig(project);
  const branch = await execa("git", ["branch", "--show-current"], {
    cwd: project.root,
    reject: false,
  });
  const status = await execa("git", ["status", "--porcelain"], {
    cwd: project.root,
    reject: false,
  });
  const history = new HistoryStore(project);
  const recentEvents = await history.recent(10);
  history.close();
  return {
    root: project.root,
    project: config.project.name,
    branch: branch.stdout.trim() || "(detached)",
    dirtyFiles: status.stdout.split("\n").filter(Boolean).length,
    recentEvents,
  };
}

export async function listProjectSkills(cwd = process.cwd()): Promise<
  Array<{
    id: string;
    requested: string;
    enabled: boolean;
    locked?: string;
    integrity?: string;
  }>
> {
  const project = await discoverProject(cwd);
  const declarations = parseSkillDeclaration(
    await readFile(join(project.agentsDir, "skills.yml"), "utf8"),
  );
  const lock = parseSkillLock(
    await readFile(join(project.agentsDir, "skills.lock.yml"), "utf8"),
  );
  return declarations.skills.map((skill) => {
    const locked = lock.skills[skill.id];
    return {
      id: skill.id,
      requested: skill.version,
      enabled: skill.enabled,
      ...(locked
        ? { locked: locked.version, integrity: locked.integrity }
        : {}),
    };
  });
}
