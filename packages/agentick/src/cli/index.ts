#!/usr/bin/env node
import { cac } from "cac";
import {
  addSkillDeclaration,
  initializeProject,
  inspectProject,
  listProjectSkills,
  loginToRegistry,
  logoutFromRegistry,
  pullSkills,
  pushSkill,
  registryIdentity,
  removeSkillDeclaration,
  verifyProject,
  watchProject,
} from "../tool/runtime.js";
import { promptSecret, ui } from "./ui.js";

const cli = cac("agentick");

function parseSkillSpec(
  spec: string,
  explicitVersion?: string,
): { id: string; version: string } {
  const raw = spec.trim();
  const slash = raw.indexOf("/");
  const versionSeparator = raw.lastIndexOf("@");
  if (slash < 1) throw new Error("Skill id must use namespace/name");
  if (versionSeparator > slash) {
    return {
      id: raw.slice(0, versionSeparator).toLowerCase(),
      version:
        explicitVersion?.trim() || raw.slice(versionSeparator + 1) || "latest",
    };
  }
  return {
    id: raw.toLowerCase(),
    version: explicitVersion?.trim() || "latest",
  };
}

cli
  .command("init", "Initialize a self-contained agents/ directory")
  .action(async () => {
    try {
      ui.title("AgenTick init");
      const result = await initializeProject();
      ui.success(`Initialized ${result.root}`);
      ui.info(
        `${result.created.length} files created; existing files preserved`,
      );
      ui.info(
        result.gitignoreUpdated
          ? ".gitignore updated safely"
          : ".gitignore already configured",
      );
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("verify", "Validate agents/ and run configured checks")
  .option("--no-commands", "Validate files without running commands")
  .action(async (options: { commands?: boolean }) => {
    try {
      ui.title("AgenTick verify");
      const result = await verifyProject(
        process.cwd(),
        options.commands !== false,
      );
      for (const check of result.checks) {
        (check.passed ? ui.success : ui.error)(
          `${check.name}: ${check.message}`,
        );
      }
      if (!result.passed) process.exitCode = 1;
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("watch", "Watch project changes and serve the live dashboard")
  .option("--port <port>", "Local dashboard port")
  .action(async (options: { port?: string }) => {
    try {
      ui.title("AgenTick watch");
      const runtime = await watchProject(
        process.cwd(),
        options.port ? Number(options.port) : undefined,
      );
      ui.success(`Watching project at ${runtime.url}`);
      const stop = async (): Promise<void> => {
        await runtime.close();
        process.exit(0);
      };
      process.once("SIGINT", () => void stop());
      process.once("SIGTERM", () => void stop());
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("status", "Show current project and watch history status")
  .action(async () => {
    try {
      ui.title("AgenTick status");
      const status = await inspectProject();
      ui.info(`Project: ${status.project}`);
      ui.info(`Root: ${status.root}`);
      ui.info(`Branch: ${status.branch}`);
      ui.info(`Dirty files: ${status.dirtyFiles}`);
      ui.info(`Recent events: ${status.recentEvents.length}`);
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli.command("history", "Show recent AgenTick events").action(async () => {
  try {
    ui.title("AgenTick history");
    const status = await inspectProject();
    if (status.recentEvents.length === 0) {
      ui.info("No recorded events");
      return;
    }
    for (const event of status.recentEvents) {
      ui.info(
        `${event.timestamp}  ${event.type}${event.path ? `  ${event.path}` : ""}`,
      );
    }
  } catch (error) {
    ui.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
});

async function printSkills(): Promise<void> {
  const skills = await listProjectSkills();
  if (skills.length === 0) {
    ui.info("No registry skills declared in agents/skills.yml");
    return;
  }
  for (const skill of skills) {
    ui.info(
      `${skill.enabled ? "enabled" : "disabled"}  ${skill.id}@${skill.requested}${skill.locked ? ` → ${skill.locked}` : " (unlocked)"}`,
    );
  }
}

cli
  .command("skills", "List declared and locked project skills")
  .action(async () => {
    try {
      ui.title("AgenTick skills");
      await printSkills();
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("skill list", "List declared and locked project skills")
  .action(async () => {
    try {
      ui.title("AgenTick skill list");
      await printSkills();
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("skill add <id>", "Add a skill declaration and install it")
  .option("--version <version>", "Version or range to request")
  .option("--no-pull", "Only update agents/skills.yml")
  .action(async (id: string, options: { version?: string; pull?: boolean }) => {
    try {
      ui.title("AgenTick skill add");
      const skill = parseSkillSpec(id, options.version);
      const declared = await addSkillDeclaration(skill);
      ui.success(`Declared ${declared.id}@${declared.version}`);
      if (options.pull !== false) {
        const installed = await pullSkills();
        const match = installed.find((skill) => skill.id === declared.id);
        if (match) ui.success(`Installed ${match.id}@${match.version}`);
      }
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command(
    "skill remove <id>",
    "Remove a skill declaration and installed files",
  )
  .action(async (id: string) => {
    try {
      ui.title("AgenTick skill remove");
      const removed = await removeSkillDeclaration(id.trim().toLowerCase());
      if (removed) ui.success(`Removed ${id}`);
      else ui.info(`${id} is not declared`);
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("pull", "Resolve and install skills declared in agents/skills.yml")
  .action(async () => {
    try {
      ui.title("AgenTick pull");
      const installed = await pullSkills();
      if (installed.length === 0) {
        ui.info("No enabled skills to install");
        return;
      }
      for (const skill of installed) {
        ui.success(`Installed ${skill.id}@${skill.version}`);
      }
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("login", "Save and verify a registry token for this project")
  .option("--token <token>", "Token created in the AgenTick account dashboard")
  .action(async (options: { token?: string }) => {
    try {
      ui.title("AgenTick login");
      const token =
        options.token?.trim() || (await promptSecret("Publishing token"));
      if (!token) throw new Error("A token is required");
      const identity = await loginToRegistry({ token });
      ui.success(`Logged in as @${identity.account.handle}`);
      ui.info(`Scopes: ${identity.scopes.join(", ")}`);
      ui.info(
        "Credential saved to agents/.agentick/auth.json (git ignored, mode 0600)",
      );
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli.command("logout", "Remove the saved registry token").action(async () => {
  try {
    ui.title("AgenTick logout");
    const removed = await logoutFromRegistry();
    if (removed) ui.success("Registry credentials removed");
    else ui.info("No saved credentials were found");
  } catch (error) {
    ui.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
});

cli
  .command("whoami", "Show the account for the active registry token")
  .action(async () => {
    try {
      ui.title("AgenTick whoami");
      const identity = await registryIdentity();
      ui.success(`@${identity.account.handle}`);
      ui.info(identity.account.email);
      ui.info(`Scopes: ${identity.scopes.join(", ")}`);
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command("push <directory>", "Publish a project-owned Agent Skill")
  .option("--id <id>", "Registry id in namespace/name form")
  .option("--version <version>", "Immutable skill version")
  .option("--visibility <visibility>", "Publish as public or private", {
    default: "public",
  })
  .action(
    async (
      directory: string,
      options: { id?: string; version?: string; visibility?: string },
    ) => {
      try {
        ui.title("AgenTick push");
        if (!options.id || !options.version) {
          throw new Error("Both --id and --version are required");
        }
        const visibility =
          options.visibility === "private" ? "private" : "public";
        const published = await pushSkill({
          directory,
          id: options.id,
          version: options.version,
          visibility,
        });
        ui.success(
          `Published ${published.id}@${published.version} (${published.integrity})`,
        );
      } catch (error) {
        ui.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    },
  );

cli.help();
cli.version("0.1.0");
cli.parse();
