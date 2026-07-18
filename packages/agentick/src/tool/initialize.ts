import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { discoverProject } from './project.js';
import { projectTemplates } from './templates.js';
import { HistoryStore } from './history.js';

const IGNORE_START = '# >>> AgenTick managed >>>';
const IGNORE_BLOCK = `${IGNORE_START}
/agents/skillib/
/agents/.agentick/
# <<< AgenTick managed <<<
`;

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function writeIfMissing(path: string, content: string): Promise<boolean> {
  try {
    await readFile(path);
    return false;
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
    return true;
  }
}

async function updateGitignore(root: string): Promise<boolean> {
  const path = join(root, '.gitignore');
  let current = '';
  try {
    current = await readFile(path, 'utf8');
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
  if (current.includes(IGNORE_START)) return false;
  const normalized = current.length === 0 ? '' : `${current.trimEnd()}

`;
  await writeFile(path, `${normalized}${IGNORE_BLOCK}`, 'utf8');
  return true;
}

export async function initializeProject(
  cwd = process.cwd(),
): Promise<{ root: string; created: string[]; gitignoreUpdated: boolean }> {
  const project = await discoverProject(cwd);
  await mkdir(project.agentsDir, { recursive: true });
  const created: string[] = [];

  for (const [relativePath, content] of Object.entries(projectTemplates(basename(project.root)))) {
    const target = join(project.agentsDir, relativePath);
    if (await writeIfMissing(target, content)) created.push(`agents/${relativePath}`);
  }

  await mkdir(join(project.agentsDir, 'skillib'), { recursive: true });
  const gitignoreUpdated = await updateGitignore(project.root);
  const history = new HistoryStore(project);
  await history.record('project.initialized', { payload: { created, gitignoreUpdated } });
  history.close();
  return { root: project.root, created, gitignoreUpdated };
}
