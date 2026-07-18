import { access, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execa } from 'execa';
import { describe, expect, it } from 'vitest';
import { initializeProject } from './initialize.js';

async function repository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'agentick-'));
  await execa('git', ['init', '-b', 'main'], { cwd: root });
  return root;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

describe('initializeProject', () => {
  it('discovers the Git root from a nested current directory', async () => {
    const root = await repository();
    const nested = join(root, 'packages', 'api');
    await mkdir(nested, { recursive: true });

    const result = await initializeProject(nested);

    expect(result.root).toBe(root);
    expect(await exists(join(root, 'agents', 'agentick.yml'))).toBe(true);
    expect(await exists(join(nested, 'agents'))).toBe(false);
  });

  it('preserves root files and appends only managed gitignore entries', async () => {
    const root = await repository();
    await writeFile(join(root, 'existing.txt'), 'keep', 'utf8');
    await writeFile(join(root, '.gitignore'), 'custom-cache/\n', 'utf8');

    const result = await initializeProject(root);

    expect(await readFile(join(root, 'existing.txt'), 'utf8')).toBe('keep');
    const ignore = await readFile(join(root, '.gitignore'), 'utf8');
    expect(ignore).toContain('custom-cache/');
    expect(ignore).toContain('/agents/skillib/');
    expect(ignore).toContain('/agents/.agentick/');
    expect(result.created).toContain('agents/agentick.yml');
    expect(result.created).toContain('agents/AGENTS.md');
    expect(await exists(join(root, 'AGENTS.md'))).toBe(false);
  });

  it('is idempotent and does not overwrite user edits', async () => {
    const root = await repository();
    await initializeProject(root);
    await writeFile(
      join(root, 'agents', 'INSTRUCTIONS.md'),
      'custom instructions',
      'utf8',
    );

    const second = await initializeProject(root);

    expect(await readFile(join(root, 'agents', 'INSTRUCTIONS.md'), 'utf8')).toBe(
      'custom instructions',
    );
    expect(second.gitignoreUpdated).toBe(false);
  });
});
