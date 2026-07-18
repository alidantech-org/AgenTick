#!/usr/bin/env node
import { cac } from 'cac';
import {
  initializeProject,
  inspectProject,
  listProjectSkills,
  pullSkills,
  pushSkill,
  verifyProject,
  watchProject,
} from '../tool/runtime.js';
import { ui } from './ui.js';

const cli = cac('agentick');

cli
  .command('init', 'Initialize a self-contained agents/ directory')
  .action(async () => {
    try {
      ui.title('AgenTick init');
      const result = await initializeProject();
      ui.success(`Initialized ${result.root}`);
      ui.info(`${result.created.length} files created; existing files preserved`);
      ui.info(
        result.gitignoreUpdated
          ? '.gitignore updated safely'
          : '.gitignore already configured',
      );
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli
  .command('verify', 'Validate agents/ and run configured checks')
  .option('--no-commands', 'Validate files without running commands')
  .action(async (options: { commands?: boolean }) => {
    try {
      ui.title('AgenTick verify');
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
  .command('watch', 'Watch project changes and serve the live dashboard')
  .option('--port <port>', 'Local dashboard port')
  .action(async (options: { port?: string }) => {
    try {
      ui.title('AgenTick watch');
      const runtime = await watchProject(
        process.cwd(),
        options.port ? Number(options.port) : undefined,
      );
      ui.success(`Watching project at ${runtime.url}`);
      const stop = async (): Promise<void> => {
        await runtime.close();
        process.exit(0);
      };
      process.once('SIGINT', () => void stop());
      process.once('SIGTERM', () => void stop());
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

cli.command('status', 'Show current project and watch history status').action(
  async () => {
    try {
      ui.title('AgenTick status');
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
  },
);

cli.command('history', 'Show recent AgenTick events').action(async () => {
  try {
    ui.title('AgenTick history');
    const status = await inspectProject();
    if (status.recentEvents.length === 0) {
      ui.info('No recorded events');
      return;
    }
    for (const event of status.recentEvents) {
      ui.info(
        `${event.timestamp}  ${event.type}${event.path ? `  ${event.path}` : ''}`,
      );
    }
  } catch (error) {
    ui.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
});

cli.command('skills', 'List declared and locked project skills').action(
  async () => {
    try {
      ui.title('AgenTick skills');
      const skills = await listProjectSkills();
      if (skills.length === 0) {
        ui.info('No registry skills declared in agents/skills.yml');
        return;
      }
      for (const skill of skills) {
        ui.info(
          `${skill.enabled ? 'enabled' : 'disabled'}  ${skill.id}@${skill.requested}${skill.locked ? ` → ${skill.locked}` : ' (unlocked)'}`,
        );
      }
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
);


cli.command('pull', 'Resolve and install skills declared in agents/skills.yml').action(
  async () => {
    try {
      ui.title('AgenTick pull');
      const installed = await pullSkills();
      if (installed.length === 0) {
        ui.info('No enabled skills to install');
        return;
      }
      for (const skill of installed) {
        ui.success(`Installed ${skill.id}@${skill.version}`);
      }
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
);

cli
  .command('push <directory>', 'Publish a project-owned Agent Skill')
  .option('--id <id>', 'Registry id in namespace/name form')
  .option('--version <version>', 'Immutable skill version')
  .action(
    async (
      directory: string,
      options: { id?: string; version?: string },
    ) => {
      try {
        ui.title('AgenTick push');
        if (!options.id || !options.version) {
          throw new Error('Both --id and --version are required');
        }
        const published = await pushSkill({
          directory,
          id: options.id,
          version: options.version,
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
cli.version('0.1.0');
cli.parse();
