import { createHash, randomUUID } from 'node:crypto';
import {
  chmod,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import {
  parseSkillDeclaration,
  parseSkillLock,
  toYaml,
  type SkillLock,
} from '@alidantech/agentick-config';
import {
  createSkillBundle,
  integrityForBundle,
  registryUrlFromEnv,
  validateSkillBundle,
  type SkillBundle,
} from '@alidantech/agentick-skill-lib';
import { HistoryStore } from './history.js';
import { discoverProject, loadProjectConfig } from './project.js';

interface ResolvedSkillResponse {
  id: string;
  version: string;
  integrity: string;
  resolved: string;
  bundle: unknown;
}

function contentIntegrity(content: string): string {
  return `sha512-${createHash('sha512').update(content, 'utf8').digest('base64')}`;
}

async function writeAtomically(path: string, content: string): Promise<void> {
  const directory = dirname(path);
  const temp = join(directory, `.${basename(path)}.${randomUUID()}.tmp`);
  const backup = join(directory, `.${basename(path)}.${randomUUID()}.bak`);
  let movedExisting = false;

  await mkdir(directory, { recursive: true });
  await writeFile(temp, content, 'utf8');
  try {
    try {
      await rename(path, backup);
      movedExisting = true;
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
        throw error;
      }
    }
    await rename(temp, path);
    if (movedExisting) await rm(backup, { force: true });
  } catch (error) {
    await rm(temp, { force: true });
    if (movedExisting) await rename(backup, path).catch(() => undefined);
    throw error;
  }
}

async function makeWritable(path: string): Promise<void> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    await chmod(path, 0o755).catch(() => undefined);
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) await makeWritable(child);
      else await chmod(child, 0o644).catch(() => undefined);
    }
  } catch {
    // The path may not exist yet.
  }
}

async function makeReadOnly(path: string): Promise<void> {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await makeReadOnly(child);
    else await chmod(child, 0o444).catch(() => undefined);
  }
  await chmod(path, 0o555).catch(() => undefined);
}

async function installBundle(
  agentsDir: string,
  bundle: SkillBundle,
): Promise<void> {
  const [namespace, name] = bundle.id.split('/');
  if (!namespace || !name) throw new Error(`Invalid skill id: ${bundle.id}`);
  const tempRoot = join(agentsDir, '.agentick', 'tmp', randomUUID());
  const tempSkill = join(tempRoot, namespace, name);
  const target = join(agentsDir, 'skillib', namespace, name);
  await mkdir(tempSkill, { recursive: true });

  try {
    for (const file of bundle.files) {
      const destination = resolve(tempSkill, file.path);
      const relativeDestination = relative(tempSkill, destination);
      if (relativeDestination.startsWith('..') || isAbsolute(relativeDestination)) {
        throw new Error(`Unsafe installation path: ${file.path}`);
      }
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, Buffer.from(file.content, 'base64'));
    }
    await makeReadOnly(tempSkill);
    await makeWritable(target);
    await rm(target, { recursive: true, force: true });
    await mkdir(dirname(target), { recursive: true });
    await rename(tempSkill, target);
  } finally {
    await makeWritable(tempRoot);
    await rm(tempRoot, { recursive: true, force: true });
  }
}

function authorizationHeaders(env: NodeJS.ProcessEnv): HeadersInit {
  const token = env.AGENTICK_TOKEN;
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function pullSkills(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<Array<{ id: string; version: string }>> {
  const project = await discoverProject(cwd);
  const config = await loadProjectConfig(project);
  const history = new HistoryStore(project);
  await history.open();

  try {
    const registry = registryUrlFromEnv(config.registry.urlEnv, env);
    const declarations = parseSkillDeclaration(
      await readFile(join(project.agentsDir, 'skills.yml'), 'utf8'),
    );
    const lockPath = join(project.agentsDir, 'skills.lock.yml');
    const existingLock = parseSkillLock(await readFile(lockPath, 'utf8'));
    const nextLock: SkillLock = {
      lockfileVersion: 1,
      registry: registry.origin,
      skills: { ...existingLock.skills },
    };
    const installed: Array<{ id: string; version: string }> = [];

    for (const declaration of declarations.skills.filter((skill) => skill.enabled)) {
      const [namespace, name] = declaration.id.split('/');
      if (!namespace || !name) throw new Error(`Invalid skill id: ${declaration.id}`);
      const url = new URL(
        `/api/v1/skills/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/resolve`,
        registry,
      );
      url.searchParams.set('version', declaration.version);
      const response = await fetch(url, {
        headers: authorizationHeaders(env),
        redirect: 'follow',
      });
      if (!response.ok) {
        throw new Error(
          `Unable to resolve ${declaration.id}: ${response.status} ${await response.text()}`,
        );
      }
      if (new URL(response.url).origin !== registry.origin) {
        throw new Error(`Registry redirect left the configured origin for ${declaration.id}`);
      }
      const resolved = (await response.json()) as ResolvedSkillResponse;
      const bundle = validateSkillBundle(resolved.bundle);
      if (resolved.id !== declaration.id || bundle.id !== declaration.id) {
        throw new Error(`Registry returned the wrong skill for ${declaration.id}`);
      }
      if (resolved.version !== bundle.version) {
        throw new Error(`Registry version and bundle version disagree for ${declaration.id}`);
      }
      const integrity = integrityForBundle(bundle);
      if (integrity !== resolved.integrity) {
        throw new Error(`Integrity verification failed for ${declaration.id}`);
      }
      const resolvedUrl = new URL(resolved.resolved, registry);
      if (resolvedUrl.origin !== registry.origin) {
        throw new Error('Resolved skill URL left the configured registry origin');
      }

      await installBundle(project.agentsDir, bundle);
      nextLock.skills[declaration.id] = {
        version: bundle.version,
        integrity,
        resolved: resolvedUrl.toString(),
      };
      installed.push({ id: declaration.id, version: bundle.version });
      await history.record('skill.pulled', {
        path: `agents/skillib/${declaration.id}`,
        payload: { id: declaration.id, version: bundle.version, integrity },
      });
    }

    const lockContent = toYaml(nextLock);
    const lockRelativePath = 'agents/skills.lock.yml';
    const lockIntegrity = contentIntegrity(lockContent);
    await history.record('tool.write.planned', {
      path: lockRelativePath,
      payload: { integrity: lockIntegrity, reason: 'skill-lock-update' },
    });
    await writeAtomically(lockPath, lockContent);
    await history.record('tool.write.completed', {
      path: lockRelativePath,
      payload: { integrity: lockIntegrity, reason: 'skill-lock-update' },
    });
    return installed;
  } finally {
    history.close();
  }
}

export async function pushSkill(input: {
  cwd?: string;
  directory: string;
  id: string;
  version: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ id: string; version: string; integrity: string }> {
  const project = await discoverProject(input.cwd ?? process.cwd());
  const config = await loadProjectConfig(project);
  const history = new HistoryStore(project);
  await history.open();

  try {
    const env = input.env ?? process.env;
    const registry = registryUrlFromEnv(config.registry.urlEnv, env);
    const token = env.AGENTICK_TOKEN;
    if (!token) {
      throw new Error('AGENTICK_TOKEN is required to publish a skill');
    }
    const skillSourceRoot = resolve(project.agentsDir, 'skills');
    const sourceDirectory = resolve(project.root, input.directory);
    const relativeSource = relative(skillSourceRoot, sourceDirectory);
    if (relativeSource.startsWith('..') || isAbsolute(relativeSource)) {
      throw new Error('Published skill sources must live under agents/skills/');
    }
    const bundle = await createSkillBundle({
      directory: sourceDirectory,
      id: input.id,
      version: input.version,
    });
    const integrity = integrityForBundle(bundle);
    const [namespace, name] = input.id.split('/');
    if (!namespace || !name) throw new Error(`Invalid skill id: ${input.id}`);
    const url = new URL(
      `/api/v1/skills/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/versions`,
      registry,
    );
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ bundle, integrity }),
      redirect: 'error',
    });
    if (!response.ok) {
      throw new Error(`Skill publish failed: ${response.status} ${await response.text()}`);
    }
    await history.record('skill.published', {
      path: `agents/skills/${relativeSource.replaceAll('\\', '/')}`,
      payload: { id: input.id, version: input.version, integrity },
    });
    return { id: input.id, version: input.version, integrity };
  } finally {
    history.close();
  }
}
