import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, relative } from 'node:path';
import { execa } from 'execa';
import {
  parseSkillDeclaration,
  parseSkillLock,
  type AgentickConfig,
} from '@alidantech/agentick-config';
import { discoverProject, loadProjectConfig } from './project.js';
import { HistoryStore } from './history.js';

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function outputSummary(stdout: string, stderr: string): string {
  const output = [stdout, stderr].filter(Boolean).join('\n').trim();
  return output.length > 2_000 ? output.slice(-2_000) : output;
}

export async function verifyProject(
  cwd = process.cwd(),
  runCommands = true,
): Promise<VerificationResult> {
  const project = await discoverProject(cwd);
  const history = new HistoryStore(project);
  await history.record('verification.started');
  const checks: VerificationCheck[] = [];
  let config: AgentickConfig;

  try {
    config = await loadProjectConfig(project);
    checks.push({
      name: 'config',
      passed: true,
      message: 'agents/agentick.yml is valid',
    });
  } catch (error) {
    checks.push({
      name: 'config',
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    });
    await history.record('verification.finished', {
      payload: { passed: false, checks },
    });
    history.close();
    return { passed: false, checks };
  }

  for (const file of [
    'AGENTS.md',
    'README.md',
    'INSTRUCTIONS.md',
    'skills.yml',
    'skills.lock.yml',
  ]) {
    const present = await exists(join(project.agentsDir, file));
    checks.push({
      name: `agents/${file}`,
      passed: present,
      message: present ? 'present' : 'missing',
    });
  }

  try {
    const declarations = parseSkillDeclaration(
      await readFile(join(project.agentsDir, 'skills.yml'), 'utf8'),
    );
    const lock = parseSkillLock(
      await readFile(join(project.agentsDir, 'skills.lock.yml'), 'utf8'),
    );
    checks.push({ name: 'skills declaration', passed: true, message: 'valid' });
    checks.push({ name: 'skills lock', passed: true, message: 'valid' });

    for (const skill of declarations.skills.filter((item) => item.enabled)) {
      const locked = lock.skills[skill.id];
      checks.push({
        name: `skill lock:${skill.id}`,
        passed: Boolean(locked),
        message: locked
          ? `locked to ${locked.version}`
          : `enabled skill ${skill.id} is not locked; run agentick pull`,
      });
    }
  } catch (error) {
    checks.push({
      name: 'skills metadata',
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const gitignore = await readFile(join(project.root, '.gitignore'), 'utf8').catch(
    () => '',
  );
  for (const entry of ['/agents/skillib/', '/agents/.agentick/']) {
    const ignored = gitignore.includes(entry);
    checks.push({
      name: `gitignore ${entry}`,
      passed: ignored,
      message: ignored ? 'managed path ignored' : 'missing ignore entry',
    });
  }

  const trackedGenerated = await execa(
    'git',
    ['ls-files', 'agents/skillib', 'agents/.agentick'],
    { cwd: project.root, reject: false },
  );
  checks.push({
    name: 'generated state tracking',
    passed: trackedGenerated.stdout.trim().length === 0,
    message: trackedGenerated.stdout.trim()
      ? `generated files are tracked: ${trackedGenerated.stdout.trim()}`
      : 'managed skill library and runtime state are untracked',
  });

  if (runCommands) {
    for (const command of config.verify.commands) {
      await history.record('command.started', {
        payload: { name: command.name, command: command.run },
      });
      const result = await execa(command.run, {
        cwd: project.root,
        shell: true,
        reject: false,
      });
      const commandPassed = result.exitCode === 0;
      const passed = commandPassed || !command.required;
      const summary = outputSummary(result.stdout, result.stderr);
      checks.push({
        name: `command:${command.name}`,
        passed,
        message: `exit ${result.exitCode}${summary ? `: ${summary}` : ''}`,
      });
      await history.record('command.finished', {
        payload: {
          name: command.name,
          command: command.run,
          required: command.required,
          exitCode: result.exitCode,
          stdout: result.stdout.slice(-100_000),
          stderr: result.stderr.slice(-100_000),
        },
      });
    }
  }

  const passed = checks.every((check) => check.passed);
  await history.record('verification.finished', {
    payload: {
      passed,
      checks,
      cwd: relative(project.root, cwd) || '.',
    },
  });
  history.close();
  return { passed, checks };
}
